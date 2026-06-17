import { create } from "zustand";
import type { Review, MaterialRatingSummary } from "../types";
import { storage } from "../utils/storage";
import { generateId } from "../utils/date";

interface ReviewState {
  reviews: Review[];
  addReview: (
    userId: string,
    materialId: string,
    consumptionId: string,
    rating: 1 | 2 | 3 | 4 | 5,
    comment?: string
  ) => Review;
  getReviewsByMaterial: (materialId: string) => Review[];
  getReviewsByUser: (userId: string) => Review[];
  getReviewByConsumption: (consumptionId: string) => Review | undefined;
  getMaterialRating: (materialId: string) => MaterialRatingSummary;
  getAllMaterialRatings: () => Record<string, MaterialRatingSummary>;
  initReviews: () => void;
}

const mockReviews: Review[] = [];

export const useReviewStore = create<ReviewState>((set, get) => ({
  reviews: [],

  addReview: (userId, materialId, consumptionId, rating, comment) => {
    const newReview: Review = {
      id: generateId(),
      userId,
      materialId,
      consumptionId,
      rating,
      comment: comment?.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    const updated = [newReview, ...get().reviews];
    set({ reviews: updated });
    storage.set("reviews", updated);
    return newReview;
  },

  getReviewsByMaterial: (materialId) => {
    return get().reviews.filter((r) => r.materialId === materialId);
  },

  getReviewsByUser: (userId) => {
    return get().reviews.filter((r) => r.userId === userId);
  },

  getReviewByConsumption: (consumptionId) => {
    return get().reviews.find((r) => r.consumptionId === consumptionId);
  },

  getMaterialRating: (materialId) => {
    const reviews = get().getReviewsByMaterial(materialId);
    const reviewCount = reviews.length;
    const averageRating =
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    return {
      materialId,
      averageRating: Number(averageRating.toFixed(1)),
      reviewCount,
    };
  },

  getAllMaterialRatings: () => {
    const { reviews } = get();
    const result: Record<string, MaterialRatingSummary> = {};

    reviews.forEach((r) => {
      if (!result[r.materialId]) {
        result[r.materialId] = {
          materialId: r.materialId,
          averageRating: 0,
          reviewCount: 0,
        };
      }
    });

    Object.keys(result).forEach((materialId) => {
      const rating = get().getMaterialRating(materialId);
      result[materialId] = rating;
    });

    return result;
  },

  initReviews: () => {
    const saved = storage.get<Review[] | null>("reviews", null);
    const data = saved || mockReviews;
    set({ reviews: data });
    if (!saved) {
      storage.set("reviews", mockReviews);
    }
  },
}));
