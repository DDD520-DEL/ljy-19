import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Settings,
  History,
  Coffee,
  DollarSign,
  Calendar,
  ChevronRight,
  LogOut,
} from "lucide-react";
import UserSelector from "@/components/UserSelector/UserSelector";
import { useUserStore } from "@/store/useUserStore";
import { useConsumptionStore } from "@/store/useConsumptionStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { formatCurrency, timeAgo } from "@/utils/date";
import { categoryLabels, type MaterialCategory } from "@/types";
import { cn } from "@/lib/utils";

export default function Profile() {
  const [showUserSelector, setShowUserSelector] = useState(false);
  const { currentUser } = useUserStore();
  const { getUserStats, getMonthlyConsumptions } = useConsumptionStore();
  const { materials } = useMaterialStore();

  const userStats = currentUser ? getUserStats(currentUser.id) : null;
  const monthlyConsumptions = currentUser
    ? getMonthlyConsumptions(currentUser.id).slice(0, 10)
    : [];

  const categoryIcons: Record<MaterialCategory, string> = {
    coffee: "☕",
    tea: "🍵",
    dairy: "🥛",
    snack: "🍪",
  };

  const menuItems = [
    {
      icon: History,
      label: "取用记录",
      value: `${userStats?.totalConsumptions || 0} 条记录`,
      color: "text-coffee-500",
      bg: "bg-coffee-100",
    },
    {
      icon: Coffee,
      label: "本月消耗",
      value: `${userStats?.totalConsumptions || 0} 杯`,
      color: "text-amber-500",
      bg: "bg-amber-100",
    },
    {
      icon: DollarSign,
      label: "本月费用",
      value: formatCurrency(userStats?.totalCost || 0),
      color: "text-matcha-500",
      bg: "bg-matcha-100",
    },
    {
      icon: Calendar,
      label: "加入日期",
      value: currentUser?.joinDate || "-",
      color: "text-purple-500",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div>
      <UserSelector
        isOpen={showUserSelector}
        onClose={() => setShowUserSelector(false)}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-coffee-800">个人中心</h1>
        <p className="text-coffee-500 text-sm mt-1">查看你的消耗数据和设置</p>
      </div>

      {/* 用户信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-coffee-600 to-coffee-800 rounded-2xl p-6 mb-6 text-white shadow-medium"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-full border-4 border-white/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold">{currentUser?.name}</h2>
            <p className="text-white/70 text-sm">
              {currentUser?.role === "admin" ? "管理员" : "普通成员"}
            </p>
          </div>

          <button
            onClick={() => setShowUserSelector(true)}
            className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* 快速统计 */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
          <div className="text-center">
            <p className="text-2xl font-bold">{userStats?.totalConsumptions || 0}</p>
            <p className="text-xs text-white/70 mt-1">本月杯数</p>
          </div>
          <div className="text-center border-x border-white/20">
            <p className="text-2xl font-bold">{formatCurrency(userStats?.totalCost || 0)}</p>
            <p className="text-xs text-white/70 mt-1">本月费用</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {Object.values(userStats?.byCategory || {}).filter((v) => v > 0).length}
            </p>
            <p className="text-xs text-white/70 mt-1">品类数</p>
          </div>
        </div>
      </motion.div>

      {/* 菜单列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6"
      >
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              className="flex items-center gap-4 px-6 py-4 border-b border-coffee-50 last:border-b-0 hover:bg-coffee-50/50 transition-colors cursor-pointer"
            >
              <div className={cn("p-2.5 rounded-xl", item.bg)}>
                <Icon className={cn("w-5 h-5", item.color)} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-coffee-800">{item.label}</p>
                <p className="text-sm text-coffee-400">{item.value}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-coffee-300" />
            </motion.div>
          );
        })}
      </motion.div>

      {/* 分类统计 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-soft p-6 mb-6"
      >
        <h3 className="font-bold text-coffee-800 mb-4">分类消耗</h3>
        <div className="space-y-3">
          {(Object.keys(userStats?.byCategory || {}) as MaterialCategory[]).map((cat, index) => {
            const count = userStats?.byCategory[cat] || 0;
            const total = userStats?.totalConsumptions || 1;
            const percentage = Math.round((count / total) * 100);

            return (
              <motion.div
                key={cat}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[cat]}</span>
                    <span className="text-sm font-medium text-coffee-700">
                      {categoryLabels[cat]}
                    </span>
                  </div>
                  <span className="text-sm text-coffee-500">
                    {count} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-coffee-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                    className="h-full bg-coffee-500 rounded-full"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* 最近取用记录 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-soft overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-coffee-100 flex items-center justify-between">
          <h3 className="font-bold text-coffee-800">最近取用</h3>
          <button className="text-sm text-coffee-500 hover:text-coffee-700 transition-colors">
            查看全部
          </button>
        </div>

        <div className="divide-y divide-coffee-50">
          {monthlyConsumptions.map((record, index) => {
            const material = materials.find((m) => m.id === record.materialId);
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.03 }}
                className="px-6 py-3 flex items-center gap-3 hover:bg-coffee-50/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: (material?.color || "#f0f0f0") + "20" }}
                >
                  {material?.icon || "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-coffee-800 truncate">
                    {material?.name || "未知物料"}
                  </p>
                  <p className="text-xs text-coffee-400">
                    {timeAgo(record.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-coffee-700">x{record.quantity}</p>
                  <p className="text-xs text-coffee-400">
                    {formatCurrency((material?.unitPrice || 0) * record.quantity)}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {monthlyConsumptions.length === 0 && (
            <div className="px-6 py-12 text-center text-coffee-400">
              暂无取用记录
            </div>
          )}
        </div>
      </motion.div>

      {/* 切换用户按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <button
          onClick={() => setShowUserSelector(true)}
          className="w-full flex items-center justify-center gap-2 py-4 bg-white rounded-2xl shadow-soft text-coffee-600 hover:bg-coffee-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">切换用户</span>
        </button>
      </motion.div>
    </div>
  );
}
