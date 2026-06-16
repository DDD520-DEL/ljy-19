import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import UserSelector from "@/components/UserSelector/UserSelector";
import { useUserStore } from "@/store/useUserStore";
import { useConsumptionStore } from "@/store/useConsumptionStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useRestockRequestStore } from "@/store/useRestockRequestStore";
import { formatCurrency, timeAgo } from "@/utils/date";
import { categoryLabels, type MaterialCategory, type RestockRequestStatus } from "@/types";
import { cn } from "@/lib/utils";

export default function Profile() {
  const navigate = useNavigate();
  const [showUserSelector, setShowUserSelector] = useState(false);
  const { currentUser } = useUserStore();
  const { getUserStats, getMonthlyConsumptions } = useConsumptionStore();
  const { materials } = useMaterialStore();
  const { getRequestsByApplicant } = useRestockRequestStore();

  const userStats = currentUser ? getUserStats(currentUser.id) : null;
  const monthlyConsumptions = currentUser
    ? getMonthlyConsumptions(currentUser.id).slice(0, 10)
    : [];
  const myRequests = currentUser ? getRequestsByApplicant(currentUser.id).slice(0, 10) : [];

  const requestStatusConfig: Record<
    RestockRequestStatus,
    { label: string; icon: typeof Clock; className: string }
  > = {
    pending: { label: "待审批", icon: Clock, className: "text-amber-600 bg-amber-50" },
    approved: { label: "已通过", icon: CheckCircle, className: "text-matcha-600 bg-matcha-50" },
    rejected: { label: "已拒绝", icon: XCircle, className: "text-danger-600 bg-danger-50" },
  };

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
      icon: FileText,
      label: "补货申请",
      value: `${myRequests.length} 条申请`,
      color: "text-purple-500",
      bg: "bg-purple-100",
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
      color: "text-sky-500",
      bg: "bg-sky-100",
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
        className="bg-white rounded-2xl shadow-soft overflow-hidden mb-6"
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

      {/* 我的补货申请 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl shadow-soft overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-coffee-100 flex items-center justify-between">
          <h3 className="font-bold text-coffee-800">我的补货申请</h3>
          <button
            onClick={() => navigate("/inventory")}
            className="text-sm text-coffee-500 hover:text-coffee-700 transition-colors"
          >
            去申请
          </button>
        </div>

        <div className="divide-y divide-coffee-50">
          {myRequests.map((request, index) => {
            const material = materials.find((m) => m.id === request.materialId);
            const statusConfig = requestStatusConfig[request.status];
            const StatusIcon = statusConfig.icon;
            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.03 }}
                className="px-6 py-4 hover:bg-coffee-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: (material?.color || "#f0f0f0") + "20" }}
                  >
                    {material?.icon || "📦"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-coffee-800 truncate">
                        {material?.name || "未知物料"}
                      </p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          statusConfig.className
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-coffee-400">
                      {timeAgo(request.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-matcha-600">+{request.quantity}</p>
                    <p className="text-xs text-coffee-400">
                      {formatCurrency(request.estimatedCost)}
                    </p>
                  </div>
                </div>
                {request.status === "rejected" && request.rejectReason && (
                  <div className="mt-3">
                    <div className="p-2.5 bg-danger-50 border border-danger-100 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-danger-600 mb-0.5">拒绝原因：</p>
                          <p className="text-sm text-danger-700">{request.rejectReason}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}

          {myRequests.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-coffee-50 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7 text-coffee-300" />
              </div>
              <p className="text-coffee-500 font-medium mb-1">暂无补货申请</p>
              <p className="text-coffee-400 text-sm">
                前往库存页面可以提交补货申请
              </p>
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
