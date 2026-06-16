import { create } from "zustand";
import type { RestockRequest, RestockRequestStatus } from "../types";
import { storage } from "../utils/storage";
import { generateId } from "../utils/date";
import { useMaterialStore } from "./useMaterialStore";

const mockRestockRequests: RestockRequest[] = [
  {
    id: "req-mock-1",
    materialId: "mat-6",
    quantity: 30,
    estimatedCost: 60,
    applicantId: "user-1",
    reason: "库存不足，同事们都很喜欢喝桂花乌龙茶",
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "req-mock-2",
    materialId: "mat-9",
    quantity: 20,
    estimatedCost: 32,
    applicantId: "user-4",
    reason: "燕麦奶库存告急，乳糖不耐受的同事需要",
    status: "pending",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "req-mock-3",
    materialId: "mat-12",
    quantity: 50,
    estimatedCost: 120,
    applicantId: "user-2",
    reason: "曲奇饼干只剩3块了，下午茶需要补充",
    status: "approved",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    approverId: "user-3",
  },
  {
    id: "req-mock-4",
    materialId: "mat-2",
    quantity: 100,
    estimatedCost: 320,
    applicantId: "user-5",
    reason: "想多囤点货",
    status: "rejected",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    rejectedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    approverId: "user-3",
    rejectReason: "数量过多，仓储空间有限，请减少数量后重新申请",
  },
];

interface RestockRequestState {
  requests: RestockRequest[];
  submitRequest: (
    materialId: string,
    quantity: number,
    estimatedCost: number,
    applicantId: string,
    reason: string
  ) => void;
  approveRequest: (requestId: string, approverId: string) => boolean;
  rejectRequest: (requestId: string, approverId: string, rejectReason: string) => boolean;
  getRequestsByStatus: (status: RestockRequestStatus) => RestockRequest[];
  getRequestsByApplicant: (applicantId: string) => RestockRequest[];
  getPendingCount: () => number;
  getRequestById: (id: string) => RestockRequest | undefined;
  initRequests: () => void;
}

export const useRestockRequestStore = create<RestockRequestState>((set, get) => ({
  requests: [],

  submitRequest: (
    materialId: string,
    quantity: number,
    estimatedCost: number,
    applicantId: string,
    reason: string
  ) => {
    const newRequest: RestockRequest = {
      id: generateId(),
      materialId,
      quantity,
      estimatedCost,
      applicantId,
      reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const updated = [newRequest, ...get().requests];
    set({ requests: updated });
    storage.set("restockRequests", updated);
  },

  approveRequest: (requestId: string, approverId: string) => {
    const request = get().getRequestById(requestId);
    if (!request || request.status !== "pending") return false;

    const materialStore = useMaterialStore.getState();
    materialStore.restockMaterial(
      request.materialId,
      request.quantity,
      approverId,
      request.estimatedCost
    );

    const updated = get().requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: "approved" as RestockRequestStatus,
            approvedAt: new Date().toISOString(),
            approverId,
          }
        : r
    );

    set({ requests: updated });
    storage.set("restockRequests", updated);
    return true;
  },

  rejectRequest: (requestId: string, approverId: string, rejectReason: string) => {
    const request = get().getRequestById(requestId);
    if (!request || request.status !== "pending") return false;

    const updated = get().requests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: "rejected" as RestockRequestStatus,
            rejectedAt: new Date().toISOString(),
            approverId,
            rejectReason,
          }
        : r
    );

    set({ requests: updated });
    storage.set("restockRequests", updated);
    return true;
  },

  getRequestsByStatus: (status: RestockRequestStatus) => {
    return get().requests.filter((r) => r.status === status);
  },

  getRequestsByApplicant: (applicantId: string) => {
    return get().requests.filter((r) => r.applicantId === applicantId);
  },

  getPendingCount: () => {
    return get().requests.filter((r) => r.status === "pending").length;
  },

  getRequestById: (id: string) => {
    return get().requests.find((r) => r.id === id);
  },

  initRequests: () => {
    const saved = storage.get<RestockRequest[] | null>("restockRequests", null);
    set({ requests: saved || mockRestockRequests });
    if (!saved) {
      storage.set("restockRequests", mockRestockRequests);
    }
  },
}));
