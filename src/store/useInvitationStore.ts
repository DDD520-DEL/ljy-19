import { create } from "zustand";
import type { InvitationCode, InvitationCodeStatus } from "../types";
import { generateId, addDays } from "../utils/date";
import { storage } from "../utils/storage";

const generateInvitationCode = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const checkAndUpdateExpiredCodes = (codes: InvitationCode[]): InvitationCode[] => {
  const now = new Date();
  return codes.map((code) => {
    if (code.status === "active" && new Date(code.expiresAt) < now) {
      return { ...code, status: "expired" as InvitationCodeStatus };
    }
    return code;
  });
};

interface InvitationState {
  invitationCodes: InvitationCode[];
  createInvitationCode: (createdBy: string) => InvitationCode;
  validateInvitationCode: (code: string) => { valid: boolean; code?: InvitationCode; reason?: string };
  useInvitationCode: (code: string, userId: string, userName: string, userEmail: string) => boolean;
  getInvitationCodesByCreator: (creatorId: string) => InvitationCode[];
  getInvitationCodeByCode: (code: string) => InvitationCode | undefined;
  initInvitationCodes: () => void;
}

export const useInvitationStore = create<InvitationState>((set, get) => ({
  invitationCodes: [],

  createInvitationCode: (createdBy: string) => {
    const now = new Date();
    const expiresAt = addDays(now, 1);
    const newCode: InvitationCode = {
      id: generateId(),
      code: generateInvitationCode(),
      createdBy,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: "active",
    };

    const updatedCodes = [...get().invitationCodes, newCode];
    set({ invitationCodes: updatedCodes });
    storage.set("invitationCodes", updatedCodes);
    return newCode;
  },

  validateInvitationCode: (code: string) => {
    const codes = checkAndUpdateExpiredCodes(get().invitationCodes);
    set({ invitationCodes: codes });
    storage.set("invitationCodes", codes);

    const invitationCode = codes.find((c) => c.code === code.toUpperCase());

    if (!invitationCode) {
      return { valid: false, reason: "邀请码不存在" };
    }

    if (invitationCode.status === "used") {
      return { valid: false, reason: "邀请码已被使用" };
    }

    if (invitationCode.status === "expired") {
      return { valid: false, reason: "邀请码已过期" };
    }

    return { valid: true, code: invitationCode };
  },

  useInvitationCode: (code: string, userId: string, userName: string, userEmail: string) => {
    const validation = get().validateInvitationCode(code);
    if (!validation.valid || !validation.code) {
      return false;
    }

    const now = new Date();
    const updatedCodes = get().invitationCodes.map((c) => {
      if (c.id === validation.code!.id) {
        return {
          ...c,
          status: "used" as InvitationCodeStatus,
          usedBy: userId,
          usedAt: now.toISOString(),
          registeredUserName: userName,
          registeredUserEmail: userEmail,
        };
      }
      return c;
    });

    set({ invitationCodes: updatedCodes });
    storage.set("invitationCodes", updatedCodes);
    return true;
  },

  getInvitationCodesByCreator: (creatorId: string) => {
    return checkAndUpdateExpiredCodes(get().invitationCodes)
      .filter((c) => c.createdBy === creatorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getInvitationCodeByCode: (code: string) => {
    return checkAndUpdateExpiredCodes(get().invitationCodes).find((c) => c.code === code.toUpperCase());
  },

  initInvitationCodes: () => {
    const savedCodes = storage.get<InvitationCode[]>("invitationCodes", []);
    const updatedCodes = checkAndUpdateExpiredCodes(savedCodes);
    set({ invitationCodes: updatedCodes });
    if (savedCodes.length !== updatedCodes.length || 
        savedCodes.some((c, i) => c.status !== updatedCodes[i].status)) {
      storage.set("invitationCodes", updatedCodes);
    }
  },
}));
