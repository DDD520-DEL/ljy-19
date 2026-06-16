import { create } from "zustand";
import type { UserMonthlyBudget, UserBudgetInfo, Material, User, Consumption } from "../types";
import { mockMonthlyBudgets, mockUsers, mockMaterials } from "../data/mockData";
import { storage } from "../utils/storage";
import { generateId, getStartOfMonth, getEndOfMonth } from "../utils/date";

let materialsCache: Material[] = mockMaterials;
let usersCache: User[] = mockUsers;
let consumptionsCache: Consumption[] = [];

export const setBudgetMaterialsCache = (materials: Material[]) => {
  materialsCache = materials;
};

export const setBudgetUsersCache = (users: User[]) => {
  usersCache = users;
};

export const setBudgetConsumptionsCache = (consumptions: Consumption[]) => {
  consumptionsCache = consumptions;
};

interface BudgetState {
  monthlyBudgets: UserMonthlyBudget[];
  setUserBudget: (userId: string, budget: number, year?: number, month?: number) => void;
  getUserBudget: (userId: string, date?: Date) => number;
  getUserBudgetInfo: (userId: string, date?: Date) => UserBudgetInfo;
  checkCanConsume: (userId: string, materialId: string, quantity: number, date?: Date) => { canConsume: boolean; remaining: number; cost: number };
  getAllUserBudgetInfos: (date?: Date) => UserBudgetInfo[];
  initBudgets: () => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  monthlyBudgets: [],

  setUserBudget: (userId: string, budget: number, year?: number, month?: number) => {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth();

    const existingBudget = get().monthlyBudgets.find(
      (b) => b.userId === userId && b.year === targetYear && b.month === targetMonth
    );

    let updated: UserMonthlyBudget[];
    const nowStr = new Date().toISOString();

    if (existingBudget) {
      updated = get().monthlyBudgets.map((b) =>
        b.id === existingBudget.id ? { ...b, budget, updatedAt: nowStr } : b
      );
    } else {
      const newBudget: UserMonthlyBudget = {
        id: generateId(),
        userId,
        year: targetYear,
        month: targetMonth,
        budget,
        createdAt: nowStr,
        updatedAt: nowStr,
      };
      updated = [...get().monthlyBudgets, newBudget];
    }

    const updatedUser = usersCache.find((u) => u.id === userId);
    if (updatedUser) {
      const userIndex = usersCache.findIndex((u) => u.id === userId);
      usersCache[userIndex] = { ...updatedUser, monthlyBudget: budget };
    }

    set({ monthlyBudgets: updated });
    storage.set("monthlyBudgets", updated);
  },

  getUserBudget: (userId: string, date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const budgetRecord = get().monthlyBudgets.find(
      (b) => b.userId === userId && b.year === year && b.month === month
    );

    if (budgetRecord) {
      return budgetRecord.budget;
    }

    const user = usersCache.find((u) => u.id === userId);
    return user?.monthlyBudget ?? 200;
  },

  getUserBudgetInfo: (userId: string, date: Date = new Date()) => {
    const totalBudget = get().getUserBudget(userId, date);
    const startOfMonth = getStartOfMonth(date);
    const endOfMonth = getEndOfMonth(date);

    const consumptions = consumptionsCache.filter((c) => {
      if (c.userId !== userId) return false;
      const d = new Date(c.timestamp);
      return d >= startOfMonth && d <= endOfMonth;
    });

    const materials = materialsCache;
    let usedAmount = 0;

    consumptions.forEach((c) => {
      const material = materials.find((m) => m.id === c.materialId);
      if (material) {
        usedAmount += c.quantity * material.unitPrice;
      }
    });

    const remainingAmount = Math.max(0, totalBudget - usedAmount);
    const usagePercentage = totalBudget > 0 ? Math.min(100, (usedAmount / totalBudget) * 100) : 0;

    return {
      userId,
      totalBudget,
      usedAmount,
      remainingAmount,
      usagePercentage,
      year: date.getFullYear(),
      month: date.getMonth(),
    };
  },

  checkCanConsume: (userId: string, materialId: string, quantity: number, date: Date = new Date()) => {
    const budgetInfo = get().getUserBudgetInfo(userId, date);
    const material = materialsCache.find((m) => m.id === materialId);
    const cost = material ? material.unitPrice * quantity : 0;
    const canConsume = budgetInfo.remainingAmount >= cost;

    return {
      canConsume,
      remaining: budgetInfo.remainingAmount,
      cost,
    };
  },

  getAllUserBudgetInfos: (date: Date = new Date()) => {
    const users = usersCache;
    return users.map((user) => get().getUserBudgetInfo(user.id, date));
  },

  initBudgets: () => {
    const saved = storage.get<UserMonthlyBudget[] | null>("monthlyBudgets", null);
    set({ monthlyBudgets: saved || mockMonthlyBudgets });
    if (!saved) {
      storage.set("monthlyBudgets", mockMonthlyBudgets);
    }
  },
}));
