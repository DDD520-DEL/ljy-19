import { create } from "zustand";
import type { Announcement, AnnouncementType } from "../types";
import { mockAnnouncements } from "../data/mockData";
import { storage } from "../utils/storage";
import { generateId } from "../utils/date";

const DATA_VERSION = 1;
const DATA_VERSION_KEY = "announcementDataVersion";

interface CreateAnnouncementParams {
  title: string;
  content: string;
  type: AnnouncementType;
  isPinned: boolean;
  createdBy: string;
  expiresAt?: string;
}

interface UpdateAnnouncementParams {
  id: string;
  title?: string;
  content?: string;
  type?: AnnouncementType;
  isPinned?: boolean;
  expiresAt?: string;
}

interface AnnouncementState {
  announcements: Announcement[];
  getActiveAnnouncements: () => Announcement[];
  getPinnedAnnouncements: () => Announcement[];
  getAllAnnouncements: () => Announcement[];
  getExpiredAnnouncements: () => Announcement[];
  getArchivedAnnouncements: () => Announcement[];
  getAnnouncementById: (id: string) => Announcement | undefined;
  createAnnouncement: (params: CreateAnnouncementParams) => void;
  updateAnnouncement: (params: UpdateAnnouncementParams) => void;
  deleteAnnouncement: (id: string) => void;
  togglePin: (id: string) => void;
  archiveAnnouncement: (id: string) => void;
  incrementViewCount: (id: string) => void;
  checkAndUpdateExpired: () => void;
  initAnnouncements: () => void;
}

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: [],

  getActiveAnnouncements: () => {
    get().checkAndUpdateExpired();
    return get()
      .announcements.filter((a) => a.status === "active")
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  },

  getPinnedAnnouncements: () => {
    return get()
      .getActiveAnnouncements()
      .filter((a) => a.isPinned);
  },

  getAllAnnouncements: () => {
    get().checkAndUpdateExpired();
    return [...get().announcements].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  },

  getExpiredAnnouncements: () => {
    return get()
      .announcements.filter((a) => a.status === "expired")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getArchivedAnnouncements: () => {
    return get()
      .announcements.filter((a) => a.status === "archived")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getAnnouncementById: (id: string) => {
    return get().announcements.find((a) => a.id === id);
  },

  createAnnouncement: (params) => {
    const now = new Date().toISOString();
    const newAnnouncement: Announcement = {
      id: generateId(),
      title: params.title,
      content: params.content,
      type: params.type,
      isPinned: params.isPinned,
      createdAt: now,
      createdBy: params.createdBy,
      expiresAt: params.expiresAt,
      status: "active",
      viewCount: 0,
    };

    const updated = [newAnnouncement, ...get().announcements];
    set({ announcements: updated });
    storage.set("announcements", updated);
  },

  updateAnnouncement: (params) => {
    const updated = get().announcements.map((a) => {
      if (a.id !== params.id) return a;
      return { ...a, ...params };
    });

    set({ announcements: updated });
    storage.set("announcements", updated);
  },

  deleteAnnouncement: (id) => {
    const updated = get().announcements.filter((a) => a.id !== id);
    set({ announcements: updated });
    storage.set("announcements", updated);
  },

  togglePin: (id) => {
    const updated = get().announcements.map((a) => {
      if (a.id !== id) return a;
      return { ...a, isPinned: !a.isPinned };
    });

    set({ announcements: updated });
    storage.set("announcements", updated);
  },

  archiveAnnouncement: (id) => {
    const updated = get().announcements.map((a) => {
      if (a.id !== id) return a;
      return { ...a, status: "archived" as const };
    });

    set({ announcements: updated });
    storage.set("announcements", updated);
  },

  incrementViewCount: (id) => {
    const updated = get().announcements.map((a) => {
      if (a.id !== id) return a;
      return { ...a, viewCount: a.viewCount + 1 };
    });

    set({ announcements: updated });
    storage.set("announcements", updated);
  },

  checkAndUpdateExpired: () => {
    const now = new Date();
    let hasChanges = false;

    const updated = get().announcements.map((a) => {
      if (a.status === "active" && a.expiresAt) {
        const expiryDate = new Date(a.expiresAt);
        if (expiryDate < now) {
          hasChanges = true;
          return { ...a, status: "expired" as const };
        }
      }
      return a;
    });

    if (hasChanges) {
      set({ announcements: updated });
      storage.set("announcements", updated);
    }
  },

  initAnnouncements: () => {
    const savedVersion = storage.get<number | null>(DATA_VERSION_KEY, null);
    const savedAnnouncements = storage.get<Announcement[] | null>("announcements", null);

    let finalAnnouncements: Announcement[];
    const versionMismatch = savedVersion !== DATA_VERSION;

    if (versionMismatch) {
      finalAnnouncements = mockAnnouncements;
      storage.set("announcements", mockAnnouncements);
      storage.set(DATA_VERSION_KEY, DATA_VERSION);
    } else if (savedAnnouncements) {
      finalAnnouncements = savedAnnouncements;
    } else {
      finalAnnouncements = mockAnnouncements;
      storage.set("announcements", mockAnnouncements);
      storage.set(DATA_VERSION_KEY, DATA_VERSION);
    }

    set({ announcements: finalAnnouncements });
    get().checkAndUpdateExpired();
  },
}));
