import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Material } from "@/types";
import { getStockStatus } from "@/utils/date";
import { Plus, Minus } from "lucide-react";

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
  const stockStatus = getStockStatus(material.stock, material.threshold);
  const stockPercentage = Math.min((material.stock / (material.threshold * 3)) * 100, 100);

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
      <p className="text-sm text-coffee-400 mb-4">{material.description}</p>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-coffee-500">剩余库存</span>
          <span className={cn("text-sm font-bold", statusTextColors[stockStatus])}>
            {material.stock} {material.unit}
          </span>
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
            disabled={material.stock < 1}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-medium text-sm transition-all duration-200",
              material.stock >= 1
                ? "bg-coffee-700 text-white hover:bg-coffee-800 active:scale-95"
                : "bg-coffee-100 text-coffee-300 cursor-not-allowed"
            )}
          >
            取用 1{material.unit}
          </button>
          <button
            onClick={() => onConsume(1)}
            className="p-2.5 rounded-xl bg-cream-100 text-coffee-600 hover:bg-cream-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
