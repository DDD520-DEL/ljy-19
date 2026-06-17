import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Star,
  AlertTriangle,
  ClipboardCheck,
  History,
} from "lucide-react";
import { useDutyStore } from "@/store/useDutyStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import { formatDate, getMonthMatrix, isSameDay } from "@/utils/date";
import HandoverForm from "@/components/HandoverForm/HandoverForm";
import HandoverTimeline from "@/components/HandoverTimeline/HandoverTimeline";

type TabKey = "schedule" | "handover";

export default function Duty() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabKey>("schedule");
  const [showHandoverForm, setShowHandoverForm] = useState(false);
  const {
    getCurrentDutyUser,
    schedules,
    getPendingHandoverSchedule,
    getPreviousWeekSchedule,
    checkAndRotateDuty,
  } = useDutyStore();
  const { getUserById, currentUser } = useUserStore();

  useEffect(() => {
    checkAndRotateDuty();
  }, [checkAndRotateDuty]);

  const currentDutyUser = getCurrentDutyUser();
  const pendingHandover = getPendingHandoverSchedule();
  const previousSchedule = getPreviousWeekSchedule();
  const previousUser = previousSchedule ? getUserById(previousSchedule.userId) : null;

  const isPreviousWeekUser =
    currentUser && previousSchedule && currentUser.id === previousSchedule.userId;

  const needsHandover = pendingHandover && isPreviousWeekUser;

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
      handoverCompleted: schedule.handoverCompleted,
    };
  };

  const today = new Date();

  const tabs = [
    { key: "schedule" as const, label: "排班表", icon: Calendar },
    { key: "handover" as const, label: "交接记录", icon: History },
  ];

  const handleHandoverSuccess = () => {
    setShowHandoverForm(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-coffee-800">采购轮值</h1>
        <p className="text-coffee-500 text-sm mt-1">查看采购负责人排班表</p>
      </div>

      {pendingHandover && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-2xl p-4 mb-6 flex items-center justify-between gap-4",
            needsHandover
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              : "bg-amber-50 border border-amber-200"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                needsHandover ? "bg-white/20" : "bg-amber-100"
              )}
            >
              <AlertTriangle
                className={cn(
                  "w-5 h-5",
                  needsHandover ? "text-white" : "text-amber-600"
                )}
              />
            </div>
            <div>
              <p
                className={cn(
                  "font-medium",
                  needsHandover ? "text-white" : "text-amber-800"
                )}
              >
                {needsHandover
                  ? "您有未完成的值班交接"
                  : `${previousUser?.name || "上一位值班人"}尚未完成交接`}
              </p>
              <p
                className={cn(
                  "text-sm",
                  needsHandover ? "text-white/80" : "text-amber-600"
                )}
              >
                {needsHandover
                  ? "请完成交接项目并确认"
                  : "请提醒其完成交接确认"}
              </p>
            </div>
          </div>
          {needsHandover && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowHandoverForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-xl font-medium hover:bg-amber-50 transition-colors"
            >
              <ClipboardCheck className="w-4 h-4" />
              确认交接
            </motion.button>
          )}
        </motion.div>
      )}

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

      <div className="bg-white rounded-2xl shadow-soft p-1 mb-6 flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                activeTab === tab.key
                  ? "bg-coffee-700 text-white shadow-soft"
                  : "text-coffee-500 hover:text-coffee-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "schedule" && (
        <>
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

            <div className="space-y-1">
              {monthMatrix.map((week, weekIndex) => {
                const weekInfo = getWeekDutyInfo(week);
                const isCurrentWeek = weekInfo?.isCurrentWeek;
                const dutyUser = weekInfo?.user;
                const handoverCompleted = weekInfo?.handoverCompleted;

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
                        {!isCurrentWeek && weekInfo && (
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-xs font-medium",
                              handoverCompleted
                                ? "bg-matcha-100 text-matcha-600"
                                : "bg-amber-100 text-amber-600"
                            )}
                          >
                            {handoverCompleted ? "已交接" : "待交接"}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

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

                    <div className="flex items-center gap-3">
                      {!schedule.isCurrent && (
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            schedule.handoverCompleted
                              ? "bg-matcha-100 text-matcha-600"
                              : "bg-amber-100 text-amber-600"
                          )}
                        >
                          {schedule.handoverCompleted ? "已交接" : "待交接"}
                        </span>
                      )}
                      {schedule.isCurrent && (
                        <span className="text-matcha-500 text-sm font-medium">
                          进行中
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}

      {activeTab === "handover" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4">
            <h3 className="font-bold text-coffee-800 mb-1">交接记录</h3>
            <p className="text-sm text-coffee-500">查看历史值班交接记录</p>
          </div>
          <HandoverTimeline />
        </motion.div>
      )}

      {pendingHandover && needsHandover && (
        <HandoverForm
          isOpen={showHandoverForm}
          onClose={() => setShowHandoverForm(false)}
          schedule={pendingHandover}
          onSuccess={handleHandoverSuccess}
        />
      )}
    </div>
  );
}
