import { create } from "zustand";
import type { User } from "../types";
import { mockUsers } from "../data/mockData";
import { storage } from "../utils/storage";

interface UserState {
  users: User[];
  currentUserId: string | null;
  currentUser: User | null;
  setCurrentUser: (userId: string) => void;
  getUserById: (userId: string) => User | undefined;
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

  initUsers: () => {
    const savedUserId = storage.get<string | null>("currentUserId", null);
    const users = mockUsers;
    const currentUser = savedUserId ? users.find((u) => u.id === savedUserId) || users[0] : users[0];

    set({
      users,
      currentUserId: currentUser.id,
      currentUser,
    });
  },
}));
