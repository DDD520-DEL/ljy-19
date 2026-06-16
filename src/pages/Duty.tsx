import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, User, Phone, Mail, Star } from "lucide-react";
import { useDutyStore } from "@/store/useDutyStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import { formatDate, getMonthMatrix, isSameDay, isSameWeek } from "@/utils/date";

export default function Duty() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { getCurrentDutyUser, schedules } = useDutyStore();
  const { users, getUserById } = useUserStore();

  const currentDutyUser = getCurrentDutyUser();
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthMatrix = getMonthMatrix(year, month);

  const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const getDutyForDate = (date: Date | null) => {
    if (!date) return null;
    const dateStr = formatDate(date, "YYYY-MM-DD");
    const schedule = schedules.find(
      (s) => s.weekStart <= dateStr && s.weekEnd >= dateStr
    );
    if (!schedule) return null;
    return getUserById(schedule.userId);
  };

  const getWeekDutyInfo = (week: (Date | null)[]) => {
    const validDate = week.find((d) => d !== null);
    if (!validDate) return null;

    const dateStr = formatDate(validDate, "YYYY-MM-DD");
    const schedule = schedules.find(
      (s) => s.weekStart <= dateStr && s.weekEnd >= dateStr
    );
    if (!schedule) return null;

    return {
      user: getUserById(schedule.userId),
      isCurrentWeek: schedule.isCurrent,
      weekStart: schedule.weekStart,
      weekEnd: schedule.weekEnd,
    };
  };

  const today = new Date();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-coffee-800">采购轮值</h1>
        <p className="text-coffee-500 text-sm mt-1">查看采购负责人排班表</p>
      </div>

      {/* 本周负责人卡片 */}
      {currentDutyUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-coffee-700 to-coffee-900 rounded-2xl p-6 mb-6 text-white shadow-medium"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="font-medium">本周采购负责人</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentDutyUser.avatar}
                alt={currentDutyUser.name}
                className="w-16 h-16 rounded-full border-4 border-white/20"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-matcha-400 rounded-full flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{currentDutyUser.name}</h2>
              <p className="text-white/70 text-sm">
                {currentDutyUser.role === "admin" ? "管理员" : "普通成员"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                <Mail className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm text-white/70">
              📅 {formatDate(new Date(), "YYYY年MM月DD日")} · 本周负责物料采购与补货
            </p>
          </div>
        </motion.div>
      )}

      {/* 月度日历 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-soft p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-coffee-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-coffee-600" />
          </button>

          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-coffee-500" />
            <h3 className="text-lg font-bold text-coffee-800">
              {year}年{month + 1}月
            </h3>
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-coffee-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-coffee-600" />
          </button>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-center text-sm font-medium py-2",
                index >= 5 ? "text-coffee-300" : "text-coffee-500"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="space-y-1">
          {monthMatrix.map((week, weekIndex) => {
            const weekInfo = getWeekDutyInfo(week);
            const isCurrentWeek = weekInfo?.isCurrentWeek;
            const dutyUser = weekInfo?.user;

            return (
              <motion.div
                key={weekIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: weekIndex * 0.03 }}
                className={cn(
                  "grid grid-cols-7 gap-1 p-1 rounded-xl transition-colors",
                  isCurrentWeek && "bg-matcha-50 ring-2 ring-matcha-300"
                )}
              >
                {week.map((date, dayIndex) => {
                  const isToday = date ? isSameDay(date, today) : false;
                  const isWeekend = dayIndex >= 5;
                  const dutyForDate = dutyUser;

                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-lg relative",
                        date ? "bg-cream-50" : "bg-transparent",
                        isToday && "ring-2 ring-coffee-500",
                        isCurrentWeek && !isToday && "bg-matcha-100/50"
                      )}
                    >
                      {date && (
                        <>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isToday
                                ? "text-coffee-700 font-bold"
                                : isWeekend
                                ? "text-coffee-300"
                                : "text-coffee-600"
                            )}
                          >
                            {date.getDate()}
                          </span>
                          {dutyForDate && dayIndex === 0 && (
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2">
                              <img
                                src={dutyForDate.avatar}
                                alt={dutyForDate.name}
                                className="w-5 h-5 rounded-full border border-white"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

                {dutyUser && (
                  <div className="col-span-7 flex items-center gap-2 px-2 py-1 text-xs">
                    <img
                      src={dutyUser.avatar}
                      alt={dutyUser.name}
                      className="w-4 h-4 rounded-full"
                    />
                    <span className="text-coffee-500">{dutyUser.name}</span>
                    {isCurrentWeek && (
                      <span className="px-1.5 py-0.5 bg-matcha-100 text-matcha-600 rounded text-xs font-medium">
                        本周
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* 近期轮值表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-white rounded-2xl shadow-soft overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-coffee-100">
          <h3 className="font-bold text-coffee-800">近期轮值安排</h3>
        </div>

        <div className="divide-y divide-coffee-50">
          {schedules.slice(0, 8).map((schedule, index) => {
            const user = getUserById(schedule.userId);
            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className={cn(
                  "px-6 py-4 flex items-center gap-4 transition-colors",
                  schedule.isCurrent
                    ? "bg-matcha-50"
                    : "hover:bg-coffee-50/50"
                )}
              >
                <div className="relative">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-10 h-10 rounded-full"
                  />
                  {schedule.isCurrent && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-matcha-400 rounded-full flex items-center justify-center text-white text-xs">
                      ✓
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-coffee-800">{user?.name}</p>
                    {schedule.isCurrent && (
                      <span className="badge badge-success text-xs">本周</span>
                    )}
                  </div>
                  <p className="text-sm text-coffee-400">
                    {schedule.weekStart} ~ {schedule.weekEnd}
                  </p>
                </div>

                {schedule.isCurrent && (
                  <span className="text-matcha-500 text-sm font-medium">
                    进行中
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
