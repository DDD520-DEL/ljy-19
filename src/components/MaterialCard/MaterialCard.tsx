import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Material } from "@/types";
import { getStockStatus, getBatchExpiryInfo, formatExpiryStatus } from "@/utils/date";
import { Plus, AlertTriangle, AlertOctagon, Lock, Star } from "lucide-react";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useGroupPurchaseStore } from "@/store/useGroupPurchaseStore";
import { useReviewStore } from "@/store/useReviewStore";

interface MaterialCardProps {
  material: Material;
  onConsume?: (quantity: number) => void;
  showConsumeButton?: boolean;
  className?: string;
}

export default function MaterialCard({
  material,
  onConsume,
  showConsumeButton = true,
  className,
}: MaterialCardProps) {
  const { getUsableStock, getExpiringSoonBatches, getExpiredBatches } = useMaterialStore();
  const { getLockedQuantityForMaterial } = useGroupPurchaseStore();
  const { getMaterialRating } = useReviewStore();

  const usableStock = getUsableStock(material.id);
  const lockedQty = getLockedQuantityForMaterial(material.id);
  const availableStock = Math.max(0, usableStock - lockedQty);
  const stockStatus = getStockStatus(usableStock, material.threshold);
  const stockPercentage = Math.min((usableStock / (material.threshold * 3)) * 100, 100);
  const rating = getMaterialRating(material.id);

  const expiringSoonForMaterial = getExpiringSoonBatches(7).filter(
    (b) => b.materialId === material.id
  );
  const expiredForMaterial = getExpiredBatches().filter(
    (b) => b.materialId === material.id
  );

  const hasExpiringSoon = expiringSoonForMaterial.length > 0;
  const hasExpired = expiredForMaterial.length > 0;
  const expiringSoonTotal = expiringSoonForMaterial.reduce(
    (sum, b) => sum + b.remainingQuantity, 0
  );

  const mostUrgentBatch = [...expiringSoonForMaterial].sort(
    (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
  )[0];

  const statusColors = {
    sufficient: "bg-matcha-400",
    low: "bg-amber-400",
    critical: "bg-danger-500",
  };

  const statusTextColors = {
    sufficient: "text-matcha-600",
    low: "text-amber-600",
    critical: "text-danger-500",
  };

  const statusBgColors = {
    sufficient: "bg-matcha-50",
    low: "bg-amber-50",
    critical: "bg-danger-50",
  };

  const statusLabels = {
    sufficient: "库存充足",
    low: "库存偏低",
    critical: "库存不足",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-white rounded-2xl shadow-soft p-5 transition-all duration-300 hover:shadow-medium",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: material.color + "20" }}
        >
          {material.icon}
        </div>
        <span
          className={cn(
            "badge text-xs font-medium",
            statusBgColors[stockStatus],
            statusTextColors[stockStatus]
          )}
        >
          {statusLabels[stockStatus]}
        </span>
      </div>

      <h3 className="text-lg font-bold text-coffee-800 mb-1">{material.name}</h3>
      <p className="text-sm text-coffee-400 mb-2">{material.description}</p>

      {rating.reviewCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-3.5 h-3.5 flex-shrink-0",
                  star <= Math.round(rating.averageRating)
                    ? "text-amber-400 fill-amber-400"
                    : "text-coffee-200"
                )}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-amber-600">
            {rating.averageRating.toFixed(1)}
          </span>
          <span className="text-xs text-coffee-400">
            ({rating.reviewCount} 条评价)
          </span>
        </div>
      )}

      {(hasExpiringSoon || hasExpired) && (
        <div className="mb-3 space-y-1.5">
          {hasExpiringSoon && mostUrgentBatch && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-700">
                  {expiringSoonTotal}{material.unit} 即将过期
                </p>
                <p className="text-xs text-amber-600">
                  最快到期：{formatExpiryStatus(getBatchExpiryInfo(mostUrgentBatch.expiryDate))}
                </p>
              </div>
            </div>
          )}
          {hasExpired && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
              <AlertOctagon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                有 {expiredForMaterial.length} 个批次已过期
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-coffee-500">剩余库存</span>
          <div className="text-right">
            <span className={cn("text-sm font-bold", statusTextColors[stockStatus])}>
              {usableStock} {material.unit}
            </span>
            {lockedQty > 0 && (
              <div className="flex items-center gap-1 justify-end">
                <Lock className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-amber-500">拼单锁定 {lockedQty}{material.unit}</span>
              </div>
            )}
            {material.stock > usableStock && (
              <p className="text-xs text-gray-400">
                (含过期 {material.stock - usableStock}{material.unit})
              </p>
            )}
          </div>
        </div>
        <div className="progress-bar">
          <motion.div
            className={cn("progress-fill", statusColors[stockStatus])}
            initial={{ width: 0 }}
            animate={{ width: `${stockPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-coffee-300">阈值: {material.threshold}</span>
          <span className="text-xs text-coffee-400">¥{material.unitPrice}/{material.unit}</span>
        </div>
      </div>

      {showConsumeButton && onConsume && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onConsume(1)}
            disabled={availableStock < 1}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
              availableStock >= 1
                ? "bg-coffee-700 text-white hover:bg-coffee-800 active:scale-95"
                : "bg-coffee-100 text-coffee-300 cursor-not-allowed"
            )}
          >
            取用 1{material.unit}
          </button>
          <button
            onClick={() => onConsume(1)}
            disabled={availableStock < 1}
            className={cn(
              "p-2.5 rounded-xl transition-colors",
              availableStock >= 1
                ? "bg-cream-100 text-coffee-600 hover:bg-cream-200"
                : "bg-coffee-50 text-coffee-300 cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
