import { create } from "zustand";
import type { VoteSuggestion } from "../types";
import { storage } from "../utils/storage";
import { generateId } from "../utils/date";

const mockVoteSuggestions: VoteSuggestion[] = [];

interface VoteSuggestionState {
  suggestions: VoteSuggestion[];
  addSuggestion: (
    voteId: string,
    voteTitle: string,
    optionId: string,
    optionName: string,
    optionIcon: string,
    votes: number,
    suggestedQuantity: number,
    materialId?: string
  ) => VoteSuggestion;
  markAsProcessed: (suggestionId: string, restockRequestId?: string) => boolean;
  getPendingSuggestions: () => VoteSuggestion[];
  getSuggestionById: (id: string) => VoteSuggestion | undefined;
  hasSuggestionForVote: (voteId: string) => boolean;
  initSuggestions: () => void;
}

export const useVoteSuggestionStore = create<VoteSuggestionState>((set, get) => ({
  suggestions: [],

  addSuggestion: (
    voteId: string,
    voteTitle: string,
    optionId: string,
    optionName: string,
    optionIcon: string,
    votes: number,
    suggestedQuantity: number,
    materialId?: string
  ) => {
    const existingSuggestion = get().suggestions.find((s) => s.voteId === voteId);
    if (existingSuggestion) {
      return existingSuggestion;
    }

    const newSuggestion: VoteSuggestion = {
      id: generateId(),
      voteId,
      voteTitle,
      optionId,
      optionName,
      optionIcon,
      votes,
      suggestedQuantity,
      materialId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const updated = [newSuggestion, ...get().suggestions];
    set({ suggestions: updated });
    storage.set("voteSuggestions", updated);
    return newSuggestion;
  },

  markAsProcessed: (suggestionId: string, restockRequestId?: string) => {
    const suggestion = get().getSuggestionById(suggestionId);
    if (!suggestion || suggestion.status === 'processed') return false;

    const updated = get().suggestions.map((s) =>
      s.id === suggestionId
        ? {
            ...s,
            status: 'processed' as const,
            processedAt: new Date().toISOString(),
            restockRequestId,
          }
        : s
    );

    set({ suggestions: updated });
    storage.set("voteSuggestions", updated);
    return true;
  },

  getPendingSuggestions: () => {
    return get().suggestions.filter((s) => s.status === 'pending');
  },

  getSuggestionById: (id: string) => {
    return get().suggestions.find((s) => s.id === id);
  },

  hasSuggestionForVote: (voteId: string) => {
    return get().suggestions.some((s) => s.voteId === voteId);
  },

  initSuggestions: () => {
    const saved = storage.get<VoteSuggestion[] | null>("voteSuggestions", null);
    set({ suggestions: saved || mockVoteSuggestions });
    if (!saved) {
      storage.set("voteSuggestions", mockVoteSuggestions);
    }
  },
}));
