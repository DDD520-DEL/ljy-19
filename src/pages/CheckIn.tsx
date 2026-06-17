import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Trophy,
  CalendarCheck,
  Sparkles,
  Medal,
  Crown,
  TrendingUp,
  Award,
  Star,
} from "lucide-react";
import CheckInCalendar from "@/components/CheckInCalendar/CheckInCalendar";
import StatsCard from "@/components/StatsCard/StatsCard";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useUserStore } from "@/store/useUserStore";
import { useCheckInStore } from "@/store/useCheckInStore";
import { badgeConfigs, STREAK_FOR_DRINK_MASTER } from "@/types";
import type { Badge } from "@/types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date";

export default function CheckIn() {
  const { currentUser, users } = useUserStore();
  const {
    getUserStats,
    getTopCheckInUsers,
    checkIn,
    hasCheckedInToday,
  } = useCheckInStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [isAnimating, setIsAnimating] = useState(false);

  const myStats = currentUser ? getUserStats(currentUser.id) : null;
  const topUsers = getTopCheckInUsers(5);
  const checkedInToday = currentUser ? hasCheckedInToday(currentUser.id) : false;

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleCheckIn = () => {
    if (!currentUser) {
      showToast("请先选择用户身份", "warning");
      return;
    }
    if (checkedInToday) {
      showToast("今天已经签到过啦，明天再来吧~", "warning");
      return;
    }

    setIsAnimating(true);
    setTimeout(() => {
      const result = checkIn(currentUser.id);
      setIsAnimating(false);

      if (result.success) {
        if (result.newBadgeUnlocked) {
          showToast(
            `🎉 恭喜获得「${result.newBadgeUnlocked.name}」徽章！连续签到 ${result.streak} 天`,
            "success"
          );
        } else {
          showToast(`签到成功！已连续签到 ${result.streak} 天`, "success");
        }
      } else if (result.alreadyCheckedIn) {
        showToast("今天已经签到过啦", "warning");
      }
    }, 600);
  };

  const progressToBadge = myStats
    ? Math.min((myStats.currentStreak / STREAK_FOR_DRINK_MASTER) * 100, 100)
    : 0;
  const daysToBadge = Math.max(
    STREAK_FOR_DRINK_MASTER - (myStats?.currentStreak || 0),
    0
  );

  const allBadges = Object.values(badgeConfigs).map((config) => {
    const unlocked = myStats?.badges.find((b) => b.type === config.type);
    return { ...config, unlockedAt: unlocked?.unlockedAt } as Badge & {
      unlockedAt?: string;
    };
  });

  return (
    <div>
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-coffee-800">每日签到</h1>
        <p className="text-coffee-500 text-sm mt-1">坚持打卡，解锁专属徽章</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200 rounded-2xl p-6 shadow-soft relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-rose-200/30 to-amber-200/30 rounded-full translate-y-1/3 -translate-x-1/3" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarCheck className="w-6 h-6 text-orange-500" />
                    <h2 className="text-xl font-bold text-coffee-800">
                      {checkedInToday ? "今日已签到" : "今日尚未签到"}
                    </h2>
                    {checkedInToday && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-matcha-100 text-matcha-700 text-xs font-bold rounded-full">
                        ✓ 已完成
                      </span>
                    )}
                  </div>
                  <p className="text-coffee-500">
                    {formatDate(new Date(), "YYYY年MM月DD日")}
                  </p>
                </div>

                {myStats && myStats.currentStreak > 0 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-400 to-rose-400 rounded-2xl shadow-soft">
                      <Flame className="w-5 h-5 text-white" />
                      <span className="font-bold text-white text-xl">
                        {myStats.currentStreak}
                      </span>
                    </div>
                    <span className="text-xs text-coffee-500 font-medium">
                      连续签到
                    </span>
                  </div>
                )}
              </div>

              <motion.button
                whileTap={{ scale: checkedInToday ? 1 : 0.95 }}
                onClick={handleCheckIn}
                disabled={checkedInToday || isAnimating}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-lg transition-all relative overflow-hidden shadow-soft",
                  checkedInToday
                    ? "bg-coffee-100 text-coffee-400 cursor-default"
                    : "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:shadow-medium"
                )}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={checkedInToday ? "done" : "action"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative z-10 flex items-center justify-center gap-2"
                  >
                    {isAnimating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        签到中...
                      </>
                    ) : checkedInToday ? (
                      <>
                        <Sparkles className="w-5 h-5" />
                        今日已签到，明天继续
                      </>
                    ) : (
                      <>
                        <CalendarCheck className="w-5 h-5" />
                        立即签到
                      </>
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {!myStats?.badges.some((b) => b.type === "drink_master") && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-coffee-700">
                        距离「饮者达人」徽章
                      </span>
                    </div>
                    <span className="text-sm font-bold text-amber-600">
                      {daysToBadge > 0 ? `${daysToBadge} 天` : "已达成"}
                    </span>
                  </div>
                  <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToBadge}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-coffee-400">
                    <span>0 天</span>
                    <span>{STREAK_FOR_DRINK_MASTER} 天解锁</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              title="累计签到"
              value={myStats?.totalCheckIns || 0}
              subtitle="总打卡次数"
              icon={<CalendarCheck className="w-5 h-5" />}
              color="coffee"
            />
            <StatsCard
              title="连续天数"
              value={myStats?.currentStreak || 0}
              subtitle="当前连续签到"
              icon={<Flame className="w-5 h-5" />}
              color="amber"
            />
            <StatsCard
              title="最长连续"
              value={myStats?.longestStreak || 0}
              subtitle="历史最高纪录"
              icon={<TrendingUp className="w-5 h-5" />}
              color="matcha"
            />
            <StatsCard
              title="获得徽章"
              value={myStats?.badges.length || 0}
              subtitle="已解锁徽章数"
              icon={<Trophy className="w-5 h-5" />}
              color="amber"
            />
          </div>

          <CheckInCalendar />
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-soft p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-coffee-800">我的徽章</h3>
            </div>

            <div className="space-y-3">
              {allBadges.map((badge, index) => {
                const isUnlocked = !!badge.unlockedAt;
                return (
                  <motion.div
                    key={badge.type}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      isUnlocked
                        ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
                        : "bg-coffee-50 border-coffee-100 opacity-60"
                    )}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                        isUnlocked ? "" : "grayscale"
                      )}
                      style={{
                        backgroundColor: isUnlocked
                          ? badge.color + "20"
                          : undefined,
                      }}
                    >
                      {badge.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            "font-semibold truncate",
                            isUnlocked ? "text-coffee-800" : "text-coffee-500"
                          )}
                        >
                          {badge.name}
                        </p>
                        {isUnlocked && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-coffee-500">
                        {isUnlocked && badge.unlockedAt
                          ? `解锁于 ${formatDate(badge.unlockedAt, "YYYY-MM-DD")}`
                          : badge.description}
                      </p>
                    </div>
                    {isUnlocked && (
                      <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-soft p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-coffee-800">签到排行榜</h3>
            </div>

            <div className="space-y-2">
              {topUsers.map((userData, index) => {
                const user = users.find((u) => u.id === userData.userId);
                const isMe = userData.userId === currentUser?.id;
                const rankIcons = ["🥇", "🥈", "🥉"];

                return (
                  <motion.div
                    key={userData.userId}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-xl transition-colors",
                      isMe
                        ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
                        : "hover:bg-coffee-50"
                    )}
                  >
                    <div className="w-7 flex justify-center flex-shrink-0">
                      {index < 3 ? (
                        <span className="text-lg">{rankIcons[index]}</span>
                      ) : (
                        <span className="text-sm font-bold text-coffee-400">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-coffee-100 flex-shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          isMe ? "text-amber-700" : "text-coffee-700"
                        )}
                      >
                        {user?.name || "未知用户"}
                        {isMe && (
                          <span className="ml-1 text-xs text-amber-500">(我)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-coffee-400">
                        <Flame className="w-3 h-3" />
                        <span>连续 {userData.streak} 天</span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-coffee-700">
                        {userData.total}
                      </p>
                      <p className="text-xs text-coffee-400">次签到</p>
                    </div>
                  </motion.div>
                );
              })}

              {topUsers.length === 0 && (
                <div className="text-center py-8 text-coffee-400">
                  <Medal className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">暂无签到记录</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
