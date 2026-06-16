import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useDutyStore } from "@/store/useDutyStore";
import { useUserStore } from "@/store/useUserStore";

export default function LowStockAlert() {
  const navigate = useNavigate();
  const { getLowStockMaterials, getUsableStock } = useMaterialStore();
  const { getCurrentDutyUser } = useDutyStore();
  const { getUserById } = useUserStore();

  const lowStockMaterials = getLowStockMaterials();
  const dutyUser = getCurrentDutyUser();

  if (lowStockMaterials.length === 0) return null;

  const criticalCount = lowStockMaterials.filter(
    (m) => getUsableStock(m.id) <= m.threshold * 0.3
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 mb-6 ${
        criticalCount > 0
          ? "bg-gradient-to-r from-danger-500 to-danger-400"
          : "bg-gradient-to-r from-amber-500 to-amber-400"
      } text-white shadow-medium`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl ${
            criticalCount > 0 ? "bg-white/20" : "bg-white/20"
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">
            {criticalCount > 0 ? "⚠️ 库存严重不足！" : "📢 库存偏低提醒"}
          </h3>
          <p className="text-white/80 text-sm mb-3">
            有 {lowStockMaterials.length} 种物料库存低于阈值，
            {criticalCount > 0 && `其中 ${criticalCount} 种严重不足！`}
            请及时补货。
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {lowStockMaterials.slice(0, 4).map((material) => (
              <span
                key={material.id}
                className="px-3 py-1 bg-white/20 rounded-full text-sm"
              >
                {material.icon} {material.name}
              </span>
            ))}
            {lowStockMaterials.length > 4 && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                +{lowStockMaterials.length - 4} 更多
              </span>
            )}
          </div>

          {dutyUser && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/70">本周采购负责人：</span>
              <img
                src={dutyUser.avatar}
                alt={dutyUser.name}
                className="w-6 h-6 rounded-full border border-white/30"
              />
              <span className="font-medium">{dutyUser.name}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/inventory")}
          className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors flex-shrink-0"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
