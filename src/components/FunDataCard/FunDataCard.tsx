import { motion } from "framer-motion";
import { Crown, TrendingUp } from "lucide-react";
import {
  FUN_CARD_CONFIGS,
  type FunCardType,
  type FunData,
  type TopMaterialItem,
  type PerCapitaRankingItem,
} from "@/types";
import { formatCurrency } from "@/utils/date";
import { cn } from "@/lib/utils";

interface FunDataCardProps {
  type: FunCardType;
  data: FunData;
  delay?: number;
}

export default function FunDataCard({ type, data, delay = 0 }: FunDataCardProps) {
  const config = FUN_CARD_CONFIGS[type];

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

  const renderContent = () => {
    switch (type) {
      case "topCoffeeDrinker":
        return data.topCoffeeDrinker ? (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <img
                src={data.topCoffeeDrinker.user.avatar}
                alt={data.topCoffeeDrinker.user.name}
                className="w-20 h-20 rounded-full border-4 border-yellow-400 shadow-lg"
              />
              <Crown className="w-8 h-8 text-yellow-500 absolute -top-2 -right-2" />
            </div>
            <h3 className="text-xl font-bold text-coffee-800 mb-1">
              {data.topCoffeeDrinker.user.name}
            </h3>
            <div className="flex items-center gap-4 mt-4">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: config.color }}>
                  {data.topCoffeeDrinker.coffeeCups}
                </div>
                <div className="text-xs text-coffee-500">杯咖啡</div>
              </div>
              <div className="w-px h-12 bg-coffee-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-coffee-700">
                  {formatCurrency(data.topCoffeeDrinker.totalCost)}
                </div>
                <div className="text-xs text-coffee-500">累计消费</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-coffee-400 py-8">
            本月还没有咖啡消费记录
          </div>
        );

      case "topMaterials":
        return (
          <div className="space-y-3">
            {data.topMaterials.map((item: TopMaterialItem, index: number) => (
              <motion.div
                key={item.materialId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + index * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-coffee-50 transition-colors"
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                    getRankStyle(index + 1)
                  )}
                >
                  {index + 1}
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: item.materialColor + "20" }}
                >
                  {item.materialIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-coffee-800 truncate">
                    {item.materialName}
                  </div>
                  <div className="text-xs text-coffee-500">
                    {formatCurrency(item.totalCost)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-coffee-700">
                    {item.quantity}
                  </div>
                  <div className="text-xs text-coffee-400">件</div>
                </div>
              </motion.div>
            ))}
            {data.topMaterials.length === 0 && (
              <div className="text-center text-coffee-400 py-4">
                暂无消耗数据
              </div>
            )}
          </div>
        );

      case "totalCoffeeCups":
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="text-6xl mb-4">☕</div>
            <div className="text-5xl font-bold mb-2" style={{ color: config.color }}>
              {data.totalCoffeeCups}
            </div>
            <div className="text-coffee-600 font-medium">杯咖啡被消灭</div>
            <div className="mt-4 flex items-center gap-2 text-sm text-coffee-500">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>相当于绕办公室 {Math.round(data.totalCoffeeCups / 10)} 圈</span>
            </div>
            <div className="mt-2 text-xs text-coffee-400">
              按每杯 10 米估算
            </div>
          </div>
        );

      case "perCapitaRanking":
        return (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {data.perCapitaRanking.map((item: PerCapitaRankingItem, index: number) => (
              <motion.div
                key={item.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + index * 0.08 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-coffee-50 transition-colors"
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    getRankStyle(index + 1)
                  )}
                >
                  {index + 1}
                </div>
                <img
                  src={item.user.avatar}
                  alt={item.user.name}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-coffee-800 truncate">
                    {item.user.name}
                  </div>
                  <div className="text-xs text-coffee-500">
                    {item.consumptionCount} 次消费 · 均价 {formatCurrency(item.averagePerConsumption)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-coffee-700">
                    {formatCurrency(item.totalCost)}
                  </div>
                </div>
              </motion.div>
            ))}
            {data.perCapitaRanking.length === 0 && (
              <div className="text-center text-coffee-400 py-4">
                暂无消费数据
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ backgroundColor: config.color + "10" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: config.color + "20" }}
          >
            {config.icon}
          </div>
          <div>
            <h3 className="font-bold text-coffee-800">{config.title}</h3>
            <p className="text-xs text-coffee-500">{config.description}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{renderContent()}</div>
    </motion.div>
  );
}
