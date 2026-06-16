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
} from "recharts";
import { Trophy, TrendingUp, Users, Coffee, DollarSign } from "lucide-react";
import StatsCard from "@/components/StatsCard/StatsCard";
import { useConsumptionStore } from "@/store/useConsumptionStore";
import { useUserStore } from "@/store/useUserStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { categoryLabels, categoryColors, type MaterialCategory } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/date";

export default function Stats() {
  const [activeTab, setActiveTab] = useState<"overview" | "ranking" | "category">("overview");

  const { getTopUsers, getMonthlyStats, getCategoryStats } = useConsumptionStore();
  const { users } = useUserStore();
  const { materials } = useMaterialStore();

  const monthlyStats = getMonthlyStats();
  const topUsers = getTopUsers(new Date(), 10);
  const categoryStats = getCategoryStats();

  const averagePerPerson = monthlyStats.activeUsers > 0
    ? monthlyStats.totalCost / monthlyStats.activeUsers
    : 0;

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

  const tabs = [
    { key: "overview" as const, label: "总览", icon: "📊" },
    { key: "ranking" as const, label: "排行榜", icon: "🏆" },
    { key: "category" as const, label: "品类分析", icon: "📈" },
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-coffee-800">消耗统计</h1>
        <p className="text-coffee-500 text-sm mt-1">查看本月消耗数据和费用分摊</p>
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
                本月咖啡基金总支出为 <span className="font-bold text-coffee-800">{formatCurrency(monthlyStats.totalCost)}</span>，
                共有 <span className="font-bold text-coffee-800">{monthlyStats.activeUsers}</span> 位同事参与饮用，
                人均分摊 <span className="font-bold text-coffee-800">{formatCurrency(averagePerPerson)}</span>。
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
                        animate={{ width: `${(userStat.total / topUsers[0].total) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                        className="h-full bg-coffee-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {topUsers.length === 0 && (
              <div className="px-6 py-12 text-center text-coffee-400">
                暂无统计数据
              </div>
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
                    formatter={(value) => <span className="text-sm text-coffee-600">{value}</span>}
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
                        {" "}件 ({percentage}%)
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
    </div>
  );
}
