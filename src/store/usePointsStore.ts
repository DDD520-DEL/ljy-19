import { create } from "zustand";
import type {
  PointsRecord,
  MonthlyPoints,
  LeaderboardEntry,
  MonthlyDrinkerTitle,
  User,
  Badge,
} from "../types";
import {
  DRINKER_TITLE_RANKS,
  POINTS_PER_YUAN,
  badgeConfigs,
} from "../types";
import { storage } from "../utils/storage";
import { generateId, isSameMonth } from "../utils/date";
import { mockUsers, mockConsumptions, mockMaterials } from "../data/mockData";
import { useCheckInStore } from "./useCheckInStore";

let usersCache: User[] = mockUsers;
let materialsCache = mockMaterials;

export const setPointsUsersCache = (users: User[]) => {
  usersCache = users;
};

export const setPointsMaterialsCache = (materials: typeof mockMaterials) => {
  materialsCache = materials;
};

const generateMockPointsRecords = (): PointsRecord[] => {
  const records: PointsRecord[] = [];

  mockConsumptions.forEach((consumption) => {
    const date = new Date(consumption.timestamp);
    const material = materialsCache.find((m) => m.id === consumption.materialId);
    if (!material) return;

    const amount = consumption.quantity * material.unitPrice;
    const points = Math.floor(amount * POINTS_PER_YUAN);

    if (points > 0) {
      records.push({
        id: generateId(),
        userId: consumption.userId,
        points,
        amount,
        consumptionId: consumption.id,
        year: date.getFullYear(),
        month: date.getMonth(),
        timestamp: consumption.timestamp,
      });
    }
  });

  return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateMockDrinkerTitles = (): MonthlyDrinkerTitle[] => {
  const titles: MonthlyDrinkerTitle[] = [];
  const now = new Date();

  for (let monthOffset = 1; monthOffset <= 2; monthOffset++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const monthlyRecords = generateMockPointsRecords().filter(
      (r) => r.year === year && r.month === month
    );

    const userPoints: Record<string, number> = {};
    monthlyRecords.forEach((r) => {
      userPoints[r.userId] = (userPoints[r.userId] || 0) + r.points;
    });

    const sortedUsers = Object.entries(userPoints)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    sortedUsers.forEach(([userId], index) => {
      titles.push({
        userId,
        year,
        month,
        rank: index + 1,
        awardedAt: new Date(year, month + 1, 1, 0, 0, 0).toISOString(),
      });
    });
  }

  return titles;
};

interface PointsState {
  pointsRecords: PointsRecord[];
  drinkerTitles: MonthlyDrinkerTitle[];
  lastProcessedMonth: string | null;

  addPoints: (
    userId: string,
    amount: number,
    consumptionId: string,
    timestamp?: string
  ) => PointsRecord | null;

  getUserMonthlyPoints: (userId: string, date?: Date) => MonthlyPoints;
  getMonthlyLeaderboard: (date?: Date, limit?: number) => LeaderboardEntry[];
  getUserRank: (userId: string, date?: Date) => number | null;
  getTopThree: (date?: Date) => LeaderboardEntry[];

  getDrinkerTitles: (userId?: string) => MonthlyDrinkerTitle[];
  hasCurrentMonthTitle: (userId: string) => boolean;
  getHighestTitleRank: (userId: string) => number | null;

  checkAndProcessMonthEnd: () => { awarded: number; reset: number } | null;
  resetMonthlyPoints: (date?: Date) => number;

  initPoints: () => void;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  pointsRecords: [],
  drinkerTitles: [],
  lastProcessedMonth: null,

  addPoints: (
    userId: string,
    amount: number,
    consumptionId: string,
    timestamp?: string
  ) => {
    const points = Math.floor(amount * POINTS_PER_YUAN);
    if (points <= 0) return null;

    const now = timestamp ? new Date(timestamp) : new Date();
    const newRecord: PointsRecord = {
      id: generateId(),
      userId,
      points,
      amount,
      consumptionId,
      year: now.getFullYear(),
      month: now.getMonth(),
      timestamp: now.toISOString(),
    };

    const updated = [newRecord, ...get().pointsRecords];
    set({ pointsRecords: updated });
    storage.set("pointsRecords", updated);

    return newRecord;
  },

  getUserMonthlyPoints: (userId: string, date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const userRecords = get().pointsRecords.filter(
      (r) => r.userId === userId && r.year === year && r.month === month
    );

    const totalPoints = userRecords.reduce((sum, r) => sum + r.points, 0);
    const totalAmount = userRecords.reduce((sum, r) => sum + r.amount, 0);

    const leaderboard = get().getMonthlyLeaderboard(date);
    const userEntry = leaderboard.find((e) => e.userId === userId);

    return {
      userId,
      year,
      month,
      totalPoints,
      totalAmount,
      rank: userEntry?.rank,
    };
  },

  getMonthlyLeaderboard: (date: Date = new Date(), limit?: number) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const isCurrentMonth = isSameMonth(date, new Date());

    const monthlyRecords = get().pointsRecords.filter(
      (r) => r.year === year && r.month === month
    );

    const userStats: Record<
      string,
      { totalPoints: number; totalAmount: number }
    > = {};

    monthlyRecords.forEach((r) => {
      if (!userStats[r.userId]) {
        userStats[r.userId] = { totalPoints: 0, totalAmount: 0 };
      }
      userStats[r.userId].totalPoints += r.points;
      userStats[r.userId].totalAmount += r.amount;
    });

    const titles = get().drinkerTitles.filter(
      (t) => t.year === year && t.month === month
    );

    const entries = Object.entries(userStats)
      .map(([userId, stats]) => {
        const user = usersCache.find((u) => u.id === userId);
        if (!user) return null;

        const hasTitle = titles.some((t) => t.userId === userId);

        return {
          userId,
          user,
          totalPoints: stats.totalPoints,
          totalAmount: stats.totalAmount,
          rank: 0,
          hasTitle,
        };
      })
      .filter((e): e is LeaderboardEntry => e !== null)
      .sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints;
        }
        return b.totalAmount - a.totalAmount;
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    if (!isCurrentMonth) {
      return entries.map((entry) => ({
        ...entry,
        hasTitle: DRINKER_TITLE_RANKS.includes(entry.rank as 1 | 2 | 3),
      }));
    }

    return limit ? entries.slice(0, limit) : entries;
  },

  getUserRank: (userId: string, date: Date = new Date()) => {
    const leaderboard = get().getMonthlyLeaderboard(date);
    const entry = leaderboard.find((e) => e.userId === userId);
    return entry ? entry.rank : null;
  },

  getTopThree: (date: Date = new Date()) => {
    return get().getMonthlyLeaderboard(date, 3);
  },

  getDrinkerTitles: (userId?: string) => {
    const titles = get().drinkerTitles;
    if (userId) {
      return titles.filter((t) => t.userId === userId);
    }
    return titles;
  },

  hasCurrentMonthTitle: (userId: string) => {
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const titles = get().getDrinkerTitles(userId);
    return titles.some(
      (t) => t.year === prevMonth.getFullYear() && t.month === prevMonth.getMonth()
    );
  },

  getHighestTitleRank: (userId: string) => {
    const titles = get().getDrinkerTitles(userId);
    if (titles.length === 0) return null;
    return Math.min(...titles.map((t) => t.rank));
  },

  checkAndProcessMonthEnd: () => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const lastProcessed = get().lastProcessedMonth;

    if (lastProcessed === currentMonthKey) {
      return null;
    }

    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = `${prevMonth.getFullYear()}-${prevMonth.getMonth()}`;

    if (lastProcessed === prevMonthKey) {
      set({ lastProcessedMonth: currentMonthKey });
      storage.set("lastProcessedMonth", currentMonthKey);
      return null;
    }

    const leaderboard = get().getMonthlyLeaderboard(prevMonth);
    const topThree = leaderboard.slice(0, 3);

    const newTitles: MonthlyDrinkerTitle[] = [];
    topThree.forEach((entry, index) => {
      if (entry.totalPoints > 0) {
        newTitles.push({
          userId: entry.userId,
          year: prevMonth.getFullYear(),
          month: prevMonth.getMonth(),
          rank: index + 1,
          awardedAt: now.toISOString(),
        });
      }
    });

    newTitles.forEach((title) => {
      const badge: Badge = {
        ...badgeConfigs.monthly_drinker,
        unlockedAt: title.awardedAt,
        month: `${title.year}-${String(title.month + 1).padStart(2, "0")}`,
      };
      useCheckInStore.getState().addBadge(title.userId, badge);
    });

    const updatedTitles = [...get().drinkerTitles, ...newTitles];
    set({
      drinkerTitles: updatedTitles,
      lastProcessedMonth: currentMonthKey,
    });
    storage.set("drinkerTitles", updatedTitles);
    storage.set("lastProcessedMonth", currentMonthKey);

    return {
      awarded: newTitles.length,
      reset: 0,
    };
  },

  resetMonthlyPoints: (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const remaining = get().pointsRecords.filter(
      (r) => !(r.year === year && r.month === month)
    );

    const removedCount = get().pointsRecords.length - remaining.length;
    set({ pointsRecords: remaining });
    storage.set("pointsRecords", remaining);

    return removedCount;
  },

  initPoints: () => {
    const savedRecords = storage.get<PointsRecord[] | null>("pointsRecords", null);
    const savedTitles = storage.get<MonthlyDrinkerTitle[] | null>("drinkerTitles", null);
    const savedLastProcessed = storage.get<string | null>("lastProcessedMonth", null);

    const records = savedRecords || generateMockPointsRecords();
    const titles = savedTitles || generateMockDrinkerTitles();

    set({
      pointsRecords: records,
      drinkerTitles: titles,
      lastProcessedMonth: savedLastProcessed,
    });

    if (!savedRecords) {
      storage.set("pointsRecords", records);
    }
    if (!savedTitles) {
      storage.set("drinkerTitles", titles);
    }

    setTimeout(() => {
      get().checkAndProcessMonthEnd();
    }, 100);
  },
}));
