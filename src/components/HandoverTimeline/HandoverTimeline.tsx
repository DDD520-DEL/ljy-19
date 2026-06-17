import { motion } from "framer-motion";
import {
  ClipboardList,
  Coffee,
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";
import { useDutyStore } from "@/store/useDutyStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import { formatDate, timeAgo } from "@/utils/date";

export default function HandoverTimeline() {
  const { getHandoverRecords } = useDutyStore();
  const { getUserById } = useUserStore();

  const records = getHandoverRecords();

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-soft p-8 text-center">
        <FileText className="w-12 h-12 text-coffee-300 mx-auto mb-3" />
        <p className="text-coffee-500 font-medium">暂无交接记录</p>
        <p className="text-sm text-coffee-400 mt-1">完成值班交接后，记录将显示在这里</p>
      </div>
    );
  }

  const taskIcons = {
    inventoryCheck: ClipboardList,
    pantryCleanup: Sparkles,
    equipmentCheck: Coffee,
  };

  const taskLabels = {
    inventoryCheck: "盘点库存",
    pantryCleanup: "清理茶水间",
    equipmentCheck: "检查设备",
  };

  return (
    <div className="space-y-4">
      {records.map((record, index) => {
        const user = getUserById(record.userId);
        const nextUser = getUserById(record.nextUserId);

        return (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative bg-white rounded-2xl shadow-soft overflow-hidden"
          >
            {index < records.length - 1 && (
              <div className="absolute left-8 top-full w-0.5 h-4 bg-coffee-100 z-0" />
            )}

            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="relative z-10">
                  <div className="w-8 h-8 rounded-full bg-matcha-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-matcha-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={user?.avatar}
                        alt={user?.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-coffee-800">
                          {user?.name}
                        </p>
                        <p className="text-xs text-coffee-500">
                          {record.weekStart} ~ {record.weekEnd}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-coffee-400">
                      <Clock className="w-3 h-3" />
                      {timeAgo(record.confirmedAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-cream-50 rounded-xl">
                    <User className="w-4 h-4 text-coffee-500" />
                    <span className="text-sm text-coffee-600">交接给</span>
                    <ArrowRight className="w-4 h-4 text-coffee-300" />
                    <img
                      src={nextUser?.avatar}
                      alt={nextUser?.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium text-coffee-700">
                      {nextUser?.name}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-semibold text-coffee-600 mb-2">
                      完成项目
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(taskLabels) as Array<keyof typeof taskLabels>).map(
                        (key) => {
                          const Icon = taskIcons[key];
                          return (
                            <div
                              key={key}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs",
                                record.tasks[key]
                                  ? "bg-matcha-50 text-matcha-700"
                                  : "bg-coffee-50 text-coffee-400"
                              )}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {taskLabels[key]}
                              {record.tasks[key] && (
                                <CheckCircle2 className="w-3 h-3 text-matcha-500" />
                              )}
                            </div>
                          );
                        }
                      )}
                      {record.tasks.otherTasks && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-coffee-50 text-coffee-600">
                          <FileText className="w-3.5 h-3.5" />
                          {record.tasks.otherTasks}
                        </div>
                      )}
                    </div>
                  </div>

                  {record.notes && (
                    <div className="bg-coffee-50 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-coffee-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-coffee-600 mb-1">
                            交接备注
                          </p>
                          <p className="text-sm text-coffee-700">
                            {record.notes}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-coffee-50 text-right">
                    <p className="text-xs text-coffee-400">
                      确认时间：{formatDate(new Date(record.confirmedAt), "YYYY-MM-DD HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
