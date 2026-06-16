import { useState } from "react";
import { motion } from "framer-motion";
import { Coffee, Droplets, Cookie, Sparkles, AlertTriangle } from "lucide-react";
import MaterialCard from "@/components/MaterialCard/MaterialCard";
import LowStockAlert from "@/components/LowStockAlert/LowStockAlert";
import StatsCard from "@/components/StatsCard/StatsCard";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useUserStore } from "@/store/useUserStore";
import { useConsumptionStore } from "@/store/useConsumptionStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { categoryLabels, type MaterialCategory } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/date";

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

  const { materials, consumeMaterial } = useMaterialStore();
  const { currentUser } = useUserStore();
  const { addConsumption, getUserStats, getMonthlyStats } = useConsumptionStore();
  const { getUserBudgetInfo, checkCanConsume } = useBudgetStore();

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
      const material = materials.find((m) => m.id === materialId);
      showToast(`剩余额度不足！本次需 ${formatCurrency(budgetCheck.cost)}，剩余 ${formatCurrency(budgetCheck.remaining)}`, "error");
      return;
    }

    const success = consumeMaterial(materialId, quantity);
    if (success) {
      addConsumption(currentUser.id, materialId, quantity);
      const material = materials.find((m) => m.id === materialId);
      showToast(`取用成功！${material?.icon} ${material?.name} x${quantity}，消费 ${formatCurrency(budgetCheck.cost)}`, "success");
    } else {
      showToast("库存不足，请联系采购负责人补货", "error");
    }
  };

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

      <LowStockAlert />

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
