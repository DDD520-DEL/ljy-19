import { create } from "zustand";
import type {
  RecyclingRecord,
  MonthlyRecyclingStats,
  EnvironmentalImpact,
  RecyclableType,
} from "../types";
import {
  ENVIRONMENTAL_CONVERSION,
  RECYCLABLE_CATEGORIES,
} from "../types";
import { storage } from "../utils/storage";
import { generateId, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth, isSameMonth, formatDate } from "../utils/date";
import { mockUsers } from "../data/mockData";

const getEmptyByType = (): Record<RecyclableType, number> => ({
  coffee_grounds: 0,
  tea_bags: 0,
  packaging_box: 0,
  paper_cups: 0,
  plastic_bottles: 0,
  others: 0,
});

const generateMockRecords = (): RecyclingRecord[] => {
  const records: RecyclingRecord[] = [];
  const now = new Date();

  for (let weekOffset = 0; weekOffset < 12; weekOffset++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - weekOffset * 7);
    const startOfWeek = getStartOfWeek(weekStart);
    const endOfWeek = getEndOfWeek(weekStart);

    const items = RECYCLABLE_CATEGORIES.map((cat) => ({
      type: cat.type,
      weight: Math.round((Math.random() * 5 + 0.5) * 10) / 10,
    })).filter(() => Math.random() > 0.2);

    if (items.length === 0) continue;

    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const recordDate = new Date(endOfWeek);
    recordDate.setHours(18, 0, 0, 0);

    records.push({
      id: generateId(),
      operatorId: randomUser.id,
      weekStart: formatDate(startOfWeek, "YYYY-MM-DD"),
      weekEnd: formatDate(endOfWeek, "YYYY-MM-DD"),
      items,
      notes: weekOffset === 0 ? "本周咖啡渣较多" : undefined,
      createdAt: recordDate.toISOString(),
    });
  }

  return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

interface RecyclingState {
  records: RecyclingRecord[];

  addRecord: (
    operatorId: string,
    weekStart: string,
    weekEnd: string,
    items: { type: RecyclableType; weight: number }[],
    notes?: string
  ) => RecyclingRecord;

  getRecordsByWeek: (weekStart: string, weekEnd: string) => RecyclingRecord[];
  getCurrentWeekRecord: () => RecyclingRecord | null;
  hasRecordedThisWeek: () => boolean;

  getMonthlyStats: (date?: Date) => MonthlyRecyclingStats;
  getHistoricalMonthlyStats: (months?: number) => MonthlyRecyclingStats[];
  getTypeBreakdown: (date?: Date) => { type: RecyclableType; weight: number; percentage: number }[];

  calculateEnvironmentalImpact: (totalWeight: number) => EnvironmentalImpact;
  getMonthlyEnvironmentalImpact: (date?: Date) => EnvironmentalImpact;

  initRecycling: () => void;
}

export const useRecyclingStore = create<RecyclingState>((set, get) => ({
  records: [],

  addRecord: (operatorId, weekStart, weekEnd, items, notes) => {
    const filteredItems = items.filter((item) => item.weight > 0);
    const newRecord: RecyclingRecord = {
      id: generateId(),
      operatorId,
      weekStart,
      weekEnd,
      items: filteredItems,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...get().records];
    set({ records: updated });
    storage.set("recyclingRecords", updated);

    return newRecord;
  },

  getRecordsByWeek: (weekStart, weekEnd) => {
    return get().records.filter(
      (r) => r.weekStart === weekStart && r.weekEnd === weekEnd
    );
  },

  getCurrentWeekRecord: () => {
    const now = new Date();
    const weekStart = formatDate(getStartOfWeek(now), "YYYY-MM-DD");
    const weekEnd = formatDate(getEndOfWeek(now), "YYYY-MM-DD");
    const records = get().getRecordsByWeek(weekStart, weekEnd);
    return records.length > 0 ? records[0] : null;
  },

  hasRecordedThisWeek: () => {
    return get().getCurrentWeekRecord() !== null;
  },

  getMonthlyStats: (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startOfMonth = getStartOfMonth(date);
    const endOfMonth = getEndOfMonth(date);

    const monthRecords = get().records.filter((r) => {
      const recordDate = new Date(r.createdAt);
      return isSameMonth(recordDate, date);
    });

    const byType = getEmptyByType();
    let totalWeight = 0;

    monthRecords.forEach((record) => {
      record.items.forEach((item) => {
        byType[item.type] += item.weight;
        totalWeight += item.weight;
      });
    });

    return {
      year,
      month,
      totalWeight: Math.round(totalWeight * 100) / 100,
      byType,
      recordsCount: monthRecords.length,
    };
  },

  getHistoricalMonthlyStats: (months: number = 6) => {
    const stats: MonthlyRecyclingStats[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      stats.push(get().getMonthlyStats(targetDate));
    }

    return stats;
  },

  getTypeBreakdown: (date: Date = new Date()) => {
    const stats = get().getMonthlyStats(date);
    const { byType, totalWeight } = stats;

    return (Object.keys(byType) as RecyclableType[])
      .filter((type) => byType[type] > 0)
      .map((type) => ({
        type,
        weight: Math.round(byType[type] * 100) / 100,
        percentage: totalWeight > 0 ? Math.round((byType[type] / totalWeight) * 100) : 0,
      }))
      .sort((a, b) => b.weight - a.weight);
  },

  calculateEnvironmentalImpact: (totalWeight: number): EnvironmentalImpact => {
    const {
      plasticCupsPerKg,
      treesPerKg,
      waterLitersPerKg,
      co2KgPerKg,
      energyKwhPerKg,
    } = ENVIRONMENTAL_CONVERSION;

    return {
      plasticCupsSaved: Math.floor(totalWeight * plasticCupsPerKg),
      treesSaved: Math.round(totalWeight * treesPerKg * 100) / 100,
      waterSavedLiters: Math.round(totalWeight * waterLitersPerKg * 10) / 10,
      co2ReducedKg: Math.round(totalWeight * co2KgPerKg * 10) / 10,
      energySavedKwh: Math.round(totalWeight * energyKwhPerKg * 10) / 10,
    };
  },

  getMonthlyEnvironmentalImpact: (date: Date = new Date()) => {
    const stats = get().getMonthlyStats(date);
    return get().calculateEnvironmentalImpact(stats.totalWeight);
  },

  initRecycling: () => {
    const saved = storage.get<RecyclingRecord[] | null>("recyclingRecords", null);
    let records: RecyclingRecord[];

    if (!saved) {
      records = generateMockRecords();
      storage.set("recyclingRecords", records);
    } else {
      records = saved;
    }

    set({ records });
  },
}));
