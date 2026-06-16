import { create } from "zustand";
import type { Material, Restock, StockStatus, MaterialCategory, Batch } from "../types";
import { mockMaterials, mockRestocks } from "../data/mockData";
import { storage } from "../utils/storage";
import { generateId, getStockStatus, getBatchExpiryInfo, formatDate, addDays } from "../utils/date";

const DATA_VERSION = 2;
const DATA_VERSION_KEY = "materialDataVersion";

interface BatchInfo {
  batch: Batch;
  expiryInfo: ReturnType<typeof getBatchExpiryInfo>;
}

type BatchWithMaterial = Batch & {
  material: Material;
  expiryInfo: ReturnType<typeof getBatchExpiryInfo>;
};

interface MaterialState {
  materials: Material[];
  restocks: Restock[];
  getMaterialsByCategory: (category: MaterialCategory) => Material[];
  getMaterialById: (id: string) => Material | undefined;
  getStockStatus: (materialId: string) => StockStatus;
  getLowStockMaterials: () => Material[];
  getUsableStock: (materialId: string) => number;
  getAvailableBatches: (materialId: string) => Batch[];
  getSortedBatchesByExpiry: (materialId: string) => BatchInfo[];
  getExpiringSoonBatches: (days?: number) => BatchWithMaterial[];
  getExpiredBatches: () => BatchWithMaterial[];
  consumeMaterial: (materialId: string, quantity: number) => boolean;
  consumeFromBatch: (materialId: string, batchId: string, quantity: number) => boolean;
  restockMaterial: (
    materialId: string,
    quantity: number,
    operatorId: string,
    cost: number,
    batchInfo?: { productionDate: string; expiryDate: string } | null
  ) => void;
  restockMaterialWithBatches: (
    materialId: string,
    operatorId: string,
    cost: number,
    batches: Array<{ quantity: number; productionDate: string; expiryDate: string }>
  ) => void;
  addBatch: (
    materialId: string,
    quantity: number,
    productionDate: string,
    expiryDate: string
  ) => void;
  updateThreshold: (materialId: string, threshold: number) => void;
  recalculateMaterialStock: (materialId: string) => void;
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
    const usableStock = get().getUsableStock(materialId);
    return getStockStatus(usableStock, material.threshold);
  },

  getLowStockMaterials: () => {
    return get().materials.filter((m) => {
      const usableStock = get().getUsableStock(m.id);
      return usableStock <= m.threshold;
    });
  },

  getUsableStock: (materialId: string) => {
    const material = get().getMaterialById(materialId);
    if (!material) return 0;
    return material.batches.reduce((total, batch) => {
      const expiryInfo = getBatchExpiryInfo(batch.expiryDate);
      if (expiryInfo.isExpired || batch.remainingQuantity <= 0) return total;
      return total + batch.remainingQuantity;
    }, 0);
  },

  getAvailableBatches: (materialId: string) => {
    const material = get().getMaterialById(materialId);
    if (!material) return [];
    return material.batches.filter((b) => {
      const expiryInfo = getBatchExpiryInfo(b.expiryDate);
      return !expiryInfo.isExpired && b.remainingQuantity > 0;
    });
  },

  getSortedBatchesByExpiry: (materialId: string) => {
    const material = get().getMaterialById(materialId);
    if (!material) return [];
    const batchesWithInfo = material.batches.map((batch) => ({
      batch,
      expiryInfo: getBatchExpiryInfo(batch.expiryDate),
    }));
    return batchesWithInfo.sort((a, b) => {
      return new Date(a.batch.expiryDate).getTime() - new Date(b.batch.expiryDate).getTime();
    });
  },

  getExpiringSoonBatches: (days?: number) => {
    const result = get().materials.flatMap((material) => {
      return material.batches
        .map((batch) => ({
          ...batch,
          material,
          expiryInfo: getBatchExpiryInfo(batch.expiryDate, days),
        }))
        .filter(
          (b) =>
            b.expiryInfo.isExpiringSoon && !b.expiryInfo.isExpired && b.remainingQuantity > 0
        );
    });
    return result.sort(
      (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    );
  },

  getExpiredBatches: () => {
    return get().materials.flatMap((material) => {
      return material.batches
        .map((batch) => ({
          ...batch,
          material,
          expiryInfo: getBatchExpiryInfo(batch.expiryDate),
        }))
        .filter((b) => b.expiryInfo.isExpired && b.remainingQuantity > 0);
    });
  },

  consumeMaterial: (materialId: string, quantity: number) => {
    const sortedBatches = get().getSortedBatchesByExpiry(materialId);
    const availableBatches = sortedBatches.filter(
      (b) => !b.expiryInfo.isExpired && b.batch.remainingQuantity > 0
    );

    const totalAvailable = availableBatches.reduce(
      (sum, b) => sum + b.batch.remainingQuantity,
      0
    );
    if (totalAvailable < quantity) return false;

    let remainingToConsume = quantity;
    const updatedBatchMap = new Map<string, number>();

    for (const { batch } of availableBatches) {
      if (remainingToConsume <= 0) break;
      const consumeFromThisBatch = Math.min(batch.remainingQuantity, remainingToConsume);
      updatedBatchMap.set(batch.id, batch.remainingQuantity - consumeFromThisBatch);
      remainingToConsume -= consumeFromThisBatch;
    }

    const updatedMaterials = get().materials.map((m) => {
      if (m.id !== materialId) return m;
      const updatedBatches = m.batches.map((b) => {
        if (updatedBatchMap.has(b.id)) {
          return { ...b, remainingQuantity: updatedBatchMap.get(b.id)! };
        }
        return b;
      });
      const newStock = updatedBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);
      return { ...m, batches: updatedBatches, stock: newStock };
    });

    set({ materials: updatedMaterials });
    storage.set("materials", updatedMaterials);
    return true;
  },

  consumeFromBatch: (materialId: string, batchId: string, quantity: number) => {
    const material = get().getMaterialById(materialId);
    if (!material) return false;

    const batch = material.batches.find((b) => b.id === batchId);
    if (!batch) return false;

    const expiryInfo = getBatchExpiryInfo(batch.expiryDate);
    if (expiryInfo.isExpired) return false;
    if (batch.remainingQuantity < quantity) return false;

    const updatedMaterials = get().materials.map((m) => {
      if (m.id !== materialId) return m;
      const updatedBatches = m.batches.map((b) => {
        if (b.id === batchId) {
          return { ...b, remainingQuantity: b.remainingQuantity - quantity };
        }
        return b;
      });
      const newStock = updatedBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);
      return { ...m, batches: updatedBatches, stock: newStock };
    });

    set({ materials: updatedMaterials });
    storage.set("materials", updatedMaterials);
    return true;
  },

  restockMaterial: (
    materialId: string,
    quantity: number,
    operatorId: string,
    cost: number,
    batchInfo: { productionDate: string; expiryDate: string } | null = null
  ) => {
    const material = get().getMaterialById(materialId);
    if (!material) return;

    const now = new Date();
    const productionDate = batchInfo?.productionDate || formatDate(now, "YYYY-MM-DD");
    const defaultShelfLife = material.defaultShelfLifeDays || 90;
    const expiryDate =
      batchInfo?.expiryDate ||
      formatDate(addDays(new Date(productionDate), defaultShelfLife), "YYYY-MM-DD");

    const newBatch: Batch = {
      id: generateId(),
      materialId,
      productionDate,
      expiryDate,
      quantity,
      remainingQuantity: quantity,
      createdAt: now.toISOString(),
    };

    const updatedMaterials = get().materials.map((m) => {
      if (m.id !== materialId) return m;
      const updatedBatches = [...m.batches, newBatch];
      const newStock = updatedBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);
      return { ...m, batches: updatedBatches, stock: newStock };
    });

    const newRestock: Restock = {
      id: generateId(),
      materialId,
      quantity,
      operatorId,
      timestamp: now.toISOString(),
      cost,
    };

    const updatedRestocks = [newRestock, ...get().restocks];

    set({ materials: updatedMaterials, restocks: updatedRestocks });
    storage.set("materials", updatedMaterials);
    storage.set("restocks", updatedRestocks);
  },

  restockMaterialWithBatches: (
    materialId: string,
    operatorId: string,
    cost: number,
    batches: Array<{ quantity: number; productionDate: string; expiryDate: string }>
  ) => {
    const material = get().getMaterialById(materialId);
    if (!material) return;

    const now = new Date();
    let totalQuantity = 0;

    const newBatches: Batch[] = batches.map((b) => {
      totalQuantity += b.quantity;
      return {
        id: generateId(),
        materialId,
        productionDate: b.productionDate,
        expiryDate: b.expiryDate,
        quantity: b.quantity,
        remainingQuantity: b.quantity,
        createdAt: now.toISOString(),
      };
    });

    const updatedMaterials = get().materials.map((m) => {
      if (m.id !== materialId) return m;
      const updatedBatches = [...m.batches, ...newBatches];
      const newStock = updatedBatches.reduce(
        (sum, batch) => sum + batch.remainingQuantity, 0
      );
      return { ...m, batches: updatedBatches, stock: newStock };
    });

    const newRestock: Restock = {
      id: generateId(),
      materialId,
      quantity: totalQuantity,
      operatorId,
      timestamp: now.toISOString(),
      cost,
    };

    const updatedRestocks = [newRestock, ...get().restocks];

    set({ materials: updatedMaterials, restocks: updatedRestocks });
    storage.set("materials", updatedMaterials);
    storage.set("restocks", updatedRestocks);
  },

  addBatch: (
    materialId: string,
    quantity: number,
    productionDate: string,
    expiryDate: string
  ) => {
    const now = new Date();

    const newBatch: Batch = {
      id: generateId(),
      materialId,
      productionDate,
      expiryDate,
      quantity,
      remainingQuantity: quantity,
      createdAt: now.toISOString(),
    };

    const updatedMaterials = get().materials.map((m) => {
      if (m.id !== materialId) return m;
      const updatedBatches = [...m.batches, newBatch];
      const newStock = updatedBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);
      return { ...m, batches: updatedBatches, stock: newStock };
    });

    set({ materials: updatedMaterials });
    storage.set("materials", updatedMaterials);
  },

  updateThreshold: (materialId: string, threshold: number) => {
    const updatedMaterials = get().materials.map((m) =>
      m.id === materialId ? { ...m, threshold } : m
    );

    set({ materials: updatedMaterials });
    storage.set("materials", updatedMaterials);
  },

  recalculateMaterialStock: (materialId: string) => {
    const updatedMaterials = get().materials.map((m) => {
      if (m.id !== materialId) return m;
      const newStock = m.batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
      return { ...m, stock: newStock };
    });

    set({ materials: updatedMaterials });
    storage.set("materials", updatedMaterials);
  },

  initMaterials: () => {
    const savedVersion = storage.get<number | null>(DATA_VERSION_KEY, null);
    const savedMaterials = storage.get<Material[] | null>("materials", null);
    const savedRestocks = storage.get<Restock[] | null>("restocks", null);

    let finalMaterials: Material[];
    const versionMismatch = savedVersion !== DATA_VERSION;

    if (versionMismatch) {
      finalMaterials = mockMaterials;
      storage.set("materials", mockMaterials);
      storage.set(DATA_VERSION_KEY, DATA_VERSION);
    } else if (savedMaterials) {
      const hasMigration = savedMaterials.some((m) => !m.batches || m.batches.length === 0);
      if (hasMigration) {
        finalMaterials = savedMaterials.map((m) => {
          if (!m.batches || m.batches.length === 0) {
            const shelfLifeDays = m.defaultShelfLifeDays || 90;
            const productionDate = new Date();
            const expiryDate = addDays(productionDate, shelfLifeDays);
            const migratedBatch: Batch = {
              id: generateId(),
              materialId: m.id,
              productionDate: productionDate.toISOString().split("T")[0],
              expiryDate: expiryDate.toISOString().split("T")[0],
              quantity: m.stock,
              remainingQuantity: m.stock,
              createdAt: new Date().toISOString(),
            };
            return {
              ...m,
              defaultShelfLifeDays: m.defaultShelfLifeDays || 90,
              batches: [migratedBatch],
            };
          }
          return m;
        });
        storage.set("materials", finalMaterials);
      } else {
        finalMaterials = savedMaterials;
      }
    } else {
      finalMaterials = mockMaterials;
      storage.set("materials", mockMaterials);
      storage.set(DATA_VERSION_KEY, DATA_VERSION);
    }

    set({
      materials: finalMaterials,
      restocks: savedRestocks && !versionMismatch ? savedRestocks : mockRestocks,
    });

    if (!savedRestocks || versionMismatch) {
      storage.set("restocks", mockRestocks);
    }
  },
}));
