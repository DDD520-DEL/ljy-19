import { create } from "zustand";
import type { DutySchedule, User, DutyHandoverRecord, DutyBannerState, DutySingleBanner } from "../types";
import { mockDutySchedule, mockUsers } from "../data/mockData";
import { storage } from "../utils/storage";
import { generateId, getStartOfWeek, getEndOfWeek, formatDate } from "../utils/date";

interface DutyState {
  schedules: DutySchedule[];
  handoverRecords: DutyHandoverRecord[];
  bannerState: DutyBannerState;
  lastRotationCheck: string | null;

  getCurrentWeekSchedule: () => DutySchedule | undefined;
  getCurrentDutyUser: () => User | undefined;
  getPreviousWeekSchedule: () => DutySchedule | undefined;
  getWeekSchedule: (date: Date) => DutySchedule | undefined;
  getMonthSchedules: (year: number, month: number) => DutySchedule[];
  getPendingHandoverSchedule: () => DutySchedule | undefined;
  getHandoverRecords: () => DutyHandoverRecord[];

  checkAndRotateDuty: () => void;
  confirmHandover: (
    scheduleId: string,
    tasks: {
      inventoryCheck: boolean;
      pantryCleanup: boolean;
      equipmentCheck: boolean;
      otherTasks: string;
    },
    notes: string
  ) => boolean;

  dismissBanner: (type: "update" | "pending") => void;
  checkPendingHandover: () => void;
  showUpdateBanner: (message: string) => void;

  initDuty: () => void;
  persist: () => void;
}

const initializeSchedulesWithHandover = (schedules: DutySchedule[]): DutySchedule[] => {
  return schedules.map(s => ({
    ...s,
    handoverCompleted: s.handoverCompleted ?? false,
    handoverCompletedAt: s.handoverCompletedAt,
  }));
};

const createEmptyBanner = (): DutySingleBanner => ({
  visible: false,
  message: "",
  dismissed: false,
});

export const useDutyStore = create<DutyState>((set, get) => ({
  schedules: [],
  handoverRecords: [],
  bannerState: {
    update: createEmptyBanner(),
    pending: createEmptyBanner(),
  },
  lastRotationCheck: null,

  getCurrentWeekSchedule: () => {
    return get().schedules.find((s) => s.isCurrent);
  },

  getCurrentDutyUser: () => {
    const schedule = get().getCurrentWeekSchedule();
    if (!schedule) return undefined;
    return mockUsers.find((u) => u.id === schedule.userId);
  },

  getPreviousWeekSchedule: () => {
    const current = get().getCurrentWeekSchedule();
    if (!current) return undefined;
    const currentIndex = get().schedules.findIndex(s => s.id === current.id);
    if (currentIndex <= 0) return undefined;
    return get().schedules[currentIndex - 1];
  },

  getWeekSchedule: (date: Date) => {
    const targetDate = date.toISOString().split("T")[0];
    return get().schedules.find((s) => s.weekStart <= targetDate && s.weekEnd >= targetDate);
  },

  getMonthSchedules: (year: number, month: number) => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    return get().schedules.filter((s) => s.weekStart.startsWith(monthStr) || s.weekEnd.startsWith(monthStr));
  },

  getPendingHandoverSchedule: () => {
    const previous = get().getPreviousWeekSchedule();
    if (!previous) return undefined;
    if (previous.handoverCompleted) return undefined;
    return previous;
  },

  getHandoverRecords: () => {
    return [...get().handoverRecords].sort((a, b) =>
      new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime()
    );
  },

  showUpdateBanner: (message: string) => {
    set((state) => ({
      bannerState: {
        ...state.bannerState,
        update: {
          visible: true,
          message,
          dismissed: false,
        },
      },
    }));
  },

  checkAndRotateDuty: () => {
    const state = get();
    const now = new Date();
    const todayStr = formatDate(now, "YYYY-MM-DD");

    const lastCheck = state.lastRotationCheck;
    if (lastCheck === todayStr) {
      state.checkPendingHandover();
      return;
    }

    const currentSchedule = state.getCurrentWeekSchedule();
    if (!currentSchedule) {
      set({ lastRotationCheck: todayStr });
      state.persist();
      state.checkPendingHandover();
      return;
    }

    const currentWeekStart = new Date(currentSchedule.weekStart);
    const thisWeekStart = getStartOfWeek(now);
    const needRotation = thisWeekStart > currentWeekStart;

    if (needRotation) {
      const currentIndex = state.schedules.findIndex(s => s.id === currentSchedule.id);
      const schedules = [...state.schedules];

      schedules.forEach(s => s.isCurrent = false);

      let nextIndex = currentIndex + 1;
      if (nextIndex >= schedules.length) {
        const lastSchedule = schedules[schedules.length - 1];
        const lastWeekEnd = new Date(lastSchedule.weekEnd);
        const newWeekStart = new Date(lastWeekEnd);
        newWeekStart.setDate(newWeekStart.getDate() + 1);

        for (let i = 0; i < 4; i++) {
          const weekStart = new Date(newWeekStart);
          weekStart.setDate(weekStart.getDate() + i * 7);
          const startOfWeek = getStartOfWeek(weekStart);
          const endOfWeek = getEndOfWeek(weekStart);
          const userIndex = (nextIndex + i) % mockUsers.length;

          schedules.push({
            id: `duty-${Date.now()}-${i}`,
            userId: mockUsers[userIndex].id,
            weekStart: formatDate(startOfWeek, "YYYY-MM-DD"),
            weekEnd: formatDate(endOfWeek, "YYYY-MM-DD"),
            isCurrent: i === 0,
            handoverCompleted: false,
          });
        }
        nextIndex = currentIndex + 1;
      }

      if (schedules[nextIndex]) {
        schedules[nextIndex].isCurrent = true;
      }

      const newCurrent = schedules.find(s => s.isCurrent);
      const newDutyUser = newCurrent ? mockUsers.find(u => u.id === newCurrent.userId) : undefined;

      set({
        schedules,
        lastRotationCheck: todayStr,
        bannerState: {
          ...state.bannerState,
          update: {
            visible: true,
            message: `本周值班已更新，本周值班人：${newDutyUser?.name || "未安排"}`,
            dismissed: false,
          },
        },
      });
      state.persist();
    } else {
      set({ lastRotationCheck: todayStr });
      state.persist();
    }

    state.checkPendingHandover();
  },

  confirmHandover: (
    scheduleId: string,
    tasks: {
      inventoryCheck: boolean;
      pantryCleanup: boolean;
      equipmentCheck: boolean;
      otherTasks: string;
    },
    notes: string
  ) => {
    const state = get();
    const scheduleIndex = state.schedules.findIndex(s => s.id === scheduleId);
    if (scheduleIndex === -1) return false;

    const schedule = state.schedules[scheduleIndex];
    if (schedule.handoverCompleted) return false;

    const currentSchedule = state.getCurrentWeekSchedule();
    if (!currentSchedule) return false;

    const schedules = [...state.schedules];
    schedules[scheduleIndex] = {
      ...schedule,
      handoverCompleted: true,
      handoverCompletedAt: new Date().toISOString(),
    };

    const record: DutyHandoverRecord = {
      id: generateId(),
      scheduleId: schedule.id,
      userId: schedule.userId,
      weekStart: schedule.weekStart,
      weekEnd: schedule.weekEnd,
      tasks,
      notes,
      confirmedAt: new Date().toISOString(),
      nextUserId: currentSchedule.userId,
    };

    const handoverRecords = [...state.handoverRecords, record];

    set({
      schedules,
      handoverRecords,
      bannerState: {
        ...state.bannerState,
        pending: {
          visible: false,
          message: "",
          dismissed: false,
        },
      },
    });

    state.persist();
    return true;
  },

  dismissBanner: (type: "update" | "pending") => {
    set((state) => ({
      bannerState: {
        ...state.bannerState,
        [type]: {
          ...state.bannerState[type],
          visible: false,
          dismissed: true,
        },
      },
    }));
  },

  checkPendingHandover: () => {
    const state = get();
    const pending = state.getPendingHandoverSchedule();
    const currentUser = state.getCurrentDutyUser();

    if (pending && currentUser) {
      const previousUser = mockUsers.find(u => u.id === pending.userId);
      const message = `⚠️ ${previousUser?.name || "上一位值班人"}尚未完成交接，请提醒其完成交接确认`;
      const alreadyShown = state.bannerState.pending.message === message && state.bannerState.pending.dismissed;

      if (!alreadyShown) {
        set((s) => ({
          bannerState: {
            ...s.bannerState,
            pending: {
              visible: true,
              message,
              dismissed: false,
            },
          },
        }));
      }
    } else {
      if (state.bannerState.pending.visible) {
        set((s) => ({
          bannerState: {
            ...s.bannerState,
            pending: {
              visible: false,
              message: "",
              dismissed: false,
            },
          },
        }));
      }
    }
  },

  persist: () => {
    const state = get();
    storage.set("dutySchedules", state.schedules);
    storage.set("dutyHandoverRecords", state.handoverRecords);
    storage.set("dutyLastRotationCheck", state.lastRotationCheck);
  },

  initDuty: () => {
    const savedSchedules = storage.get<DutySchedule[] | null>("dutySchedules", null);
    const savedHandoverRecords = storage.get<DutyHandoverRecord[] | null>("dutyHandoverRecords", null);
    const savedLastCheck = storage.get<string | null>("dutyLastRotationCheck", null);

    const schedules = savedSchedules || mockDutySchedule;
    const initializedSchedules = initializeSchedulesWithHandover(schedules);

    set({
      schedules: initializedSchedules,
      handoverRecords: savedHandoverRecords || [],
      lastRotationCheck: savedLastCheck,
      bannerState: {
        update: createEmptyBanner(),
        pending: createEmptyBanner(),
      },
    });

    if (!savedSchedules) {
      storage.set("dutySchedules", initializedSchedules);
    }

    get().checkAndRotateDuty();
  },
}));
