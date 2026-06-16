import { create } from "zustand";
import type { Vote, VoteOption, VoteRecord } from "../types";
import { mockVote, mockVoteOptions, mockVoteRecords } from "../data/mockData";
import { storage } from "../utils/storage";
import { generateId } from "../utils/date";
import { useVoteSuggestionStore } from "./useVoteSuggestionStore";

interface VoteState {
  vote: Vote | null;
  options: VoteOption[];
  records: VoteRecord[];
  hasUserVoted: (userId: string) => boolean;
  getUserVote: (userId: string) => VoteRecord | undefined;
  submitVote: (userId: string, optionIds: string[]) => void;
  getTotalVotes: () => number;
  getVotePercentage: (optionId: string) => number;
  getWinningOption: () => VoteOption | undefined;
  checkVoteExpiry: () => void;
  closeVoteAndGenerateSuggestion: () => void;
  initVote: () => void;
}

export const useVoteStore = create<VoteState>((set, get) => ({
  vote: null,
  options: [],
  records: [],

  hasUserVoted: (userId: string) => {
    return get().records.some((r) => r.userId === userId && r.voteId === get().vote?.id);
  },

  getUserVote: (userId: string) => {
    return get().records.find((r) => r.userId === userId && r.voteId === get().vote?.id);
  },

  submitVote: (userId: string, optionIds: string[]) => {
    const vote = get().vote;
    if (!vote || !vote.isActive) return;

    const existingRecord = get().getUserVote(userId);
    let updatedRecords = [...get().records];
    let updatedOptions = [...get().options];

    if (existingRecord) {
      existingRecord.optionIds.forEach((optId) => {
        updatedOptions = updatedOptions.map((o) =>
          o.id === optId ? { ...o, votes: Math.max(0, o.votes - 1) } : o
        );
      });
      updatedRecords = updatedRecords.filter((r) => r.id !== existingRecord.id);
    }

    optionIds.forEach((optId) => {
      updatedOptions = updatedOptions.map((o) =>
        o.id === optId ? { ...o, votes: o.votes + 1 } : o
      );
    });

    const newRecord: VoteRecord = {
      id: generateId(),
      voteId: vote.id,
      userId,
      optionIds,
      timestamp: new Date().toISOString(),
    };

    updatedRecords = [newRecord, ...updatedRecords];

    set({ records: updatedRecords, options: updatedOptions });
    storage.set("voteRecords", updatedRecords);
    storage.set("voteOptions", updatedOptions);
  },

  getTotalVotes: () => {
    return get().options.reduce((sum, opt) => sum + opt.votes, 0);
  },

  getVotePercentage: (optionId: string) => {
    const total = get().getTotalVotes();
    if (total === 0) return 0;
    const option = get().options.find((o) => o.id === optionId);
    if (!option) return 0;
    return Math.round((option.votes / total) * 100);
  },

  getWinningOption: () => {
    const options = get().options;
    if (options.length === 0) return undefined;
    return [...options].sort((a, b) => b.votes - a.votes)[0];
  },

  checkVoteExpiry: () => {
    const vote = get().vote;
    if (!vote || !vote.isActive) return;

    const now = new Date();
    const endTime = new Date(vote.endTime);

    if (now >= endTime) {
      get().closeVoteAndGenerateSuggestion();
    }
  },

  closeVoteAndGenerateSuggestion: () => {
    const vote = get().vote;
    const suggestionStore = useVoteSuggestionStore.getState();

    if (!vote) return;

    if (suggestionStore.hasSuggestionForVote(vote.id)) {
      set({
        vote: { ...vote, isActive: false },
      });
      storage.set("vote", { ...vote, isActive: false });
      return;
    }

    const winningOption = get().getWinningOption();
    if (!winningOption) {
      set({
        vote: { ...vote, isActive: false },
      });
      storage.set("vote", { ...vote, isActive: false });
      return;
    }

    const suggestedQuantity = Math.max(20, winningOption.votes * 2);

    suggestionStore.addSuggestion(
      vote.id,
      vote.title,
      winningOption.id,
      winningOption.name,
      winningOption.icon,
      winningOption.votes,
      suggestedQuantity
    );

    const updatedVote = { ...vote, isActive: false };
    set({ vote: updatedVote });
    storage.set("vote", updatedVote);
  },

  initVote: () => {
    const savedVote = storage.get<Vote | null>("vote", null);
    const savedOptions = storage.get<VoteOption[] | null>("voteOptions", null);
    const savedRecords = storage.get<VoteRecord[] | null>("voteRecords", null);

    set({
      vote: savedVote || mockVote,
      options: savedOptions || mockVoteOptions,
      records: savedRecords || mockVoteRecords,
    });

    if (!savedVote) storage.set("vote", mockVote);
    if (!savedOptions) storage.set("voteOptions", mockVoteOptions);
    if (!savedRecords) storage.set("voteRecords", mockVoteRecords);

    setTimeout(() => {
      get().checkVoteExpiry();
    }, 100);
  },
}));
