import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { Trophy, TrendingUp, Users, Coffee, DollarSign, Download, Check, Leaf, Recycle, Droplets, Wind, Zap, TreePine } from "lucide-react";
import StatsCard from "@/components/StatsCard/StatsCard";
import Modal from "@/components/Modal/Modal";
import Toast from "@/components/Toast/Toast";
import { useConsumptionStore } from "@/store/useConsumptionStore";
import { useUserStore } from "@/store/useUserStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useRecyclingStore } from "@/store/useRecyclingStore";
import { categoryLabels, categoryColors, type MaterialCategory, recyclableTypeLabels, recyclableTypeColors, RECYCLABLE_CATEGORIES } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency, getStartOfMonth, getEndOfMonth } from "@/utils/date";
import { exportConsumptionsToCSV, exportRestocksToCSV } from "@/utils/csv";
import FunDataWall from "@/components/FunDataWall/FunDataWall";

type DateRangeType = "currentMonth" | "lastMonth" | "custom";
type ExportType = "consumption" | "restock";

export default function Stats() {
  const [activeTab, setActiveTab] = useState<"overview" | "ranking" | "category" | "environment" | "fun">("overview");
  const [showExportModal, setShowExportModal] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const [exportType, setExportType] = useState<ExportType>("consumption");
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>("currentMonth");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<MaterialCategory[]>([]);

  const { getTopUsers, getMonthlyStats, getCategoryStats, getConsumptionsByFilters } =
    useConsumptionStore();
  const { getRestocksByFilters } = useMaterialStore();
  const { users } = useUserStore();
  const { materials } = useMaterialStore();
  const {
    getMonthlyStats: getRecyclingMonthlyStats,
    getHistoricalMonthlyStats,
    getMonthlyEnvironmentalImpact,
    getTypeBreakdown: getRecyclingTypeBreakdown,
    calculateEnvironmentalImpact,
  } = useRecyclingStore();

  const monthlyStats = getMonthlyStats();
  const topUsers = getTopUsers(new Date(), 10);
  const categoryStats = getCategoryStats();

  const recyclingStats = getRecyclingMonthlyStats();
  const historicalRecycling = getHistoricalMonthlyStats(6);
  const envImpact = getMonthlyEnvironmentalImpact();
  const recyclingBreakdown = getRecyclingTypeBreakdown();

  const averagePerPerson =
    monthlyStats.activeUsers > 0 ? monthlyStats.totalCost / monthlyStats.activeUsers : 0;

  const pieData = useMemo(() => {
    return (Object.keys(categoryStats) as MaterialCategory[])
      .filter((cat) => categoryStats[cat] > 0)
      .map((cat) => ({
        name: categoryLabels[cat],
        value: categoryStats[cat],
        color: categoryColors[cat],
      }));
  }, [categoryStats]);

  const barData = useMemo(() => {
    const byMaterial = monthlyStats.byMaterial;
    return Object.entries(byMaterial)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => {
        const material = materials.find((m) => m.name === name);
        return {
          name,
          数量: value,
          color: material?.color || "#6F4E37",
        };
      });
  }, [monthlyStats.byMaterial, materials]);

  const recyclingTrendData = useMemo(() => {
    return historicalRecycling.map((stat) => ({
      month: `${stat.month + 1}月`,
      回收量: stat.totalWeight,
      节省塑料杯: Math.round(stat.totalWeight * 25),
    }));
  }, [historicalRecycling]);

  const recyclingPieData = useMemo(() => {
    return recyclingBreakdown.map((item) => ({
      name: recyclableTypeLabels[item.type],
      value: item.weight,
      color: recyclableTypeColors[item.type],
    }));
  }, [recyclingBreakdown]);

  const cumulativeEnvImpact = useMemo(() => {
    const totalWeight = historicalRecycling.reduce((sum, s) => sum + s.totalWeight, 0);
    return calculateEnvironmentalImpact(totalWeight);
  }, [historicalRecycling, calculateEnvironmentalImpact]);

  const tabs = [
    { key: "overview" as const, label: "总览", icon: "📊" },
    { key: "ranking" as const, label: "排行榜", icon: "🏆" },
    { key: "category" as const, label: "品类分析", icon: "📈" },
    { key: "environment" as const, label: "环保数据", icon: "🌿" },
    { key: "fun" as const, label: "趣味数据", icon: "🎉" },
  ];

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-white";
      case 3:
        return "bg-gradient-to-r from-orange-300 to-orange-400 text-white";
      default:
        return "bg-coffee-100 text-coffee-600";
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const getDateRange = (): { startDate?: Date; endDate?: Date } => {
    const now = new Date();
    switch (dateRangeType) {
      case "currentMonth":
        return { startDate: getStartOfMonth(now), endDate: getEndOfMonth(now) };
      case "lastMonth": {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { startDate: getStartOfMonth(lastMonth), endDate: getEndOfMonth(lastMonth) };
      }
      case "custom":
        return {
          startDate: customStartDate ? new Date(customStartDate) : undefined,
          endDate: customEndDate ? new Date(customEndDate) : undefined,
        };
      default:
        return {};
    }
  };

  const toggleUserId = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleCategory = (category: MaterialCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleExport = () => {
    const { startDate, endDate } = getDateRange();

    if (dateRangeType === "custom") {
      if (!customStartDate || !customEndDate) {
        showToast("请选择自定义时间范围", "error");
        return;
      }
      if (new Date(customStartDate) > new Date(customEndDate)) {
        showToast("开始日期不能晚于结束日期", "error");
        return;
      }
    }

    try {
      if (exportType === "consumption") {
        const consumptions = getConsumptionsByFilters({
          startDate,
          endDate,
          userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        });

        if (consumptions.length === 0) {
          showToast("筛选条件下没有消费记录", "error");
          return;
        }

        exportConsumptionsToCSV(consumptions, materials, users);
        showToast(`成功导出 ${consumptions.length} 条消费记录`);
      } else {
        const restocks = getRestocksByFilters({
          startDate,
          endDate,
          operatorIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        });

        if (restocks.length === 0) {
          showToast("筛选条件下没有补货记录", "error");
          return;
        }

        exportRestocksToCSV(restocks, materials, users);
        showToast(`成功导出 ${restocks.length} 条补货记录`);
      }

      setShowExportModal(false);
      resetExportFilters();
    } catch (error) {
      console.error("Export error:", error);
      showToast("导出失败，请重试", "error");
    }
  };

  const resetExportFilters = () => {
    setExportType("consumption");
    setDateRangeType("currentMonth");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedUserIds([]);
    setSelectedCategories([]);
  };

  const allCategories: MaterialCategory[] = ["coffee", "tea", "dairy", "snack"];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-800">消耗统计</h1>
          <p className="text-coffee-500 text-sm mt-1">查看本月消耗数据和费用分摊</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-coffee-700 text-white rounded-xl text-sm font-medium hover:bg-coffee-800 transition-colors shadow-soft"
        >
          <Download className="w-4 h-4" />
          <span>导出数据</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="总杯数"
          value={monthlyStats.totalCups}
          subtitle="本月消耗总量"
          icon={<Coffee className="w-5 h-5" />}
          color="coffee"
        />
        <StatsCard
          title="总费用"
          value={formatCurrency(monthlyStats.totalCost)}
          subtitle="本月物料成本"
          icon={<DollarSign className="w-5 h-5" />}
          color="matcha"
        />
        <StatsCard
          title="参与人数"
          value={monthlyStats.activeUsers}
          subtitle="本月活跃用户"
          icon={<Users className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="人均费用"
          value={formatCurrency(averagePerPerson)}
          subtitle="AA分摊金额"
          icon={<TrendingUp className="w-5 h-5" />}
          color="coffee"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-2 mb-6 inline-flex">
        {tabs.map((tab) => (
          <motion.button
            key={tab.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              activeTab === tab.key
                ? "bg-coffee-700 text-white shadow-soft"
                : "text-coffee-600 hover:bg-coffee-50"
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-bold text-coffee-800 mb-4">各物料消耗排行</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D7C3" horizontal={false} />
                  <XAxis type="number" stroke="#A67C52" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#A67C52"
                    fontSize={12}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E8D7C3",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px -2px rgba(111, 78, 55, 0.15)",
                    }}
                    labelStyle={{ color: "#5A3F2D", fontWeight: 600 }}
                  />
                  <Bar dataKey="数量" radius={[0, 8, 8, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-bold text-coffee-800 mb-4">费用分摊说明</h3>
            <div className="bg-cream-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-coffee-600 leading-relaxed">
                本月咖啡基金总支出为{" "}
                <span className="font-bold text-coffee-800">{formatCurrency(monthlyStats.totalCost)}</span>
                ，共有{" "}
                <span className="font-bold text-coffee-800">{monthlyStats.activeUsers}</span>{" "}
                位同事参与饮用，人均分摊{" "}
                <span className="font-bold text-coffee-800">{formatCurrency(averagePerPerson)}</span>。
              </p>
            </div>
            <div className="text-sm text-coffee-500">
              <p>💡 提示：费用按实际参与人数均摊，数据仅供参考。</p>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "ranking" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-coffee-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-coffee-800">本月消耗排行榜</h3>
          </div>

          <div className="divide-y divide-coffee-50">
            {topUsers.map((userStat, index) => {
              const user = users.find((u) => u.id === userStat.userId);
              const rank = index + 1;

              return (
                <motion.div
                  key={userStat.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-coffee-50/50 transition-colors"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                      getRankStyle(rank)
                    )}
                  >
                    {rank}
                  </div>

                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-coffee-800">{user?.name}</p>
                    <p className="text-sm text-coffee-400">
                      {userStat.total} 杯 · {formatCurrency(userStat.cost)}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="h-2 w-24 bg-coffee-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(userStat.total / topUsers[0].total) * 100}%`,
                        }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                        className="h-full bg-coffee-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {topUsers.length === 0 && (
              <div className="px-6 py-12 text-center text-coffee-400">暂无统计数据</div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "category" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-bold text-coffee-800 mb-4">品类占比</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E8D7C3",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px -2px rgba(111, 78, 55, 0.15)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm text-coffee-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-bold text-coffee-800 mb-4">分类详情</h3>
            <div className="space-y-4">
              {(Object.keys(categoryStats) as MaterialCategory[]).map((cat) => {
                const total = Object.values(categoryStats).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((categoryStats[cat] / total) * 100) : 0;

                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoryColors[cat] }}
                        />
                        <span className="text-sm font-medium text-coffee-700">
                          {categoryLabels[cat]}
                        </span>
                      </div>
                      <div className="text-sm text-coffee-500">
                        <span className="font-bold text-coffee-700">{categoryStats[cat]}</span>
                        {"  "}件 ({percentage}%)
                      </div>
                    </div>
                    <div className="h-2 bg-coffee-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: categoryColors[cat] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "environment" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="本月回收总量"
              value={`${recyclingStats.totalWeight} kg`}
              subtitle={`${recyclingStats.recordsCount} 次记录`}
              icon={<Recycle className="w-5 h-5" />}
              color="matcha"
            />
            <StatsCard
              title="累计减少塑料杯"
              value={`${cumulativeEnvImpact.plasticCupsSaved} 个`}
              subtitle="近 6 个月累计"
              icon={<Leaf className="w-5 h-5" />}
              color="coffee"
            />
            <StatsCard
              title="累计保护树木"
              value={`${cumulativeEnvImpact.treesSaved} 棵`}
              subtitle="近 6 个月累计"
              icon={<TreePine className="w-5 h-5" />}
              color="matcha"
            />
            <StatsCard
              title="累计节约水资源"
              value={`${cumulativeEnvImpact.waterSavedLiters} L`}
              subtitle="近 6 个月累计"
              icon={<Droplets className="w-5 h-5" />}
              color="amber"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-bold text-coffee-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-matcha-500" />
              回收量历史趋势（近 6 个月）
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recyclingTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8D7C3" />
                  <XAxis dataKey="month" stroke="#A67C52" fontSize={12} />
                  <YAxis
                    yAxisId="left"
                    stroke="#A67C52"
                    fontSize={12}
                    label={{ value: "kg", angle: -90, position: "insideLeft", style: { fill: "#A67C52" } }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#88B04B"
                    fontSize={12}
                    label={{ value: "个", angle: 90, position: "insideRight", style: { fill: "#88B04B" } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E8D7C3",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px -2px rgba(111, 78, 55, 0.15)",
                    }}
                    labelStyle={{ color: "#5A3F2D", fontWeight: 600 }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm text-coffee-600">{value}</span>
                    )}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="回收量"
                    stroke="#6F4E37"
                    strokeWidth={3}
                    dot={{ fill: "#6F4E37", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="节省塑料杯"
                    stroke="#88B04B"
                    strokeWidth={3}
                    dot={{ fill: "#88B04B", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-bold text-coffee-800 mb-4">本月回收分类占比</h3>
              {recyclingPieData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-coffee-400">
                  暂无回收数据
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={recyclingPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {recyclingPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E8D7C3",
                          borderRadius: "12px",
                          boxShadow: "0 4px 20px -2px rgba(111, 78, 55, 0.15)",
                        }}
                        formatter={(value: number) => [`${value} kg`, "重量"]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-sm text-coffee-600">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-bold text-coffee-800 mb-4">累计环保贡献明细</h3>
              <div className="space-y-3">
                {[
                  { label: "减少一次性塑料杯", value: cumulativeEnvImpact.plasticCupsSaved, unit: "个", icon: <Recycle className="w-4 h-4" />, color: "bg-coffee-100 text-coffee-600" },
                  { label: "保护树木", value: cumulativeEnvImpact.treesSaved, unit: "棵", icon: <TreePine className="w-4 h-4" />, color: "bg-matcha-100 text-matcha-600" },
                  { label: "节约清洁用水", value: cumulativeEnvImpact.waterSavedLiters, unit: "L", icon: <Droplets className="w-4 h-4" />, color: "bg-blue-100 text-blue-600" },
                  { label: "减少 CO₂ 排放", value: cumulativeEnvImpact.co2ReducedKg, unit: "kg", icon: <Wind className="w-4 h-4" />, color: "bg-amber-100 text-amber-600" },
                  { label: "节约能源消耗", value: cumulativeEnvImpact.energySavedKwh, unit: "度", icon: <Zap className="w-4 h-4" />, color: "bg-purple-100 text-purple-600" },
                ].map((item, index) => {
                  const total = Math.max(
                    cumulativeEnvImpact.plasticCupsSaved,
                    cumulativeEnvImpact.treesSaved * 100,
                    cumulativeEnvImpact.waterSavedLiters,
                    cumulativeEnvImpact.co2ReducedKg * 10,
                    cumulativeEnvImpact.energySavedKwh * 10,
                    1
                  );
                  const normalizedValue =
                    item.label === "保护树木"
                      ? (item.value * 100) / total
                      : item.label === "减少 CO₂ 排放"
                      ? (item.value * 10) / total
                      : item.label === "节约能源消耗"
                      ? (item.value * 10) / total
                      : item.value / total;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${item.color}`}>
                            {item.icon}
                          </div>
                          <span className="text-sm font-medium text-coffee-700">{item.label}</span>
                        </div>
                        <span className="text-sm text-coffee-600">
                          <span className="font-bold text-coffee-800">{item.value}</span> {item.unit}
                        </span>
                      </div>
                      <div className="h-2 bg-coffee-100 rounded-full overflow-hidden ml-8">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(normalizedValue * 100, 100)}%` }}
                          transition={{ duration: 0.6, delay: index * 0.05 }}
                          className="h-full bg-gradient-to-r from-matcha-400 to-matcha-600 rounded-full"
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-bold text-coffee-800 mb-4">月度回收明细</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-coffee-100">
                    <th className="text-left py-3 px-4 font-medium text-coffee-500">月份</th>
                    <th className="text-left py-3 px-4 font-medium text-coffee-500">记录次数</th>
                    <th className="text-right py-3 px-4 font-medium text-coffee-500">回收总量</th>
                    <th className="text-right py-3 px-4 font-medium text-coffee-500">减少塑料杯</th>
                    <th className="text-right py-3 px-4 font-medium text-coffee-500">保护树木</th>
                  </tr>
                </thead>
                <tbody>
                  {historicalRecycling.map((stat, index) => {
                    const impact = calculateEnvironmentalImpact(stat.totalWeight);
                    return (
                      <motion.tr
                        key={`${stat.year}-${stat.month}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-b border-coffee-50 hover:bg-coffee-50/50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-coffee-700">{stat.year}年{stat.month + 1}月</span>
                        </td>
                        <td className="py-3 px-4 text-coffee-600">{stat.recordsCount} 次</td>
                        <td className="py-3 px-4 text-right font-bold text-coffee-800">{stat.totalWeight} kg</td>
                        <td className="py-3 px-4 text-right text-matcha-600 font-medium">{impact.plasticCupsSaved} 个</td>
                        <td className="py-3 px-4 text-right text-coffee-600">{impact.treesSaved} 棵</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "fun" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <FunDataWall />
        </motion.div>
      )}

      <Modal
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          resetExportFilters();
        }}
        title="导出数据"
        className="max-w-lg"
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">导出类型</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportType("consumption")}
                className={cn(
                  "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                  exportType === "consumption"
                    ? "border-coffee-600 bg-coffee-50 text-coffee-800"
                    : "border-coffee-100 text-coffee-500 hover:border-coffee-200"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <Coffee className="w-4 h-4" />
                  <span>消费记录</span>
                </div>
              </button>
              <button
                onClick={() => setExportType("restock")}
                className={cn(
                  "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                  exportType === "restock"
                    ? "border-coffee-600 bg-coffee-50 text-coffee-800"
                    : "border-coffee-100 text-coffee-500 hover:border-coffee-200"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>补货记录</span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">时间范围</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { key: "currentMonth" as const, label: "本月" },
                { key: "lastMonth" as const, label: "上月" },
                { key: "custom" as const, label: "自定义" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDateRangeType(opt.key)}
                  className={cn(
                    "py-2 rounded-lg text-sm font-medium transition-all",
                    dateRangeType === opt.key
                      ? "bg-coffee-600 text-white"
                      : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {dateRangeType === "custom" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-coffee-500 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-coffee-200 text-sm text-coffee-700 focus:outline-none focus:border-coffee-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-coffee-500 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-coffee-200 text-sm text-coffee-700 focus:outline-none focus:border-coffee-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">
              筛选用户 <span className="text-coffee-400 font-normal">(不选则全部)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => toggleUserId(user.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
                    selectedUserIds.includes(user.id)
                      ? "bg-coffee-600 text-white"
                      : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
                  )}
                >
                  <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                  <span>{user.name}</span>
                  {selectedUserIds.includes(user.id) && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">
              筛选类别 <span className="text-coffee-400 font-normal">(不选则全部)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all",
                    selectedCategories.includes(cat)
                      ? "text-white"
                      : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
                  )}
                  style={
                    selectedCategories.includes(cat)
                      ? { backgroundColor: categoryColors[cat] }
                      : undefined
                  }
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoryColors[cat] }}
                  />
                  <span>{categoryLabels[cat]}</span>
                  {selectedCategories.includes(cat) && (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-coffee-100 flex gap-3">
            <button
              onClick={() => {
                setShowExportModal(false);
                resetExportFilters();
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-coffee-600 bg-coffee-50 hover:bg-coffee-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleExport}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-coffee-700 hover:bg-coffee-800 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出 CSV
            </button>
          </div>
        </div>
      </Modal>

      <Toast
        isVisible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
