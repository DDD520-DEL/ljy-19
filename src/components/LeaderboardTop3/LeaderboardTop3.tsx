import { useMemo } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePointsStore } from "@/store/usePointsStore";
import { cn } from "@/lib/utils";

const rankStyles = [
  {
    gradient: "from-amber-400 to-yellow-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: Crown,
    iconColor: "text-amber-500",
    size: "w-16 h-16",
    order: 1,
  },
  {
    gradient: "from-slate-300 to-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    icon: Medal,
    iconColor: "text-slate-400",
    size: "w-14 h-14",
    order: 0,
  },
  {
    gradient: "from-orange-400 to-amber-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    icon: Medal,
    iconColor: "text-orange-500",
    size: "w-12 h-12",
    order: 2,
  },
];

export default function LeaderboardTop3() {
  const navigate = useNavigate();
  const getTopThree = usePointsStore((state) => state.getTopThree);
  const pointsRecords = usePointsStore((state) => state.pointsRecords);
  const topThree = useMemo(() => getTopThree(), [getTopThree, pointsRecords]);

  if (topThree.length === 0) {
    return null;
  }

  const now = new Date();
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-cream-50 to-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 shadow-soft"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 rounded-xl">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-coffee-800">本月积分排行</h3>
            <p className="text-xs text-coffee-500">{monthLabel} · 1元=1积分</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/leaderboard")}
          className="flex items-center gap-1 px-3 py-1.5 bg-coffee-100 hover:bg-coffee-200 text-coffee-700 rounded-lg text-sm font-medium transition-colors"
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-end justify-center gap-4">
        {[1, 0, 2].map((index) => {
          const entry = topThree[index];
          const style = rankStyles[index];
          if (!entry) return null;

          const RankIcon = style.icon;

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex flex-col items-center",
                style.order === 0 ? "order-first" : style.order === 2 ? "order-last" : "order-1"
              )}
            >
              <div className="relative mb-2">
                <div
                  className={cn(
                    style.size,
                    "rounded-full border-4 overflow-hidden",
                    style.border
                  )}
                >
                  <img
                    src={entry.user.avatar}
                    alt={entry.user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={cn(
                    "absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg",
                    `bg-gradient-to-br ${style.gradient}`
                  )}
                >
                  <RankIcon className="w-4 h-4 text-white" />
                </div>
                {entry.hasTitle && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                    👑 本月饮者
                  </div>
                )}
              </div>

              <p className="font-semibold text-coffee-800 text-sm mb-1">
                {entry.user.name}
              </p>
              <p className={cn("text-lg font-bold", style.text)}>
                {entry.totalPoints}
                <span className="text-xs font-normal ml-1">积分</span>
              </p>
              <p className="text-xs text-coffee-400 mt-0.5">
                ¥{entry.totalAmount.toFixed(2)}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
