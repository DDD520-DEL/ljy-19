import { create } from "zustand";
import type { Wish, WishStatus } from "../types";
import { storage } from "../utils/storage";
import { generateId } from "../utils/date";

const mockWishes: Wish[] = [
  {
    id: "wish-1",
    name: "手冲滤杯套装",
    recommendLink: "https://example.com/filter-set",
    reason: "想尝试手冲咖啡，体验不同的风味层次，大家可以一起分享冲煮的乐趣",
    createdBy: "user-1",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    likes: ["user-2", "user-4", "user-5", "user-6", "user-7"],
    status: "pending",
  },
  {
    id: "wish-2",
    name: "巧克力粉",
    recommendLink: "",
    reason: "冬天喝热巧克力很舒服，也可以做摩卡咖啡用",
    createdBy: "user-2",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    likes: ["user-1", "user-3"],
    status: "pending",
  },
  {
    id: "wish-3",
    name: "蜂蜜",
    recommendLink: "https://example.com/organic-honey",
    reason: "替代白糖，更健康，搭配柠檬茶也很好喝",
    createdBy: "user-5",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    likes: ["user-1", "user-2", "user-4", "user-6", "user-7", "user-8"],
    status: "purchased",
    adminNote: "已采购有机蜂蜜一罐，放在茶水间储物柜",
    processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    processedBy: "user-3",
  },
  {
    id: "wish-4",
    name: "电动奶泡机",
    recommendLink: "https://example.com/milk-frother",
    reason: "手动打奶泡太费劲了，电动的可以节省时间，拉花更容易",
    createdBy: "user-4",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    likes: ["user-1"],
    status: "declined",
    adminNote: "预算有限，先观望一段时间，使用手动奶泡器继续练习",
    processedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    processedBy: "user-3",
  },
  {
    id: "wish-5",
    name: "抹茶粉",
    recommendLink: "https://example.com/matcha-powder",
    reason: "抹茶拿铁很受欢迎，而且抹茶含有丰富的抗氧化成分",
    createdBy: "user-7",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    likes: ["user-2", "user-5", "user-8"],
    status: "pending",
  },
];

interface WishListState {
  wishes: Wish[];
  addWish: (name: string, reason: string, createdBy: string, recommendLink?: string) => string;
  toggleLike: (wishId: string, userId: string) => void;
  hasUserLiked: (wishId: string, userId: string) => boolean;
  markAsPurchased: (wishId: string, adminId: string, adminNote?: string) => void;
  markAsDeclined: (wishId: string, adminId: string, adminNote?: string) => void;
  getWishesByStatus: (status: WishStatus) => Wish[];
  getWishesByUser: (userId: string) => Wish[];
  getTopLikedWishes: (limit: number) => Wish[];
  getWishById: (id: string) => Wish | undefined;
  initWishes: () => void;
}

export const useWishListStore = create<WishListState>((set, get) => ({
  wishes: [],

  addWish: (name, reason, createdBy, recommendLink) => {
    const newWish: Wish = {
      id: generateId(),
      name,
      reason,
      createdBy,
      recommendLink: recommendLink || undefined,
      createdAt: new Date().toISOString(),
      likes: [],
      status: "pending",
    };

    const updated = [newWish, ...get().wishes];
    set({ wishes: updated });
    storage.set("wishes", updated);
    return newWish.id;
  },

  toggleLike: (wishId, userId) => {
    const updated = get().wishes.map((w) => {
      if (w.id !== wishId) return w;
      const likes = w.likes || [];
      const hasLiked = likes.includes(userId);
      return {
        ...w,
        likes: hasLiked ? likes.filter((id) => id !== userId) : [...likes, userId],
      };
    });
    set({ wishes: updated });
    storage.set("wishes", updated);
  },

  hasUserLiked: (wishId, userId) => {
    const wish = get().wishes.find((w) => w.id === wishId);
    return wish ? (wish.likes || []).includes(userId) : false;
  },

  markAsPurchased: (wishId, adminId, adminNote) => {
    const updated = get().wishes.map((w) =>
      w.id === wishId
        ? {
            ...w,
            status: "purchased" as WishStatus,
            adminNote,
            processedAt: new Date().toISOString(),
            processedBy: adminId,
          }
        : w
    );
    set({ wishes: updated });
    storage.set("wishes", updated);
  },

  markAsDeclined: (wishId, adminId, adminNote) => {
    const updated = get().wishes.map((w) =>
      w.id === wishId
        ? {
            ...w,
            status: "declined" as WishStatus,
            adminNote,
            processedAt: new Date().toISOString(),
            processedBy: adminId,
          }
        : w
    );
    set({ wishes: updated });
    storage.set("wishes", updated);
  },

  getWishesByStatus: (status) => {
    return get().wishes.filter((w) => w.status === status);
  },

  getWishesByUser: (userId) => {
    return get().wishes.filter((w) => w.createdBy === userId);
  },

  getTopLikedWishes: (limit) => {
    return [...get().wishes]
      .filter((w) => w.status === "pending")
      .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      .slice(0, limit);
  },

  getWishById: (id) => {
    return get().wishes.find((w) => w.id === id);
  },

  initWishes: () => {
    const saved = storage.get<Wish[] | null>("wishes", null);
    if (saved) {
      const normalized = saved.map((w) => ({
        ...w,
        likes: w.likes || [],
        status: w.status || "pending",
      }));
      set({ wishes: normalized });
    } else {
      set({ wishes: mockWishes });
      storage.set("wishes", mockWishes);
    }
  },
}));
