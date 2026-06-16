import { create } from "zustand";
import type { Consumption, MaterialCategory, UserStats, MonthlyStats, Material, User } from "../types";
import { mockConsumptions, mockMaterials, mockUsers } from "../data/mockData";
import { storage } from "../utils/storage";
import { generateId, isSameMonth, getStartOfMonth, getEndOfMonth } from "../utils/date";
import { setBudgetConsumptionsCache } from "./useBudgetStore";

let materialsCache: Material[] = mockMaterials;
let usersCache: User[] = mockUsers;

export const setMaterialsCache = (materials: Material[]) => {
  materialsCache = materials;
};

export const setUsersCache = (users: User[]) => {
  usersCache = users;
};

interface ConsumptionState {
  consumptions: Consumption[];
  addConsumption: (userId: string, materialId: string, quantity: number) => void;
  getUserConsumptions: (userId: string) => Consumption[];
  getMonthlyConsumptions: (userId: string, date?: Date) => Consumption[];
  getUserStats: (userId: string, date?: Date) => UserStats;
  getMonthlyStats: (date?: Date) => MonthlyStats;
  getTopUsers: (date?: Date, limit?: number) => { userId: string; total: number; cost: number }[];
  getCategoryStats: (date?: Date) => Record<MaterialCategory, number>;
  initConsumptions: () => void;
}

export const useConsumptionStore = create<ConsumptionState>((set, get) => ({
  consumptions: [],

  addConsumption: (userId: string, materialId: string, quantity: number) => {
    const newConsumption: Consumption = {
      id: generateId(),
      userId,
      materialId,
      quantity,
      timestamp: new Date().toISOString(),
    };

    const updated = [newConsumption, ...get().consumptions];
    set({ consumptions: updated });
    storage.set("consumptions", updated);
    setBudgetConsumptionsCache(updated);
  },

  getUserConsumptions: (userId: string) => {
    return get().consumptions.filter((c) => c.userId === userId);
  },

  getMonthlyConsumptions: (userId: string, date: Date = new Date()) => {
    return get().consumptions.filter((c) => {
      if (c.userId !== userId) return false;
      return isSameMonth(new Date(c.timestamp), date);
    });
  },

  getUserStats: (userId: string, date: Date = new Date()) => {
    const monthly = get().getMonthlyConsumptions(userId, date);
    const materials = materialsCache;

    let totalConsumptions = 0;
    let totalCost = 0;
    const byCategory: Record<MaterialCategory, number> = {
      coffee: 0,
      tea: 0,
      dairy: 0,
      snack: 0,
    };

    monthly.forEach((c) => {
      const material = materials.find((m) => m.id === c.materialId);
      if (material) {
        totalConsumptions += c.quantity;
        totalCost += c.quantity * material.unitPrice;
        byCategory[material.category] += c.quantity;
      }
    });

    return { userId, totalConsumptions, totalCost, byCategory };
  },

  getMonthlyStats: (date: Date = new Date()) => {
    const startOfMonth = getStartOfMonth(date);
    const endOfMonth = getEndOfMonth(date);

    const monthlyConsumptions = get().consumptions.filter((c) => {
      const d = new Date(c.timestamp);
      return d >= startOfMonth && d <= endOfMonth;
    });

    const materials = materialsCache;

    let totalCups = 0;
    let totalCost = 0;
    const activeUserIds = new Set<string>();
    const byMaterial: Record<string, number> = {};

    monthlyConsumptions.forEach((c) => {
      const material = materials.find((m) => m.id === c.materialId);
      if (material) {
        totalCups += c.quantity;
        totalCost += c.quantity * material.unitPrice;
        activeUserIds.add(c.userId);
        byMaterial[material.name] = (byMaterial[material.name] || 0) + c.quantity;
      }
    });

    return {
      month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      totalCups,
      totalCost,
      activeUsers: activeUserIds.size,
      byMaterial,
    };
  },

  getTopUsers: (date: Date = new Date(), limit: number = 10) => {
    const startOfMonth = getStartOfMonth(date);
    const endOfMonth = getEndOfMonth(date);

    const monthlyConsumptions = get().consumptions.filter((c) => {
      const d = new Date(c.timestamp);
      return d >= startOfMonth && d <= endOfMonth;
    });

    const materials = materialsCache;

    const userStats: Record<string, { total: number; cost: number }> = {};

    monthlyConsumptions.forEach((c) => {
      const material = materials.find((m) => m.id === c.materialId);
      if (material) {
        if (!userStats[c.userId]) {
          userStats[c.userId] = { total: 0, cost: 0 };
        }
        userStats[c.userId].total += c.quantity;
        userStats[c.userId].cost += c.quantity * material.unitPrice;
      }
    });

    return Object.entries(userStats)
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  },

  getCategoryStats: (date: Date = new Date()) => {
    const startOfMonth = getStartOfMonth(date);
    const endOfMonth = getEndOfMonth(date);

    const monthlyConsumptions = get().consumptions.filter((c) => {
      const d = new Date(c.timestamp);
      return d >= startOfMonth && d <= endOfMonth;
    });

    const materials = materialsCache;

    const stats: Record<MaterialCategory, number> = {
      coffee: 0,
      tea: 0,
      dairy: 0,
      snack: 0,
    };

    monthlyConsumptions.forEach((c) => {
      const material = materials.find((m) => m.id === c.materialId);
      if (material) {
        stats[material.category] += c.quantity;
      }
    });

    return stats;
  },

  initConsumptions: () => {
    const saved = storage.get<Consumption[] | null>("consumptions", null);
    const data = saved || mockConsumptions;
    set({ consumptions: data });
    setBudgetConsumptionsCache(data);
    if (!saved) {
      storage.set("consumptions", mockConsumptions);
    }
  },
}));
