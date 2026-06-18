import { create } from "zustand";
import type { DrinkRecipe, DrinkRecipeAvailability, Material } from "../types";
import { mockDrinkRecipes } from "../data/mockData";
import { storage } from "../utils/storage";
import { formatDate } from "../utils/date";

const getTodaysDateKey = () => formatDate(new Date(), "YYYY-MM-DD");

const getDailyRecipeIndex = (totalRecipes: number) => {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % totalRecipes;
};

interface SpecialDrinkState {
  recipes: DrinkRecipe[];
  currentRecipeIndex: number;
  lastDateKey: string;

  getAllRecipes: () => DrinkRecipe[];
  getTodaysRecipe: () => DrinkRecipe;
  getRecipeById: (id: string) => DrinkRecipe | undefined;
  getRecipeAvailability: (
    recipeId: string,
    materials: Material[],
    getUsableStock: (materialId: string) => number
  ) => DrinkRecipeAvailability;
  setRecipeIndex: (index: number) => void;
  nextRecipe: () => void;
  prevRecipe: () => void;
  checkAndUpdateDaily: () => void;
  initSpecialDrinks: () => void;
}

export const useSpecialDrinkStore = create<SpecialDrinkState>((set, get) => ({
  recipes: [],
  currentRecipeIndex: 0,
  lastDateKey: "",

  getAllRecipes: () => {
    return get().recipes;
  },

  getTodaysRecipe: () => {
    const { recipes, currentRecipeIndex } = get();
    const safeIndex = currentRecipeIndex % recipes.length;
    return recipes[safeIndex] || recipes[0];
  },

  getRecipeById: (id: string) => {
    return get().recipes.find((r) => r.id === id);
  },

  getRecipeAvailability: (
    recipeId: string,
    materials: Material[],
    getUsableStock: (materialId: string) => number
  ) => {
    const recipe = get().getRecipeById(recipeId);
    if (!recipe) {
      return {
        recipeId,
        available: false,
        unavailableIngredients: [],
        totalCost: 0,
      };
    }

    const unavailableIngredients: {
      materialId: string;
      materialName: string;
      needed: number;
      available: number;
    }[] = [];
    let totalCost = 0;
    let available = true;

    recipe.ingredients.forEach((ingredient) => {
      const material = materials.find((m) => m.id === ingredient.materialId);
      const stock = getUsableStock(ingredient.materialId);

      if (material) {
        totalCost += material.unitPrice * ingredient.quantity;
      }

      if (stock < ingredient.quantity) {
        available = false;
        unavailableIngredients.push({
          materialId: ingredient.materialId,
          materialName: ingredient.materialName,
          needed: ingredient.quantity,
          available: stock,
        });
      }
    });

    return {
      recipeId,
      available,
      unavailableIngredients,
      totalCost: Math.round(totalCost * 100) / 100,
    };
  },

  setRecipeIndex: (index: number) => {
    const recipes = get().recipes;
    const safeIndex = ((index % recipes.length) + recipes.length) % recipes.length;
    set({ currentRecipeIndex: safeIndex });
    storage.set("specialDrinkIndex", safeIndex);
  },

  nextRecipe: () => {
    const { currentRecipeIndex, recipes } = get();
    const nextIndex = (currentRecipeIndex + 1) % recipes.length;
    set({ currentRecipeIndex: nextIndex });
    storage.set("specialDrinkIndex", nextIndex);
  },

  prevRecipe: () => {
    const { currentRecipeIndex, recipes } = get();
    const prevIndex =
      (currentRecipeIndex - 1 + recipes.length) % recipes.length;
    set({ currentRecipeIndex: prevIndex });
    storage.set("specialDrinkIndex", prevIndex);
  },

  checkAndUpdateDaily: () => {
    const todayKey = getTodaysDateKey();
    const { lastDateKey, recipes } = get();

    if (lastDateKey !== todayKey) {
      const dailyIndex = getDailyRecipeIndex(recipes.length);
      set({
        currentRecipeIndex: dailyIndex,
        lastDateKey: todayKey,
      });
      storage.set("specialDrinkIndex", dailyIndex);
      storage.set("specialDrinkLastDate", todayKey);
    }
  },

  initSpecialDrinks: () => {
    const savedIndex = storage.get<number | null>("specialDrinkIndex", null);
    const savedLastDate = storage.get<string | null>(
      "specialDrinkLastDate",
      null
    );
    const todayKey = getTodaysDateKey();

    let finalIndex: number;

    if (!savedLastDate || savedLastDate !== todayKey) {
      finalIndex = getDailyRecipeIndex(mockDrinkRecipes.length);
      storage.set("specialDrinkLastDate", todayKey);
    } else if (savedIndex !== null) {
      finalIndex = savedIndex;
    } else {
      finalIndex = getDailyRecipeIndex(mockDrinkRecipes.length);
    }

    set({
      recipes: mockDrinkRecipes,
      currentRecipeIndex: finalIndex,
      lastDateKey: savedLastDate || todayKey,
    });

    storage.set("specialDrinkIndex", finalIndex);
    if (!savedLastDate) {
      storage.set("specialDrinkLastDate", todayKey);
    }
  },
}));
