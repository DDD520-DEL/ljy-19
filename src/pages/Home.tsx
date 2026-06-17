import { useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Droplets, Cookie, Sparkles, AlertTriangle, AlertOctagon, Clock } from "lucide-react";
import MaterialCard from "@/components/MaterialCard/MaterialCard";
import LowStockAlert from "@/components/LowStockAlert/LowStockAlert";
import StatsCard from "@/components/StatsCard/StatsCard";
import Toast, { ToastType } from "@/components/Toast/Toast";
import ReviewModal from "@/components/ReviewModal/ReviewModal";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useUserStore } from "@/store/useUserStore";
import { useConsumptionStore } from "@/store/useConsumptionStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useGroupPurchaseStore } from "@/store/useGroupPurchaseStore";
import { useReviewStore } from "@/store/useReviewStore";
import { type MaterialCategory, type Material, type Consumption } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency, getBatchExpiryInfo, formatExpiryStatus } from "@/utils/date";

const categories: { key: MaterialCategory | "all"; label: string; icon: string }[] = [
  { key: "all", label: "全部", icon: "✨" },
  { key: "coffee", label: "咖啡豆", icon: "☕" },
  { key: "tea", label: "茶包", icon: "🍵" },
  { key: "dairy", label: "奶制品", icon: "🥛" },
  { key: "snack", label: "零食", icon: "🍪" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | "all">("all");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [pendingReview, setPendingReview] = useState<{
    material: Material;
    consumption: Consumption;
    quantity: number;
  } | null>(null);

  const { materials, consumeMaterial, getUsableStock, getExpiringSoonBatches } = useMaterialStore();
  const { currentUser } = useUserStore();
  const { addConsumption, getUserStats, getMonthlyStats } = useConsumptionStore();
  const { getUserBudgetInfo, checkCanConsume } = useBudgetStore();
  const { getLockedQuantityForMaterial } = useGroupPurchaseStore();
  const { addReview } = useReviewStore();

  const filteredMaterials = activeCategory === "all"
    ? materials
    : materials.filter((m) => m.category === activeCategory);

  const userStats = currentUser ? getUserStats(currentUser.id) : null;
  const monthlyStats = getMonthlyStats();
  const userBudgetInfo = currentUser ? getUserBudgetInfo(currentUser.id) : null;

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleConsume = (materialId: string, quantity: number) => {
    if (!currentUser) {
      showToast("请先选择用户身份", "warning");
      return;
    }

    const budgetCheck = checkCanConsume(currentUser.id, materialId, quantity);
    if (!budgetCheck.canConsume) {
      showToast(`剩余额度不足！本次需 ${formatCurrency(budgetCheck.cost)}，剩余 ${formatCurrency(budgetCheck.remaining)}`, "error");
      return;
    }

    const usableStock = getUsableStock(materialId);
    const lockedQty = getLockedQuantityForMaterial(materialId);
    const availableStock = usableStock - lockedQty;
    if (availableStock < quantity) {
      if (lockedQty > 0) {
        showToast(`可用库存不足（拼单锁定 ${lockedQty}，实际可用 ${availableStock}）`, "error");
      } else {
        showToast("可用库存不足（扣除过期批次后），请联系采购负责人补货", "error");
      }
      return;
    }

    const success = consumeMaterial(materialId, quantity);
    if (success) {
      const consumption = addConsumption(currentUser.id, materialId, quantity);
      const material = materials.find((m) => m.id === materialId);
      showToast(`取用成功！${material?.icon} ${material?.name} x${quantity}，消费 ${formatCurrency(budgetCheck.cost)}`, "success");

      if (material) {
        setPendingReview({ material, consumption, quantity });
        setTimeout(() => setReviewModalOpen(true), 500);
      }
    } else {
      showToast("库存不足，请联系采购负责人补货", "error");
    }
  };

  const handleReviewSubmit = (rating: 1 | 2 | 3 | 4 | 5, comment?: string) => {
    if (!pendingReview || !currentUser) return;

    addReview(
      currentUser.id,
      pendingReview.material.id,
      pendingReview.consumption.id,
      rating,
      comment
    );

    showToast("感谢您的评价！", "success");
    setReviewModalOpen(false);
    setPendingReview(null);
  };

  const handleReviewClose = () => {
    setReviewModalOpen(false);
    setPendingReview(null);
  };

  const expiringSoonBatches = getExpiringSoonBatches(7);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div>
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={handleReviewClose}
        material={pendingReview?.material || null}
        quantity={pendingReview?.quantity || 0}
        onSubmit={handleReviewSubmit}
      />

      <LowStockAlert />

      {expiringSoonBatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6 shadow-soft"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl">
                <AlertOctagon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800">⚠️ 保质期提醒</h3>
                <p className="text-sm text-amber-600">
                  {expiringSoonBatches.length} 个批次将在 7 天内过期，请尽快使用
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-700">
                {expiringSoonBatches.reduce((sum, b) => sum + b.remainingQuantity, 0)}
              </p>
              <p className="text-xs text-amber-500">即将过期总数量</p>
            </div>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {expiringSoonBatches.map((batch, index) => {
              const expiryInfo = getBatchExpiryInfo(batch.expiryDate);
              return (
                <motion.div
                  key={batch.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-white/80 rounded-xl border border-amber-100 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: batch.material.color + "30" }}
                    >
                      {batch.material.icon}
                    </div>
                    <div>
                      <p className="font-medium text-coffee-800">{batch.material.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <p className="text-xs text-amber-600">
                          到期日：{batch.expiryDate}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-sm font-semibold rounded-full">
                      {batch.remainingQuantity}{batch.material.unit}
                    </span>
                    <p className={cn(
                      "text-xs mt-1 font-medium",
                      expiryInfo.daysUntilExpiry <= 2 ? "text-danger-600" : "text-amber-600"
                    )}>
                      {formatExpiryStatus(expiryInfo)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {userBudgetInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-4 mb-6 shadow-soft",
            userBudgetInfo.usagePercentage >= 90
              ? "bg-danger-50 border border-danger-200"
              : userBudgetInfo.usagePercentage >= 70
              ? "bg-amber-50 border border-amber-200"
              : "bg-matcha-50 border border-matcha-200"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={cn(
                  "w-5 h-5",
                  userBudgetInfo.usagePercentage >= 90
                    ? "text-danger-500"
                    : userBudgetInfo.usagePercentage >= 70
                    ? "text-amber-500"
                    : "text-matcha-500"
                )}
              />
              <span
                className={cn(
                  "font-semibold",
                  userBudgetInfo.usagePercentage >= 90
                    ? "text-danger-700"
                    : userBudgetInfo.usagePercentage >= 70
                    ? "text-amber-700"
                    : "text-matcha-700"
                )}
              >
                本月消费额度
              </span>
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                userBudgetInfo.usagePercentage >= 90
                  ? "text-danger-600"
                  : userBudgetInfo.usagePercentage >= 70
                  ? "text-amber-600"
                  : "text-matcha-600"
              )}
            >
              {formatCurrency(userBudgetInfo.usedAmount)} / {formatCurrency(userBudgetInfo.totalBudget)}
            </span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${userBudgetInfo.usagePercentage}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={cn(
                "h-full rounded-full",
                userBudgetInfo.usagePercentage >= 90
                  ? "bg-danger-500"
                  : userBudgetInfo.usagePercentage >= 70
                  ? "bg-amber-500"
                  : "bg-matcha-500"
              )}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span
              className={
                userBudgetInfo.usagePercentage >= 90
                  ? "text-danger-600"
                  : userBudgetInfo.usagePercentage >= 70
                  ? "text-amber-600"
                  : "text-matcha-600"
              }
            >
              已用 {userBudgetInfo.usagePercentage.toFixed(1)}%
            </span>
            <span
              className={
                userBudgetInfo.remainingAmount < 10
                  ? "text-danger-600 font-medium"
                  : "text-coffee-500"
              }
            >
              剩余 {formatCurrency(userBudgetInfo.remainingAmount)}
            </span>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="本月总杯数"
          value={monthlyStats.totalCups}
          subtitle="全公司消耗"
          icon={<Coffee className="w-5 h-5" />}
          color="coffee"
        />
        <StatsCard
          title="本月总费用"
          value={formatCurrency(monthlyStats.totalCost)}
          subtitle="物料采购成本"
          icon={<Droplets className="w-5 h-5" />}
          color="matcha"
        />
        <StatsCard
          title="活跃人数"
          value={monthlyStats.activeUsers}
          subtitle="本月参与人数"
          icon={<Sparkles className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="我的消耗"
          value={userStats?.totalConsumptions || 0}
          subtitle={`${formatCurrency(userStats?.totalCost || 0)}`}
          icon={<Cookie className="w-5 h-5" />}
          color="coffee"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat) => (
            <motion.button
              key={cat.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                activeCategory === cat.key
                  ? "bg-coffee-700 text-white shadow-soft"
                  : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredMaterials.map((material) => (
          <motion.div key={material.id} variants={item}>
            <MaterialCard
              material={material}
              onConsume={(qty) => handleConsume(material.id, qty)}
            />
          </motion.div>
        ))}
      </motion.div>

      {filteredMaterials.length === 0 && (
        <div className="text-center py-12">
          <p className="text-coffee-400">暂无物料</p>
        </div>
      )}
    </div>
  );
}
