import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Coffee,
  Sparkles,
  FileText,
  Check,
  AlertCircle,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { useDutyStore } from "@/store/useDutyStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import type { DutySchedule } from "@/types";

interface HandoverFormProps {
  isOpen: boolean;
  onClose: () => void;
  schedule: DutySchedule;
  onSuccess?: () => void;
}

export default function HandoverForm({
  isOpen,
  onClose,
  schedule,
  onSuccess,
}: HandoverFormProps) {
  const { confirmHandover } = useDutyStore();
  const { getUserById } = useUserStore();
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showToast, setShowToast] = useState(false);

  const [tasks, setTasks] = useState({
    inventoryCheck: false,
    pantryCleanup: false,
    equipmentCheck: false,
    otherTasks: "",
  });
  const [notes, setNotes] = useState("");

  const user = getUserById(schedule.userId);
  const currentUser = useDutyStore.getState().getCurrentDutyUser();

  const handleTaskToggle = (key: keyof typeof tasks) => {
    if (key === "otherTasks") return;
    setTasks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = () => {
    const allMainTasksDone =
      tasks.inventoryCheck && tasks.pantryCleanup && tasks.equipmentCheck;

    if (!allMainTasksDone) {
      setToastMessage("请完成所有必选交接项目");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const success = confirmHandover(schedule.id, tasks, notes);

    if (success) {
      setToastMessage("交接确认成功！");
      setToastType("success");
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
        onSuccess?.();
      }, 1500);

      setTasks({
        inventoryCheck: false,
        pantryCleanup: false,
        equipmentCheck: false,
        otherTasks: "",
      });
      setNotes("");
    } else {
      setToastMessage("交接确认失败，请重试");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const allTasksCompleted =
    tasks.inventoryCheck && tasks.pantryCleanup && tasks.equipmentCheck;

  const taskItems = [
    {
      key: "inventoryCheck" as const,
      icon: ClipboardList,
      label: "盘点库存",
      description: "核对物料库存数量，检查是否有缺货",
    },
    {
      key: "pantryCleanup" as const,
      icon: Sparkles,
      label: "清理茶水间",
      description: "清洁台面、清洗器具、整理储物区",
    },
    {
      key: "equipmentCheck" as const,
      icon: Coffee,
      label: "检查设备",
      description: "确认咖啡机、冰箱等设备运行正常",
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="交接确认" className="max-w-lg">
      <div className="space-y-5">
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-center gap-2 p-3 rounded-xl text-sm",
              toastType === "success"
                ? "bg-matcha-50 text-matcha-700"
                : "bg-danger-50 text-danger-700"
            )}
          >
            {toastType === "success" ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {toastMessage}
          </motion.div>
        )}

        <div className="bg-coffee-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium text-coffee-800">
                {user?.name} 的值班交接
              </p>
              <p className="text-sm text-coffee-500">
                {schedule.weekStart} ~ {schedule.weekEnd}
              </p>
            </div>
          </div>
          {currentUser && (
            <div className="mt-3 pt-3 border-t border-coffee-100 flex items-center gap-2 text-sm text-coffee-600">
              <span>交接给：</span>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="font-medium">{currentUser.name}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-700 mb-3">
            交接项目
          </label>
          <div className="space-y-2">
            {taskItems.map((item) => {
              const isCompleted = tasks[item.key];
              return (
                <motion.button
                  key={item.key}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleTaskToggle(item.key)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200",
                    isCompleted
                      ? "bg-matcha-50 ring-2 ring-matcha-300"
                      : "bg-white border border-coffee-100 hover:border-coffee-300"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                      isCompleted
                        ? "bg-matcha-500 text-white"
                        : "bg-coffee-100 text-coffee-300"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <item.icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "font-medium",
                        isCompleted ? "text-matcha-700" : "text-coffee-800"
                      )}
                    >
                      {item.label}
                      <span className="text-danger-500 ml-1">*</span>
                    </p>
                    <p className="text-xs text-coffee-500">{item.description}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-700 mb-2">
            其他事项
          </label>
          <textarea
            value={tasks.otherTasks}
            onChange={(e) =>
              setTasks((prev) => ({ ...prev, otherTasks: e.target.value }))
            }
            placeholder="记录其他需要说明的事项（可选）"
            rows={2}
            className="w-full px-3 py-2.5 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-700 mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              交接备注
            </div>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="填写交接备注，如库存异常、设备问题等..."
            rows={3}
            className="w-full px-3 py-2.5 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={!allTasksCompleted}
            className={cn(
              "w-full py-3 rounded-xl font-medium transition-all duration-200",
              allTasksCompleted
                ? "bg-coffee-700 text-white hover:bg-coffee-800 shadow-soft"
                : "bg-coffee-100 text-coffee-300 cursor-not-allowed"
            )}
          >
            确认交接
          </button>
        </div>
      </div>
    </Modal>
  );
}
