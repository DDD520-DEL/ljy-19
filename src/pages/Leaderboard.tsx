import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Crown,
  Medal,
  ChevronLeft,
  ChevronRight,
  User,
  Coins,
  TrendingUp,
  Award,
} from "lucide-react";
import { usePointsStore } from "@/store/usePointsStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        gradient: "from-amber-400 to-yellow-500",
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-700",
        icon: Crown,
        iconColor: "text-amber-500",
      };
    case 2:
      return {
        gradient: "from-slate-300 to-slate-400",
        bg: "bg-slate-50",
        border: "border-slate-200",
        text: "text-slate-700",
        icon: Medal,
        iconColor: "text-slate-400",
      };
    case 3:
      return {
        gradient: "from-orange-400 to-amber-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-700",
        icon: Medal,
        iconColor: "text-orange-500",
      };
    default:
      return {
        gradient: "from-coffee-300 to-coffee-400",
        bg: "bg-coffee-50",
        border: "border-coffee-100",
        text: "text-coffee-600",
        icon: Award,
        iconColor: "text-coffee-400",
      };
  }
};

export default function Leaderboard() {
  const { currentUser } = useUserStore();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);

  const getMonthlyLeaderboard = usePointsStore((state) => state.getMonthlyLeaderboard);
  const getUserMonthlyPoints = usePointsStore((state) => state.getUserMonthlyPoints);
  const getDrinkerTitles = usePointsStore((state) => state.getDrinkerTitles);
  const pointsRecords = usePointsStore((state) => state.pointsRecords);
  const drinkerTitles = usePointsStore((state) => state.drinkerTitles);

  const currentDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - selectedMonthOffset, 1);
  }, [selectedMonthOffset]);

  const leaderboard = useMemo(() => {
    return getMonthlyLeaderboard(currentDate);
  }, [getMonthlyLeaderboard, currentDate, pointsRecords]);

  const myPoints = useMemo(() => {
    if (!currentUser) return null;
    return getUserMonthlyPoints(currentUser.id, currentDate);
  }, [currentUser, getUserMonthlyPoints, currentDate, pointsRecords]);

  const myRank = useMemo(() => {
    if (!currentUser) return null;
    return leaderboard.findIndex((e) => e.userId === currentUser.id) + 1;
  }, [currentUser, leaderboard]);

  const myTitles = useMemo(() => {
    if (!currentUser) return [];
    return getDrinkerTitles(currentUser.id);
  }, [currentUser, getDrinkerTitles, drinkerTitles]);

  const monthLabel = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
  const isCurrentMonth = selectedMonthOffset === 0;

  const canGoPrev = selectedMonthOffset < 11;
  const canGoNext = selectedMonthOffset > 0;

  const handlePrevMonth = () => {
    if (canGoPrev) {
      setSelectedMonthOffset((prev) => prev + 1);
    }
  };

  const handleNextMonth = () => {
    if (canGoNext) {
      setSelectedMonthOffset((prev) => prev - 1);
    }
  };

  const renderPodium = (entries: LeaderboardEntry[]) => {
    const podiumOrder = [1, 0, 2];
    return (
      <div className="flex items-end justify-center gap-4 mb-8">
        {podiumOrder.map((index) => {
          const entry = entries[index];
          if (!entry) return null;

          const style = getRankStyle(index + 1);
          const RankIcon = style.icon;
          const heights = ["h-24", "h-32", "h-16"];

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="relative mb-3">
                <div
                  className={cn(
                    "w-20 h-20 rounded-full border-4 overflow-hidden",
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
                    "absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg",
                    `bg-gradient-to-br ${style.gradient}`
                  )}
                >
                  <RankIcon className="w-4 h-4 text-white" />
                </div>
                {entry.hasTitle && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full whitespace-nowrap shadow-md">
                    👑 本月饮者
                  </div>
                )}
              </div>

              <p className="font-bold text-coffee-800 mb-1">{entry.user.name}</p>
              <p className={cn("text-xl font-bold", style.text)}>
                {entry.totalPoints}
                <span className="text-sm font-normal ml-1">积分</span>
              </p>
              <p className="text-xs text-coffee-400 mb-2">
                ¥{entry.totalAmount.toFixed(2)}
              </p>

              <div
                className={cn(
                  "w-20 rounded-t-xl flex items-end justify-center pt-3",
                  `bg-gradient-to-t ${style.gradient}`,
                  heights[index]
                )}
              >
                <span className="text-2xl font-bold text-white mb-2">
                  {index + 1}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-coffee-800">积分排行榜</h1>
        <p className="text-coffee-500 text-sm mt-1">
          每月累计消费积分，前三名获得"本月饮者"称号
        </p>
      </div>

      {/* 月份选择器 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft p-4 mb-6 flex items-center justify-between"
      >
        <button
          onClick={handlePrevMonth}
          disabled={!canGoPrev}
          className={cn(
            "p-2 rounded-xl transition-colors",
            canGoPrev
              ? "bg-coffee-100 hover:bg-coffee-200 text-coffee-700"
              : "bg-coffee-50 text-coffee-300 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-lg font-bold text-coffee-800">{monthLabel}</p>
          <p className="text-xs text-coffee-500">
            {isCurrentMonth ? "本月排行实时更新" : "历史排行数据"}
          </p>
        </div>

        <button
          onClick={handleNextMonth}
          disabled={!canGoNext}
          className={cn(
            "p-2 rounded-xl transition-colors",
            canGoNext
              ? "bg-coffee-100 hover:bg-coffee-200 text-coffee-700"
              : "bg-coffee-50 text-coffee-300 cursor-not-allowed"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* 我的排名卡片 */}
      {currentUser && myPoints && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-coffee-600 to-coffee-800 rounded-2xl p-5 mb-6 text-white shadow-medium"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-white/20 overflow-hidden">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {myRank || "-"}
              </div>
            </div>

            <div className="flex-1">
              <p className="font-bold text-lg">{currentUser.name}</p>
              <p className="text-white/70 text-sm">我的排名</p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 justify-end mb-1">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="text-2xl font-bold">{myPoints.totalPoints}</span>
              </div>
              <p className="text-white/70 text-sm">
                消费 ¥{myPoints.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {myTitles.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-sm text-white/80 mb-2 flex items-center gap-1">
                <Award className="w-4 h-4" />
                获得称号
              </p>
              <div className="flex flex-wrap gap-2">
                {myTitles.map((title, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-xs font-medium text-amber-200"
                  >
                    👑 {title.year}年{title.month + 1}月 · 第{title.rank}名
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 前三名领奖台 */}
      {leaderboard.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-cream-50 to-amber-50 border border-amber-100 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-coffee-800">前三名</h3>
          </div>
          {renderPodium(leaderboard.slice(0, 3))}
        </motion.div>
      )}

      {/* 完整排行榜列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-soft overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-coffee-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-coffee-500" />
            <h3 className="font-bold text-coffee-800">完整排行</h3>
          </div>
          <span className="text-sm text-coffee-500">
            共 {leaderboard.length} 人参与
          </span>
        </div>

        <div className="divide-y divide-coffee-50">
          {leaderboard.map((entry, index) => {
            const style = getRankStyle(entry.rank);
            const RankIcon = style.icon;
            const isCurrentUser = currentUser?.id === entry.userId;

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 * index }}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 transition-colors",
                  isCurrentUser ? "bg-amber-50/50" : "hover:bg-coffee-50/50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                    entry.rank <= 3
                      ? `bg-gradient-to-br ${style.gradient} text-white`
                      : "bg-coffee-100 text-coffee-500"
                  )}
                >
                  {entry.rank <= 3 ? (
                    <RankIcon className="w-5 h-5" />
                  ) : (
                    entry.rank
                  )}
                </div>

                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-coffee-100">
                    {entry.user.avatar ? (
                      <img
                        src={entry.user.avatar}
                        alt={entry.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-coffee-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-coffee-400" />
                      </div>
                    )}
                  </div>
                  {entry.hasTitle && (
                    <div className="absolute -top-1 -right-1 text-sm">
                      👑
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "font-semibold truncate",
                        isCurrentUser ? "text-amber-700" : "text-coffee-800"
                      )}
                    >
                      {entry.user.name}
                    </p>
                    {isCurrentUser && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                        我
                      </span>
                    )}
                    {entry.hasTitle && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs font-medium rounded-full">
                        本月饮者
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-coffee-500">
                    消费 ¥{entry.totalAmount.toFixed(2)}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={cn(
                      "text-xl font-bold",
                      entry.rank <= 3 ? style.text : "text-coffee-700"
                    )}
                  >
                    {entry.totalPoints}
                  </p>
                  <p className="text-xs text-coffee-400">积分</p>
                </div>
              </motion.div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-coffee-100 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-coffee-300" />
              </div>
              <p className="text-coffee-500 font-medium mb-1">暂无排行数据</p>
              <p className="text-coffee-400 text-sm">
                {isCurrentMonth
                  ? "本月还没有消费记录，快去取用饮品获取积分吧！"
                  : "该月份暂无消费记录"}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 规则说明 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6 bg-cream-50 border border-cream-200 rounded-2xl p-5"
      >
        <h4 className="font-semibold text-coffee-800 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4" />
          积分规则
        </h4>
        <ul className="space-y-2 text-sm text-coffee-600">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>每消费 1 元可获得 1 积分，积分实时累计</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>每月 1 日 0 点积分清零，重新开始累计</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>
              每月最后一天 23:59:59 结算排行榜，前三名自动获得"本月饮者"称号
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>称号徽章会永久保存在个人中心，可随时查看</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
