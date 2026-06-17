import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, CalendarCheck, Trophy, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { useCheckInStore } from "@/store/useCheckInStore";
import { STREAK_FOR_DRINK_MASTER } from "@/types";
import Toast, { ToastType } from "@/components/Toast/Toast";

export default function CheckInCard() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const { checkIn, hasCheckedInToday, getUserStats } = useCheckInStore();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [isAnimating, setIsAnimating] = useState(false);

  const stats = currentUser ? getUserStats(currentUser.id) : null;
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
          showToast(`🎉 恭喜获得「${result.newBadgeUnlocked.name}」徽章！连续签到 ${result.streak} 天`, "success");
        } else {
          showToast(`签到成功！已连续签到 ${result.streak} 天`, "success");
        }
      } else if (result.alreadyCheckedIn) {
        showToast("今天已经签到过啦", "warning");
      }
    }, 600);
  };

  const progressToBadge = stats
    ? Math.min((stats.currentStreak / STREAK_FOR_DRINK_MASTER) * 100, 100)
    : 0;
  const daysToBadge = Math.max(STREAK_FOR_DRINK_MASTER - (stats?.currentStreak || 0), 0);
  const hasDrinkMasterBadge = stats?.badges.some((b) => b.type === "drink_master");

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200 rounded-2xl p-5 mb-6 shadow-soft relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-rose-200/20 to-amber-200/20 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-soft">
                <CalendarCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-coffee-800">每日签到</h3>
                <p className="text-sm text-coffee-500">坚持打卡，解锁徽章</p>
              </div>
            </div>

            {stats && stats.currentStreak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 rounded-full border border-amber-200">
                <Flame className={cn("w-4 h-4", stats.currentStreak >= 3 ? "text-orange-500" : "text-amber-500")} />
                <span className="font-bold text-amber-700">{stats.currentStreak} 天</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/60 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-coffee-800">{stats?.totalCheckIns || 0}</p>
              <p className="text-xs text-coffee-500">累计签到</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-coffee-800">{stats?.currentStreak || 0}</p>
              <p className="text-xs text-coffee-500">连续天数</p>
            </div>
            <div className="bg-white/60 rounded-xl p-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold text-coffee-800">{stats?.longestStreak || 0}</p>
              <p className="text-xs text-coffee-500">最长连续</p>
            </div>
          </div>

          {!hasDrinkMasterBadge && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-coffee-700">饮者达人</span>
                </div>
                <span className="text-xs text-coffee-500">
                  {daysToBadge > 0 ? `再签到 ${daysToBadge} 天解锁` : "已解锁"}
                </span>
              </div>
              <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToBadge}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                />
              </div>
            </div>
          )}

          {hasDrinkMasterBadge && stats && (
            <div className="mb-4 flex items-center gap-3 p-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl border border-amber-200">
              <div className="text-3xl">🏆</div>
              <div className="flex-1">
                <p className="font-bold text-amber-800">饮者达人</p>
                <p className="text-xs text-amber-600">已解锁 · 连续签到 {STREAK_FOR_DRINK_MASTER} 天达成</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
          )}

          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: checkedInToday ? 1 : 0.95 }}
              onClick={handleCheckIn}
              disabled={checkedInToday || isAnimating}
              className={cn(
                "flex-1 py-3 rounded-xl font-semibold transition-all relative overflow-hidden",
                checkedInToday
                  ? "bg-coffee-100 text-coffee-400 cursor-default"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-soft hover:shadow-medium"
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
                        transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      签到中...
                    </>
                  ) : checkedInToday ? (
                    "✓ 今日已签到"
                  ) : (
                    "立即签到"
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            <button
              onClick={() => navigate("/checkin")}
              className="px-4 py-3 bg-white/70 rounded-xl font-medium text-coffee-700 hover:bg-white transition-colors flex items-center gap-1"
            >
              详情
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
