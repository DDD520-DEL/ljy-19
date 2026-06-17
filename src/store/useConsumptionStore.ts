import { create } from "zustand";
import type {
  Consumption,
  MaterialCategory,
  UserStats,
  MonthlyStats,
  Material,
  User,
  MaterialConsumptionTrend,
  MonthlyConsumption,
  RestockSuggestion,
  Material as MaterialType,
} from "../types";
import { mockConsumptions, mockMaterials, mockUsers } from "../data/mockData";
import { storage } from "../utils/storage";
import { generateId, isSameMonth, getStartOfMonth, getEndOfMonth, formatDate } from "../utils/date";
import { setBudgetConsumptionsCache } from "./useBudgetStore";

let materialsCache: Material[] = mockMaterials;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let usersCache: User[] = mockUsers;

export const setMaterialsCache = (materials: Material[]) => {
  materialsCache = materials;
};

export const setUsersCache = (users: User[]) => {
  usersCache = users;
};

interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  userIds?: string[];
  categories?: MaterialCategory[];
}

interface ConsumptionState {
  consumptions: Consumption[];
  addConsumption: (userId: string, materialId: string, quantity: number) => Consumption;
  getUserConsumptions: (userId: string) => Consumption[];
  getMonthlyConsumptions: (userId: string, date?: Date) => Consumption[];
  getUserStats: (userId: string, date?: Date) => UserStats;
  getMonthlyStats: (date?: Date) => MonthlyStats;
  getTopUsers: (date?: Date, limit?: number) => { userId: string; total: number; cost: number }[];
  getCategoryStats: (date?: Date) => Record<MaterialCategory, number>;
  getConsumptionsByFilters: (filters: ExportFilters) => Consumption[];
  getMaterialConsumptionTrend: (materialId: string, months?: number) => MaterialConsumptionTrend;
  getAllMaterialConsumptionTrends: (months?: number) => Record<string, MaterialConsumptionTrend>;
  getRestockSuggestions: (materials: MaterialType[]) => RestockSuggestion[];
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
    return newConsumption;
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

  getConsumptionsByFilters: (filters: ExportFilters) => {
    const { startDate, endDate, userIds, categories } = filters;
    const materials = materialsCache;

    return get().consumptions.filter((c) => {
      if (startDate) {
        const d = new Date(c.timestamp);
        if (d < startDate) return false;
      }
      if (endDate) {
        const d = new Date(c.timestamp);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (d > endOfDay) return false;
      }
      if (userIds && userIds.length > 0) {
        if (!userIds.includes(c.userId)) return false;
      }
      if (categories && categories.length > 0) {
        const material = materials.find((m) => m.id === c.materialId);
        if (!material || !categories.includes(material.category)) return false;
      }
      return true;
    });
  },

  getMaterialConsumptionTrend: (materialId: string, months: number = 3) => {
    const now = new Date();
    const monthlyConsumptions: MonthlyConsumption[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = getStartOfMonth(targetDate);
      const endOfMonth = getEndOfMonth(targetDate);
      const monthKey = formatDate(startOfMonth, "YYYY-MM");

      const monthConsumptions = get().consumptions.filter((c) => {
        if (c.materialId !== materialId) return false;
        const d = new Date(c.timestamp);
        return d >= startOfMonth && d <= endOfMonth;
      });

      const totalQuantity = monthConsumptions.reduce((sum, c) => sum + c.quantity, 0);
      monthlyConsumptions.push({ month: monthKey, totalQuantity });
    }

    const validMonths = monthlyConsumptions.filter((m) => m.totalQuantity > 0);
    const totalConsumed = monthlyConsumptions.reduce((sum, m) => sum + m.totalQuantity, 0);
    const threeMonthAverage = totalConsumed / months;
    const dailyAverage = threeMonthAverage / 30;

    let coefficientOfVariation = 0;
    if (validMonths.length > 1 && threeMonthAverage > 0) {
      const mean = totalConsumed / validMonths.length;
      const variance =
        validMonths.reduce((sum, m) => sum + Math.pow(m.totalQuantity - mean, 2), 0) /
        validMonths.length;
      const standardDeviation = Math.sqrt(variance);
      coefficientOfVariation = standardDeviation / mean;
    }

    const isVolatile = coefficientOfVariation > 0.4;

    return {
      materialId,
      monthlyConsumptions,
      threeMonthAverage,
      dailyAverage,
      coefficientOfVariation,
      isVolatile,
    };
  },

  getAllMaterialConsumptionTrends: (months: number = 3) => {
    const materials = materialsCache;
    const result: Record<string, MaterialConsumptionTrend> = {};
    materials.forEach((m) => {
      result[m.id] = get().getMaterialConsumptionTrend(m.id, months);
    });
    return result;
  },

  getRestockSuggestions: (materials: MaterialType[]) => {
    const result: RestockSuggestion[] = [];
    const COVER_DAYS = 30;

    materials.forEach((material) => {
      const trend = get().getMaterialConsumptionTrend(material.id, 3);
      const usableStock = material.batches.reduce((sum, batch) => {
        const expiry = new Date(batch.expiryDate);
        if (expiry < new Date() || batch.remainingQuantity <= 0) return sum;
        return sum + batch.remainingQuantity;
      }, 0);

      const dailyNeed = Math.max(trend.dailyAverage, 0.1);
      const estimatedDays = dailyNeed > 0 ? Math.floor(usableStock / dailyNeed) : 999;

      const targetStock = trend.threeMonthAverage + (trend.isVolatile ? trend.threeMonthAverage * 0.3 : 0);
      let suggestedQuantity = 0;

      if (usableStock < material.threshold || estimatedDays < 15) {
        suggestedQuantity = Math.max(
          Math.ceil(targetStock - usableStock),
          Math.ceil(dailyNeed * COVER_DAYS),
          Math.ceil(material.threshold * 1.5 - usableStock)
        );
        suggestedQuantity = Math.max(suggestedQuantity, 0);
      }

      if (suggestedQuantity > 0 || usableStock < material.threshold) {
        const finalSuggested = suggestedQuantity > 0 ? suggestedQuantity : Math.ceil(material.threshold - usableStock);
        result.push({
          materialId: material.id,
          materialName: material.name,
          materialIcon: material.icon,
          materialColor: material.color,
          materialUnit: material.unit,
          unitPrice: material.unitPrice,
          category: material.category,
          currentStock: usableStock,
          threshold: material.threshold,
          threeMonthAverage: Math.round(trend.threeMonthAverage * 100) / 100,
          dailyAverage: Math.round(dailyNeed * 100) / 100,
          suggestedQuantity: finalSuggested,
          estimatedDays,
          isVolatile: trend.isVolatile,
          trendData: trend.monthlyConsumptions,
          estimatedCost: Math.round(finalSuggested * material.unitPrice * 100) / 100,
        });
      }
    });

    result.sort((a, b) => {
      const aPriority = a.estimatedDays < 7 ? 0 : a.estimatedDays < 15 ? 1 : 2;
      const bPriority = b.estimatedDays < 7 ? 0 : b.estimatedDays < 15 ? 1 : 2;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.suggestedQuantity - a.suggestedQuantity;
    });

    return result;
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
