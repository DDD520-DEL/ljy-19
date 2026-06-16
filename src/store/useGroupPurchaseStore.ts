import { create } from "zustand";
import type { GroupPurchase, GroupPurchaseParticipant, GroupPurchaseParticipantItem } from "../types";
import { storage } from "../utils/storage";
import { generateId } from "../utils/date";

interface GroupPurchaseState {
  groupPurchases: GroupPurchase[];
  createGroupPurchase: (creatorId: string, materialIds: string[], deadline: string) => GroupPurchase;
  joinGroupPurchase: (groupPurchaseId: string, userId: string, items: GroupPurchaseParticipantItem[]) => boolean;
  closeGroupPurchase: (groupPurchaseId: string) => void;
  settleGroupPurchase: (groupPurchaseId: string) => GroupPurchase | null;
  checkAndSettleExpired: () => void;
  getActiveGroupPurchases: () => GroupPurchase[];
  getClosedGroupPurchases: () => GroupPurchase[];
  getSettledGroupPurchases: () => GroupPurchase[];
  getGroupPurchaseById: (id: string) => GroupPurchase | undefined;
  getGroupPurchaseByShareCode: (shareCode: string) => GroupPurchase | undefined;
  getLockedQuantityForMaterial: (materialId: string) => number;
  getAvailableStockForMaterial: (materialId: string, usableStock: number) => number;
  hasUserJoined: (groupPurchaseId: string, userId: string) => boolean;
  initGroupPurchases: () => void;
}

const generateShareCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const useGroupPurchaseStore = create<GroupPurchaseState>((set, get) => ({
  groupPurchases: [],

  createGroupPurchase: (creatorId: string, materialIds: string[], deadline: string) => {
    let shareCode = generateShareCode();
    const existing = get().groupPurchases;
    while (existing.some((gp) => gp.shareCode === shareCode)) {
      shareCode = generateShareCode();
    }

    const newGroupPurchase: GroupPurchase = {
      id: generateId(),
      creatorId,
      materialIds,
      participants: [],
      deadline,
      status: "active",
      shareCode,
      createdAt: new Date().toISOString(),
    };

    const updated = [newGroupPurchase, ...existing];
    set({ groupPurchases: updated });
    storage.set("groupPurchases", updated);
    return newGroupPurchase;
  },

  joinGroupPurchase: (groupPurchaseId: string, userId: string, items: GroupPurchaseParticipantItem[]) => {
    const gp = get().getGroupPurchaseById(groupPurchaseId);
    if (!gp) return false;
    if (gp.status !== "active") return false;
    if (new Date(gp.deadline) <= new Date()) return false;

    const existingParticipant = gp.participants.find((p) => p.userId === userId);
    if (existingParticipant) return false;

    const participant: GroupPurchaseParticipant = {
      userId,
      items,
      joinedAt: new Date().toISOString(),
    };

    const updated = get().groupPurchases.map((g) => {
      if (g.id !== groupPurchaseId) return g;
      return { ...g, participants: [...g.participants, participant] };
    });

    set({ groupPurchases: updated });
    storage.set("groupPurchases", updated);
    return true;
  },

  closeGroupPurchase: (groupPurchaseId: string) => {
    const gp = get().getGroupPurchaseById(groupPurchaseId);
    if (!gp) return;
    if (gp.status !== "active") return;

    const updated = get().groupPurchases.map((g): GroupPurchase => {
      if (g.id !== groupPurchaseId) return g;
      return { ...g, status: "closed", closedAt: new Date().toISOString() };
    });

    set({ groupPurchases: updated });
    storage.set("groupPurchases", updated);
  },

  settleGroupPurchase: (groupPurchaseId: string) => {
    const gp = get().getGroupPurchaseById(groupPurchaseId);
    if (!gp) return null;
    if (gp.status !== "closed") return null;

    const updated = get().groupPurchases.map((g): GroupPurchase => {
      if (g.id !== groupPurchaseId) return g;
      return { ...g, status: "settled", settledAt: new Date().toISOString() };
    });

    set({ groupPurchases: updated });
    storage.set("groupPurchases", updated);
    return get().getGroupPurchaseById(groupPurchaseId) || null;
  },

  checkAndSettleExpired: () => {
    const now = new Date();
    const updated = get().groupPurchases.map((g): GroupPurchase => {
      if (g.status === "active" && new Date(g.deadline) <= now) {
        return { ...g, status: "closed", closedAt: now.toISOString() };
      }
      return g;
    });

    const hasChanges = updated.some((gp, i) => gp.status !== get().groupPurchases[i].status);
    if (hasChanges) {
      set({ groupPurchases: updated });
      storage.set("groupPurchases", updated);
    }
  },

  getActiveGroupPurchases: () => {
    return get().groupPurchases.filter((gp) => gp.status === "active");
  },

  getClosedGroupPurchases: () => {
    return get().groupPurchases.filter((gp) => gp.status === "closed");
  },

  getSettledGroupPurchases: () => {
    return get().groupPurchases.filter((gp) => gp.status === "settled");
  },

  getGroupPurchaseById: (id: string) => {
    return get().groupPurchases.find((gp) => gp.id === id);
  },

  getGroupPurchaseByShareCode: (shareCode: string) => {
    return get().groupPurchases.find((gp) => gp.shareCode === shareCode.toUpperCase());
  },

  getLockedQuantityForMaterial: (materialId: string) => {
    return get().groupPurchases
      .filter((gp) => gp.status === "active" || gp.status === "closed")
      .reduce((total, gp) => {
        return total + gp.participants.reduce((sum, p) => {
          const item = p.items.find((i) => i.materialId === materialId);
          return sum + (item?.quantity || 0);
        }, 0);
      }, 0);
  },

  getAvailableStockForMaterial: (materialId: string, usableStock: number) => {
    const locked = get().getLockedQuantityForMaterial(materialId);
    return Math.max(0, usableStock - locked);
  },

  hasUserJoined: (groupPurchaseId: string, userId: string) => {
    const gp = get().getGroupPurchaseById(groupPurchaseId);
    if (!gp) return false;
    return gp.participants.some((p) => p.userId === userId);
  },

  initGroupPurchases: () => {
    const saved = storage.get<GroupPurchase[] | null>("groupPurchases", null);
    const data = saved || [];
    set({ groupPurchases: data });
    if (!saved) {
      storage.set("groupPurchases", data);
    }
  },
}));
