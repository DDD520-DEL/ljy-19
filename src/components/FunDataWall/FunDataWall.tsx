import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import FunDataCard from "../FunDataCard/FunDataCard";
import { usePointsStore } from "@/store/usePointsStore";
import { type FunCardType, type FunData } from "@/types";
import { formatDate } from "@/utils/date";

export default function FunDataWall() {
  const { getFunData, refreshFunData, shouldRefreshFunData } = usePointsStore();
  const [funData, setFunData] = useState<FunData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = () => {
    const data = getFunData();
    setFunData(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (shouldRefreshFunData()) {
      handleRefresh();
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshFunData();
    loadData();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const cardTypes: FunCardType[] = ["topCoffeeDrinker", "totalCoffeeCups", "topMaterials", "perCapitaRanking"];

  if (!funData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-coffee-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-coffee-800">茶水间趣味数据墙</h2>
          <p className="text-sm text-coffee-500 mt-1">
            数据统计周期：{formatDate(funData.weekStart, "YYYY-MM-DD")} ~ {formatDate(funData.weekEnd, "YYYY-MM-DD")}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-coffee-100 text-coffee-700 rounded-xl text-sm font-medium hover:bg-coffee-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>刷新数据</span>
        </motion.button>
      </div>

      <div className="mb-4 flex items-center gap-2 text-xs text-coffee-400">
        <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span>每周一自动刷新 · 上次更新：{formatDate(funData.lastRefreshed, "YYYY-MM-DD HH:mm")}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cardTypes.map((type, index) => (
          <FunDataCard
            key={type}
            type={type}
            data={funData}
            delay={index * 0.1}
          />
        ))}
      </div>

      <div className="mt-8 bg-gradient-to-r from-coffee-50 to-amber-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">💡</div>
          <div>
            <h4 className="font-bold text-coffee-800 mb-2">关于趣味数据</h4>
            <p className="text-sm text-coffee-600 leading-relaxed">
              趣味数据墙展示茶水间的轻松有趣数据，包括咖啡爱好者排名、热门物资、团队战斗力等。
              数据每周一自动刷新，让大家在工作之余也能感受到茶水间的活力！
              所有数据仅供娱乐，不做绩效考核依据 😊
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
