import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Flame, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, getMonthMatrix, isSameDay, isSameMonth } from "@/utils/date";
import { useCheckInStore } from "@/store/useCheckInStore";
import { useUserStore } from "@/store/useUserStore";

interface CheckInCalendarProps {
  userId?: string;
  showHeader?: boolean;
  compact?: boolean;
}

const weekDayLabels = ["一", "二", "三", "四", "五", "六", "日"];

const getHeatLevel = (streakAtDay: number): number => {
  if (streakAtDay === 0) return 0;
  if (streakAtDay <= 2) return 1;
  if (streakAtDay <= 5) return 2;
  if (streakAtDay <= 10) return 3;
  return 4;
};

const heatLevelColors = [
  "bg-coffee-50 text-coffee-300",
  "bg-matcha-100 text-matcha-700",
  "bg-matcha-200 text-matcha-800",
  "bg-matcha-400 text-white",
  "bg-matcha-600 text-white",
];

export default function CheckInCalendar({
  userId: propUserId,
  showHeader = true,
  compact = false,
}: CheckInCalendarProps) {
  const { currentUser } = useUserStore();
  const { getUserCheckInsForMonth } = useCheckInStore();
  const [viewDate, setViewDate] = useState(new Date());

  const targetUserId = propUserId || currentUser?.id;

  const monthData = useMemo(() => {
    if (!targetUserId) return { matrix: [], checkIns: [] as string[] };
    const matrix = getMonthMatrix(viewDate.getFullYear(), viewDate.getMonth());
    const checkIns = getUserCheckInsForMonth(targetUserId, viewDate).map((c) => c.date);
    return { matrix, checkIns };
  }, [viewDate, targetUserId, getUserCheckInsForMonth]);

  const today = new Date();
  const isCurrentMonth = isSameMonth(viewDate, today);

  const goToPrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const monthTitle = formatDate(viewDate, "YYYY年MM月");

  const calculateStreakAtDay = (date: Date, allCheckIns: string[]): number => {
    let streak = 0;
    let checkDate = new Date(date);
    while (allCheckIns.includes(formatDate(checkDate, "YYYY-MM-DD"))) {
      streak++;
      checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate() - 1);
    }
    return streak;
  };

  return (
    <div className={cn("bg-white rounded-2xl shadow-soft overflow-hidden", compact ? "p-3" : "p-5")}>
      {showHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-matcha-100 rounded-xl">
              <CalendarIcon className="w-5 h-5 text-matcha-600" />
            </div>
            <h3 className={cn("font-bold text-coffee-800", compact ? "text-sm" : "text-lg")}>
              {compact ? "签到日历" : "签到热力图"}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevMonth}
              className="p-1.5 rounded-lg hover:bg-coffee-50 text-coffee-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={cn("font-medium text-coffee-700 min-w-24 text-center", compact ? "text-sm" : "")}>
              {monthTitle}
            </span>
            <button
              onClick={goToNextMonth}
              disabled={isCurrentMonth}
              className={cn(
                "p-1.5 rounded-lg text-coffee-500 transition-colors",
                isCurrentMonth ? "opacity-30 cursor-not-allowed" : "hover:bg-coffee-50"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDayLabels.map((day) => (
          <div
            key={day}
            className={cn(
              "text-center font-medium text-coffee-400",
              compact ? "text-xs py-1" : "text-sm py-2"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {monthData.matrix.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-1">
            {week.map((date, dayIndex) => {
              if (!date) {
                return <div key={dayIndex} className={cn(compact ? "h-7" : "h-9")} />;
              }

              const dateStr = formatDate(date, "YYYY-MM-DD");
              const hasCheckedIn = monthData.checkIns.includes(dateStr);
              const streakAtDay = hasCheckedIn
                ? calculateStreakAtDay(date, monthData.checkIns)
                : 0;
              const heatLevel = getHeatLevel(streakAtDay);
              const isToday = isSameDay(date, today);
              const isFuture = date > today;

              return (
                <motion.div
                  key={dayIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                  className={cn(
                    "flex items-center justify-center rounded-lg font-medium relative transition-all",
                    compact ? "h-7 text-xs" : "h-9 text-sm",
                    isFuture
                      ? "bg-transparent text-coffee-200"
                      : hasCheckedIn
                      ? heatLevelColors[heatLevel]
                      : "bg-coffee-50 text-coffee-400",
                    isToday && !isFuture && "ring-2 ring-coffee-500 ring-offset-1"
                  )}
                >
                  {date.getDate()}
                  {hasCheckedIn && !compact && heatLevel >= 3 && (
                    <Flame className="w-3 h-3 absolute -top-1 -right-1 text-amber-500" />
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {!compact && (
        <div className="mt-4 flex items-center justify-between pt-4 border-t border-coffee-100">
          <div className="flex items-center gap-1">
            <span className="text-xs text-coffee-400 mr-2">强度</span>
            {heatLevelColors.map((color, index) => (
              <div
                key={index}
                className={cn("w-5 h-5 rounded", color)}
              />
            ))}
          </div>
          <div className="text-xs text-coffee-400">
            本月签到 {monthData.checkIns.length} 天
          </div>
        </div>
      )}
    </div>
  );
}
