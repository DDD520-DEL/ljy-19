import { create } from "zustand";
import type { Material, Restock, StockStatus, MaterialCategory } from "../types";
import { mockMaterials, mockRestocks } from "../data/mockData";
import { storage } from "../utils/storage";
import { generateId, getStockStatus } from "../utils/date";

interface MaterialState {
  materials: Material[];
  restocks: Restock[];
  getMaterialsByCategory: (category: MaterialCategory) => Material[];
  getMaterialById: (id: string) => Material | undefined;
  getStockStatus: (materialId: string) => StockStatus;
  getLowStockMaterials: () => Material[];
  consumeMaterial: (materialId: string, quantity: number) => boolean;
  restockMaterial: (materialId: string, quantity: number, operatorId: string, cost: number) => void;
  updateThreshold: (materialId: string, threshold: number) => void;
  initMaterials: () => void;
}

export const useMaterialStore = create<MaterialState>((set, get) => ({
  materials: [],
  restocks: [],

  getMaterialsByCategory: (category: MaterialCategory) => {
    return get().materials.filter((m) => m.category === category);
  },

  getMaterialById: (id: string) => {
    return get().materials.find((m) => m.id === id);
  },

  getStockStatus: (materialId: string) => {
    const material = get().getMaterialById(materialId);
    if (!material) return "sufficient";
    return getStockStatus(material.stock, material.threshold);
  },

  getLowStockMaterials: () => {
    return get().materials.filter((m) => m.stock <= m.threshold);
  },

  consumeMaterial: (materialId: string, quantity: number) => {
    const material = get().getMaterialById(materialId);
    if (!material || material.stock < quantity) return false;

    const updatedMaterials = get().materials.map((m) =>
      m.id === materialId ? { ...m, stock: m.stock - quantity } : m
    );

    set({ materials: updatedMaterials });
    storage.set("materials", updatedMaterials);
    return true;
  },

  restockMaterial: (materialId: string, quantity: number, operatorId: string, cost: number) => {
    const updatedMaterials = get().materials.map((m) =>
      m.id === materialId ? { ...m, stock: m.stock + quantity } : m
    );

    const newRestock: Restock = {
      id: generateId(),
      materialId,
      quantity,
      operatorId,
      timestamp: new Date().toISOString(),
      cost,
    };

    const updatedRestocks = [newRestock, ...get().restocks];

    set({ materials: updatedMaterials, restocks: updatedRestocks });
    storage.set("materials", updatedMaterials);
    storage.set("restocks", updatedRestocks);
  },

  updateThreshold: (materialId: string, threshold: number) => {
    const updatedMaterials = get().materials.map((m) =>
      m.id === materialId ? { ...m, threshold } : m
    );

    set({ materials: updatedMaterials });
    storage.set("materials", updatedMaterials);
  },

  initMaterials: () => {
    const savedMaterials = storage.get<Material[] | null>("materials", null);
    const savedRestocks = storage.get<Restock[] | null>("restocks", null);

    set({
      materials: savedMaterials || mockMaterials,
      restocks: savedRestocks || mockRestocks,
    });

    if (!savedMaterials) {
      storage.set("materials", mockMaterials);
    }
    if (!savedRestocks) {
      storage.set("restocks", mockRestocks);
    }
  },
}));
