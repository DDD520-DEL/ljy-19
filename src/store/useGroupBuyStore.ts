import { create } from "zustand";
import type { GroupBuyReservation } from "../types";
import { storage } from "../utils/storage";
import { generateId } from "../utils/date";
import { useRestockRequestStore } from "./useRestockRequestStore";
import { useDutyStore } from "./useDutyStore";
import { useMaterialStore } from "./useMaterialStore";

interface GroupBuyState {
  reservations: GroupBuyReservation[];
  createReservation: (
    creatorId: string,
    materialId: string,
    unitPrice: number,
    targetQuantity: number,
    deadline: string,
    title: string
  ) => GroupBuyReservation;
  joinReservation: (reservationId: string, userId: string, quantity: number) => boolean;
  cancelReservation: (reservationId: string) => void;
  checkAndSettleExpired: () => void;
  getActiveReservations: () => GroupBuyReservation[];
  getSucceededReservations: () => GroupBuyReservation[];
  getCancelledReservations: () => GroupBuyReservation[];
  getReservationById: (id: string) => GroupBuyReservation | undefined;
  getReservationByShareCode: (shareCode: string) => GroupBuyReservation | undefined;
  getTotalCommitted: (reservationId: string) => number;
  hasUserJoined: (reservationId: string, userId: string) => boolean;
  initGroupBuyReservations: () => void;
}

const generateShareCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useGroupBuyStore = create<GroupBuyState>((set, get) => ({
  reservations: [],

  createReservation: (
    creatorId: string,
    materialId: string,
    unitPrice: number,
    targetQuantity: number,
    deadline: string,
    title: string
  ) => {
    let shareCode = generateShareCode();
    const existing = get().reservations;
    while (existing.some((r) => r.shareCode === shareCode)) {
      shareCode = generateShareCode();
    }

    const newReservation: GroupBuyReservation = {
      id: generateId(),
      creatorId,
      materialId,
      title,
      unitPrice,
      targetQuantity,
      deadline,
      status: "active",
      participants: [],
      shareCode,
      createdAt: new Date().toISOString(),
    };

    const updated = [newReservation, ...existing];
    set({ reservations: updated });
    storage.set("groupBuyReservations", updated);
    return newReservation;
  },

  joinReservation: (reservationId: string, userId: string, quantity: number) => {
    const reservation = get().getReservationById(reservationId);
    if (!reservation) return false;
    if (reservation.status !== "active") return false;
    if (new Date(reservation.deadline) <= new Date()) return false;
    if (quantity <= 0) return false;
    if (reservation.participants.some((p) => p.userId === userId)) return false;

    const participant = {
      userId,
      quantity,
      joinedAt: new Date().toISOString(),
    };

    const updated = get().reservations.map((r) => {
      if (r.id !== reservationId) return r;
      return { ...r, participants: [...r.participants, participant] };
    });

    set({ reservations: updated });
    storage.set("groupBuyReservations", updated);
    return true;
  },

  cancelReservation: (reservationId: string) => {
    const reservation = get().getReservationById(reservationId);
    if (!reservation) return;
    if (reservation.status !== "active") return;

    const updated = get().reservations.map((r): GroupBuyReservation => {
      if (r.id !== reservationId) return r;
      return { ...r, status: "cancelled", cancelledAt: new Date().toISOString() };
    });

    set({ reservations: updated });
    storage.set("groupBuyReservations", updated);
  },

  checkAndSettleExpired: () => {
    const now = new Date();
    const expired = get().reservations.filter(
      (r) => r.status === "active" && new Date(r.deadline) <= now
    );
    if (expired.length === 0) return;

    const restockStore = useRestockRequestStore.getState();
    const dutyStore = useDutyStore.getState();
    const materialStore = useMaterialStore.getState();

    const updated = get().reservations.map((r): GroupBuyReservation => {
      if (r.status !== "active" || new Date(r.deadline) > now) return r;

      const totalCommitted = r.participants.reduce((sum, p) => sum + p.quantity, 0);
      const material = materialStore.getMaterialById(r.materialId);
      const unitLabel = material?.unit || "份";

      if (totalCommitted >= r.targetQuantity) {
        const reason = `团购预约「${r.title}」已达目标份数（${totalCommitted}/${r.targetQuantity}${unitLabel}），优惠单价 ¥${r.unitPrice.toFixed(2)}/${unitLabel}，自动生成补货单。`;
        const restockId = restockStore.submitRequest(
          r.materialId,
          totalCommitted,
          totalCommitted * r.unitPrice,
          r.creatorId,
          reason
        );

        const dutyUser = dutyStore.getCurrentDutyUser();
        dutyStore.showUpdateBanner(
          `✅ 团购预约「${r.title}」已达标（${totalCommitted}${unitLabel}），已自动生成补货单，请值班人${dutyUser ? `（${dutyUser.name}）` : ""}前往「补货审批」下单采购`
        );

        return {
          ...r,
          status: "succeeded",
          settledAt: now.toISOString(),
          restockRequestId: restockId,
        };
      }

      dutyStore.showUpdateBanner(
        `❌ 团购预约「${r.title}」未达目标份数（${totalCommitted}/${r.targetQuantity}${unitLabel}），已自动取消`
      );

      return {
        ...r,
        status: "cancelled",
        cancelledAt: now.toISOString(),
      };
    });

    set({ reservations: updated });
    storage.set("groupBuyReservations", updated);
  },

  getActiveReservations: () => {
    return get().reservations.filter((r) => r.status === "active");
  },

  getSucceededReservations: () => {
    return get().reservations.filter((r) => r.status === "succeeded");
  },

  getCancelledReservations: () => {
    return get().reservations.filter((r) => r.status === "cancelled");
  },

  getReservationById: (id: string) => {
    return get().reservations.find((r) => r.id === id);
  },

  getReservationByShareCode: (shareCode: string) => {
    return get().reservations.find((r) => r.shareCode === shareCode.toUpperCase());
  },

  getTotalCommitted: (reservationId: string) => {
    const reservation = get().getReservationById(reservationId);
    if (!reservation) return 0;
    return reservation.participants.reduce((sum, p) => sum + p.quantity, 0);
  },

  hasUserJoined: (reservationId: string, userId: string) => {
    const reservation = get().getReservationById(reservationId);
    if (!reservation) return false;
    return reservation.participants.some((p) => p.userId === userId);
  },

  initGroupBuyReservations: () => {
    const saved = storage.get<GroupBuyReservation[] | null>("groupBuyReservations", null);
    const data = saved || [];
    set({ reservations: data });
    if (!saved) {
      storage.set("groupBuyReservations", data);
    }
  },
}));
