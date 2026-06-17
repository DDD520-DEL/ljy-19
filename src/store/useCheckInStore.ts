import { create } from "zustand";
import type {
  CheckInRecord,
  UserCheckInStats,
  Badge,
} from "../types";
import { badgeConfigs, STREAK_FOR_DRINK_MASTER } from "../types";
import { mockCheckIns } from "../data/mockData";
import { storage } from "../utils/storage";
import {
  generateId,
  formatDate,
  addDays,
  isSameMonth,
} from "../utils/date";

type UserBadgesMap = Record<string, Badge[]>;

interface CheckInState {
  checkIns: CheckInRecord[];
  userBadges: UserBadgesMap;
  checkIn: (userId: string) => {
    success: boolean;
    alreadyCheckedIn: boolean;
    newBadgeUnlocked: Badge | null;
    streak: number;
  };
  hasCheckedInToday: (userId: string) => boolean;
  getUserCheckIns: (userId: string) => CheckInRecord[];
  getUserCheckInsForMonth: (userId: string, date?: Date) => CheckInRecord[];
  getUserStats: (userId: string) => UserCheckInStats;
  getStreakDays: (userId: string) => number;
  getTopCheckInUsers: (limit?: number) => { userId: string; total: number; streak: number }[];
  initCheckIns: () => void;
}

const calculateStreak = (sortedRecords: CheckInRecord[]): number => {
  if (sortedRecords.length === 0) return 0;

  const today = new Date();
  const todayStr = formatDate(today, "YYYY-MM-DD");
  const yesterdayStr = formatDate(addDays(today, -1), "YYYY-MM-DD");

  const dates = new Set(sortedRecords.map((r) => r.date));
  const latestDate = sortedRecords[0].date;

  if (latestDate !== todayStr && latestDate !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(latestDate);

  while (dates.has(formatDate(checkDate, "YYYY-MM-DD"))) {
    streak++;
    checkDate = addDays(checkDate, -1);
  }

  return streak;
};

const calculateLongestStreak = (sortedRecords: CheckInRecord[]): number => {
  if (sortedRecords.length === 0) return 0;

  const dates = sortedRecords.map((r) => r.date).sort().reverse();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  return longest;
};

const checkAndAwardBadges = (
  currentBadges: Badge[],
  streak: number
): { badges: Badge[]; newlyUnlocked: Badge | null } => {
  let newlyUnlocked: Badge | null = null;
  const updatedBadges = [...currentBadges];
  const existingTypes = new Set(currentBadges.map((b) => b.type));

  if (
    streak >= STREAK_FOR_DRINK_MASTER &&
    !existingTypes.has("drink_master")
  ) {
    const badge: Badge = {
      ...badgeConfigs.drink_master,
      unlockedAt: new Date().toISOString(),
    };
    updatedBadges.push(badge);
    newlyUnlocked = badge;
  }

  return { badges: updatedBadges, newlyUnlocked };
};

const saveUserBadges = (userBadges: UserBadgesMap) => {
  storage.set("userBadges", userBadges);
};

const loadUserBadges = (): UserBadgesMap => {
  return storage.get<UserBadgesMap>("userBadges", {});
};

export const useCheckInStore = create<CheckInState>((set, get) => ({
  checkIns: [],
  userBadges: {},

  checkIn: (userId: string) => {
    const today = new Date();
    const todayStr = formatDate(today, "YYYY-MM-DD");

    if (get().hasCheckedInToday(userId)) {
      const userRecords = get()
        .checkIns.filter((c) => c.userId === userId)
        .sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      const streak = calculateStreak(userRecords);
      return {
        success: false,
        alreadyCheckedIn: true,
        newBadgeUnlocked: null,
        streak,
      };
    }

    const newRecord: CheckInRecord = {
      id: generateId(),
      userId,
      date: todayStr,
      timestamp: today.toISOString(),
    };

    const updatedCheckIns = [newRecord, ...get().checkIns];
    set({ checkIns: updatedCheckIns });
    storage.set("checkIns", updatedCheckIns);

    const userRecords = updatedCheckIns
      .filter((c) => c.userId === userId)
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    const streak = calculateStreak(userRecords);

    const currentUserBadges = get().userBadges[userId] || [];
    const { badges: updatedBadges, newlyUnlocked } = checkAndAwardBadges(
      currentUserBadges,
      streak
    );

    if (newlyUnlocked) {
      const updatedUserBadges = {
        ...get().userBadges,
        [userId]: updatedBadges,
      };
      set({ userBadges: updatedUserBadges });
      saveUserBadges(updatedUserBadges);
    }

    return {
      success: true,
      alreadyCheckedIn: false,
      newBadgeUnlocked: newlyUnlocked,
      streak,
    };
  },

  hasCheckedInToday: (userId: string) => {
    const todayStr = formatDate(new Date(), "YYYY-MM-DD");
    return get()
      .checkIns.some((c) => c.userId === userId && c.date === todayStr);
  },

  getUserCheckIns: (userId: string) => {
    return get()
      .checkIns.filter((c) => c.userId === userId)
      .sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  },

  getUserCheckInsForMonth: (userId: string, date: Date = new Date()) => {
    return get().checkIns.filter((c) => {
      if (c.userId !== userId) return false;
      return isSameMonth(new Date(c.timestamp), date);
    });
  },

  getUserStats: (userId: string): UserCheckInStats => {
    const userRecords = get().getUserCheckIns(userId);
    const totalCheckIns = userRecords.length;
    const currentStreak = calculateStreak(userRecords);
    const longestStreak = calculateLongestStreak(userRecords);
    const lastCheckInDate = userRecords.length > 0 ? userRecords[0].date : null;

    const savedBadges = get().userBadges[userId] || [];
    const { badges } = checkAndAwardBadges(savedBadges, currentStreak);

    if (badges.length > savedBadges.length) {
      const updatedUserBadges = {
        ...get().userBadges,
        [userId]: badges,
      };
      set({ userBadges: updatedUserBadges });
      saveUserBadges(updatedUserBadges);
    }

    return {
      userId,
      totalCheckIns,
      currentStreak,
      longestStreak,
      badges,
      lastCheckInDate,
    };
  },

  getStreakDays: (userId: string) => {
    const userRecords = get().getUserCheckIns(userId);
    return calculateStreak(userRecords);
  },

  getTopCheckInUsers: (limit: number = 10) => {
    const userMap: Record<string, { total: number; records: CheckInRecord[] }> = {};

    get().checkIns.forEach((c) => {
      if (!userMap[c.userId]) {
        userMap[c.userId] = { total: 0, records: [] };
      }
      userMap[c.userId].total++;
      userMap[c.userId].records.push(c);
    });

    return Object.entries(userMap)
      .map(([userId, data]) => ({
        userId,
        total: data.total,
        streak: calculateStreak(
          data.records.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        ),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  },

  initCheckIns: () => {
    const savedCheckIns = storage.get<CheckInRecord[] | null>("checkIns", null);
    const checkInsData = savedCheckIns || mockCheckIns;

    const savedUserBadges = loadUserBadges();

    set({
      checkIns: checkInsData,
      userBadges: savedUserBadges,
    });

    if (!savedCheckIns) {
      storage.set("checkIns", mockCheckIns);
    }
  },
}));
