import { create } from "zustand";
import type { DutySchedule, User } from "../types";
import { mockDutySchedule, mockUsers } from "../data/mockData";
import { storage } from "../utils/storage";

interface DutyState {
  schedules: DutySchedule[];
  getCurrentWeekSchedule: () => DutySchedule | undefined;
  getCurrentDutyUser: () => User | undefined;
  getWeekSchedule: (date: Date) => DutySchedule | undefined;
  getMonthSchedules: (year: number, month: number) => DutySchedule[];
  initDuty: () => void;
}

export const useDutyStore = create<DutyState>((set, get) => ({
  schedules: [],

  getCurrentWeekSchedule: () => {
    return get().schedules.find((s) => s.isCurrent);
  },

  getCurrentDutyUser: () => {
    const schedule = get().getCurrentWeekSchedule();
    if (!schedule) return undefined;
    return mockUsers.find((u) => u.id === schedule.userId);
  },

  getWeekSchedule: (date: Date) => {
    const targetDate = date.toISOString().split("T")[0];
    return get().schedules.find((s) => s.weekStart <= targetDate && s.weekEnd >= targetDate);
  },

  getMonthSchedules: (year: number, month: number) => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    return get().schedules.filter((s) => s.weekStart.startsWith(monthStr) || s.weekEnd.startsWith(monthStr));
  },

  initDuty: () => {
    const saved = storage.get<DutySchedule[] | null>("dutySchedules", null);
    set({ schedules: saved || mockDutySchedule });
    if (!saved) {
      storage.set("dutySchedules", mockDutySchedule);
    }
  },
}));
