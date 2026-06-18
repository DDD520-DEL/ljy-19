import { create } from "zustand";
import type {
  PointsRecord,
  MonthlyPoints,
  LeaderboardEntry,
  MonthlyDrinkerTitle,
  HistoricalLeaderboard,
  User,
  Badge,
  FunData,
  TopCoffeeDrinker,
  TopMaterialItem,
  PerCapitaRankingItem,
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
import { useConsumptionStore } from "./useConsumptionStore";

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
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  mockConsumptions.forEach((consumption) => {
    const date = new Date(consumption.timestamp);
    const material = materialsCache.find((m) => m.id === consumption.materialId);
    if (!material) return;

    if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
      return;
    }

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
  historicalLeaderboards: HistoricalLeaderboard[];
  lastProcessedMonth: string | null;
  funData: FunData | null;
  lastFunDataRefresh: string | null;

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

  archiveMonthlyLeaderboard: (date: Date) => void;
  checkAndProcessMonthEnd: () => { awarded: number; reset: number } | null;
  resetMonthlyPoints: (date?: Date) => number;

  getFunData: () => FunData;
  calculateTopCoffeeDrinker: (date?: Date) => TopCoffeeDrinker | null;
  calculateTopMaterials: (date?: Date, limit?: number) => TopMaterialItem[];
  calculateTotalCoffeeCups: (date?: Date) => number;
  calculatePerCapitaRanking: (date?: Date) => PerCapitaRankingItem[];
  shouldRefreshFunData: () => boolean;
  refreshFunData: () => void;

  initPoints: () => void;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  pointsRecords: [],
  drinkerTitles: [],
  historicalLeaderboards: [],
  lastProcessedMonth: null,
  funData: null,
  lastFunDataRefresh: null,

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

    const archived = get().historicalLeaderboards.find(
      (h) => h.year === year && h.month === month
    );
    if (archived) {
      return limit ? archived.entries.slice(0, limit) : archived.entries;
    }

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

  archiveMonthlyLeaderboard: (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const existing = get().historicalLeaderboards.find(
      (h) => h.year === year && h.month === month
    );
    if (existing) return;

    const rawEntries = get().getMonthlyLeaderboard(date);
    const entries = rawEntries.map((entry) => ({
      ...entry,
      hasTitle: DRINKER_TITLE_RANKS.includes(entry.rank as 1 | 2 | 3),
    }));

    const archived: HistoricalLeaderboard = {
      year,
      month,
      entries,
      archivedAt: new Date().toISOString(),
    };

    const updated = [...get().historicalLeaderboards, archived];
    set({ historicalLeaderboards: updated });
    storage.set("historicalLeaderboards", updated);
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

    get().archiveMonthlyLeaderboard(prevMonth);

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

    const resetCount = get().resetMonthlyPoints(prevMonth);

    const updatedTitles = [...get().drinkerTitles, ...newTitles];
    set({
      drinkerTitles: updatedTitles,
      lastProcessedMonth: currentMonthKey,
    });
    storage.set("drinkerTitles", updatedTitles);
    storage.set("lastProcessedMonth", currentMonthKey);

    return {
      awarded: newTitles.length,
      reset: resetCount,
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

  getFunData: () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const currentFunData = get().funData;
    if (currentFunData && !get().shouldRefreshFunData()) {
      return currentFunData;
    }

    const funData: FunData = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      lastRefreshed: now.toISOString(),
      topCoffeeDrinker: get().calculateTopCoffeeDrinker(),
      topMaterials: get().calculateTopMaterials(now, 5),
      totalCoffeeCups: get().calculateTotalCoffeeCups(),
      perCapitaRanking: get().calculatePerCapitaRanking(),
    };

    set({ funData, lastFunDataRefresh: now.toISOString() });
    storage.set("funData", funData);
    storage.set("lastFunDataRefresh", now.toISOString());

    return funData;
  },

  calculateTopCoffeeDrinker: (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const consumptions = useConsumptionStore.getState().consumptions;

    const monthlyConsumptions = consumptions.filter((c) => {
      const d = new Date(c.timestamp);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const userCoffeeStats: Record<string, { cups: number; cost: number }> = {};

    monthlyConsumptions.forEach((consumption) => {
      const material = materialsCache.find((m) => m.id === consumption.materialId);
      if (material && material.category === "coffee") {
        if (!userCoffeeStats[consumption.userId]) {
          userCoffeeStats[consumption.userId] = { cups: 0, cost: 0 };
        }
        userCoffeeStats[consumption.userId].cups += consumption.quantity;
        userCoffeeStats[consumption.userId].cost += consumption.quantity * material.unitPrice;
      }
    });

    const sorted = Object.entries(userCoffeeStats)
      .sort((a, b) => b[1].cups - a[1].cups)
      .slice(0, 1);

    if (sorted.length === 0) return null;

    const [userId, stats] = sorted[0];
    const user = usersCache.find((u) => u.id === userId);
    if (!user) return null;

    return {
      userId,
      user,
      coffeeCups: stats.cups,
      totalCost: stats.cost,
    };
  },

  calculateTopMaterials: (date: Date = new Date(), limit: number = 5) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const consumptions = useConsumptionStore.getState().consumptions;

    const monthlyConsumptions = consumptions.filter((c) => {
      const d = new Date(c.timestamp);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const materialStats: Record<string, { quantity: number; cost: number }> = {};

    monthlyConsumptions.forEach((consumption) => {
      const material = materialsCache.find((m) => m.id === consumption.materialId);
      if (material) {
        if (!materialStats[material.id]) {
          materialStats[material.id] = { quantity: 0, cost: 0 };
        }
        materialStats[material.id].quantity += consumption.quantity;
        materialStats[material.id].cost += consumption.quantity * material.unitPrice;
      }
    });

    return Object.entries(materialStats)
      .map(([materialId, stats]) => {
        const material = materialsCache.find((m) => m.id === materialId);
        return {
          materialId,
          materialName: material?.name || "",
          materialIcon: material?.icon || "📦",
          materialColor: material?.color || "#6F4E37",
          quantity: stats.quantity,
          totalCost: stats.cost,
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  },

  calculateTotalCoffeeCups: (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const consumptions = useConsumptionStore.getState().consumptions;

    const monthlyConsumptions = consumptions.filter((c) => {
      const d = new Date(c.timestamp);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    let totalCups = 0;
    monthlyConsumptions.forEach((consumption) => {
      const material = materialsCache.find((m) => m.id === consumption.materialId);
      if (material && material.category === "coffee") {
        totalCups += consumption.quantity;
      }
    });

    return totalCups;
  },

  calculatePerCapitaRanking: (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const consumptions = useConsumptionStore.getState().consumptions;

    const monthlyConsumptions = consumptions.filter((c) => {
      const d = new Date(c.timestamp);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    const userStats: Record<string, { totalCost: number; count: number; quantity: number }> = {};

    monthlyConsumptions.forEach((consumption) => {
      const material = materialsCache.find((m) => m.id === consumption.materialId);
      if (material) {
        if (!userStats[consumption.userId]) {
          userStats[consumption.userId] = { totalCost: 0, count: 0, quantity: 0 };
        }
        userStats[consumption.userId].totalCost += consumption.quantity * material.unitPrice;
        userStats[consumption.userId].count += 1;
        userStats[consumption.userId].quantity += consumption.quantity;
      }
    });

    return Object.entries(userStats)
      .map(([userId, stats]) => {
        const user = usersCache.find((u) => u.id === userId);
        return {
          userId,
          user: user!,
          totalCost: stats.totalCost,
          consumptionCount: stats.count,
          averagePerConsumption: stats.count > 0 ? stats.totalCost / stats.count : 0,
        };
      })
      .filter((item): item is PerCapitaRankingItem => item.user !== undefined)
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);
  },

  shouldRefreshFunData: () => {
    const lastRefresh = get().lastFunDataRefresh;
    if (!lastRefresh) return true;

    const lastRefreshDate = new Date(lastRefresh);
    const now = new Date();

    const diffTime = now.getTime() - lastRefreshDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays >= 7;
  },

  refreshFunData: () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const funData: FunData = {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      lastRefreshed: now.toISOString(),
      topCoffeeDrinker: get().calculateTopCoffeeDrinker(),
      topMaterials: get().calculateTopMaterials(now, 5),
      totalCoffeeCups: get().calculateTotalCoffeeCups(),
      perCapitaRanking: get().calculatePerCapitaRanking(),
    };

    set({ funData, lastFunDataRefresh: now.toISOString() });
    storage.set("funData", funData);
    storage.set("lastFunDataRefresh", now.toISOString());
  },

  initPoints: () => {
    const savedLastProcessed = storage.get<string | null>("lastProcessedMonth", null);
    const savedHistorical = storage.get<HistoricalLeaderboard[] | null>("historicalLeaderboards", null);
    const savedFunData = storage.get<FunData | null>("funData", null);
    const savedLastFunDataRefresh = storage.get<string | null>("lastFunDataRefresh", null);

    let records: PointsRecord[];
    let titles: MonthlyDrinkerTitle[];
    let historical: HistoricalLeaderboard[];

    if (!savedLastProcessed) {
      records = generateMockPointsRecords();
      titles = generateMockDrinkerTitles();
      historical = [];

      storage.set("pointsRecords", records);
      storage.set("drinkerTitles", titles);
      storage.set("historicalLeaderboards", historical);
    } else {
      records = storage.get<PointsRecord[] | null>("pointsRecords", null) || generateMockPointsRecords();
      titles = storage.get<MonthlyDrinkerTitle[] | null>("drinkerTitles", null) || generateMockDrinkerTitles();
      historical = savedHistorical || [];
    }

    set({
      pointsRecords: records,
      drinkerTitles: titles,
      historicalLeaderboards: historical,
      lastProcessedMonth: savedLastProcessed,
      funData: savedFunData,
      lastFunDataRefresh: savedLastFunDataRefresh,
    });

    setTimeout(() => {
      const now = new Date();
      const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthKey = `${prevMonth.getFullYear()}-${prevMonth.getMonth()}`;

      const state = get();
      if (!state.lastProcessedMonth) {
        const hasPrevMonthRecords = state.pointsRecords.some(
          (r) => r.year === prevMonth.getFullYear() && r.month === prevMonth.getMonth()
        );

        if (hasPrevMonthRecords) {
          get().archiveMonthlyLeaderboard(prevMonth);

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

          get().resetMonthlyPoints(prevMonth);

          const updatedTitles = [...get().drinkerTitles, ...newTitles];
          set({
            drinkerTitles: updatedTitles,
            lastProcessedMonth: prevMonthKey,
          });
          storage.set("drinkerTitles", updatedTitles);
          storage.set("lastProcessedMonth", prevMonthKey);
        } else {
          set({ lastProcessedMonth: prevMonthKey });
          storage.set("lastProcessedMonth", prevMonthKey);
        }
      }

      get().checkAndProcessMonthEnd();

      if (get().shouldRefreshFunData()) {
        get().refreshFunData();
      }
    }, 100);
  },
}));
