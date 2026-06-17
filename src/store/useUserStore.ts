import { create } from "zustand";
import type { User, UserStatus } from "../types";
import { mockUsers } from "../data/mockData";
import { storage } from "../utils/storage";
import { generateId, formatDate } from "../utils/date";

const avatarColors = [
  "#6F4E37",
  "#88B04B",
  "#E67E22",
  "#3498DB",
  "#9B59B6",
  "#1ABC9C",
  "#E74C3C",
  "#F39C12",
  "#2ECC71",
  "#34495E",
];

const getAvatar = (name: string, index: number): string => {
  const color = avatarColors[index % avatarColors.length];
  const initial = name.charAt(0);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='24' y='30' text-anchor='middle' fill='white' font-size='20' font-weight='600' font-family='sans-serif'%3E${initial}%3C/text%3E%3C/svg%3E`;
};

interface UserState {
  users: User[];
  currentUserId: string | null;
  currentUser: User | null;
  setCurrentUser: (userId: string) => void;
  getUserById: (userId: string) => User | undefined;
  getPendingUsers: () => User[];
  getActiveUsers: () => User[];
  registerUser: (name: string, email: string) => User;
  approveUser: (userId: string) => void;
  updateUserRole: (userId: string, role: "user" | "admin") => void;
  updateUserBudget: (userId: string, budget: number) => void;
  initUsers: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  currentUserId: null,
  currentUser: null,

  setCurrentUser: (userId: string) => {
    const user = get().users.find((u) => u.id === userId);
    set({ currentUserId: userId, currentUser: user || null });
    storage.set("currentUserId", userId);
  },

  getUserById: (userId: string) => {
    return get().users.find((u) => u.id === userId);
  },

  getPendingUsers: () => {
    return get().users.filter((u) => u.status === "pending");
  },

  getActiveUsers: () => {
    return get().users.filter((u) => u.status === "active");
  },

  registerUser: (name: string, email: string) => {
    const newUser: User = {
      id: generateId(),
      name,
      avatar: getAvatar(name, get().users.length),
      role: "user",
      joinDate: formatDate(new Date(), "YYYY-MM-DD"),
      email,
      monthlyBudget: 200,
      status: "pending",
    };

    const updatedUsers = [...get().users, newUser];
    set({ users: updatedUsers });
    storage.set("users", updatedUsers);
    return newUser;
  },

  approveUser: (userId: string) => {
    const updatedUsers = get().users.map((u) => {
      if (u.id === userId) {
        return { ...u, status: "active" as UserStatus };
      }
      return u;
    });

    set({ users: updatedUsers });
    storage.set("users", updatedUsers);
  },

  updateUserRole: (userId: string, role: "user" | "admin") => {
    const updatedUsers = get().users.map((u) => {
      if (u.id === userId) {
        return { ...u, role };
      }
      return u;
    });

    set({ users: updatedUsers });
    storage.set("users", updatedUsers);

    const { currentUserId } = get();
    if (currentUserId === userId) {
      const updatedCurrentUser = updatedUsers.find((u) => u.id === userId) || null;
      set({ currentUser: updatedCurrentUser });
    }
  },

  updateUserBudget: (userId: string, budget: number) => {
    const updatedUsers = get().users.map((u) => {
      if (u.id === userId) {
        return { ...u, monthlyBudget: budget };
      }
      return u;
    });

    set({ users: updatedUsers });
    storage.set("users", updatedUsers);

    const { currentUserId } = get();
    if (currentUserId === userId) {
      const updatedCurrentUser = updatedUsers.find((u) => u.id === userId) || null;
      set({ currentUser: updatedCurrentUser });
    }
  },

  initUsers: () => {
    const savedUserId = storage.get<string | null>("currentUserId", null);
    const savedUsers = storage.get<User[]>("users", []);
    const users = savedUsers.length > 0 ? savedUsers : mockUsers;
    const activeUsers = users.filter((u) => u.status === "active");
    const currentUser = savedUserId
      ? users.find((u) => u.id === savedUserId) || activeUsers[0] || users[0]
      : activeUsers[0] || users[0];

    set({
      users,
      currentUserId: currentUser.id,
      currentUser,
    });

    if (savedUsers.length === 0) {
      storage.set("users", users);
    }
  },
}));
