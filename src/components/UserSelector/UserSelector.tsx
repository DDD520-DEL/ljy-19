import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, User } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

interface UserSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSelector({ isOpen, onClose }: UserSelectorProps) {
  const { users, currentUserId, setCurrentUser } = useUserStore();
  const [selectedId, setSelectedId] = useState(currentUserId);

  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentUserId);
    }
  }, [isOpen, currentUserId]);

  const handleSelect = (userId: string) => {
    setSelectedId(userId);
  };

  const handleConfirm = () => {
    if (selectedId) {
      setCurrentUser(selectedId);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-large w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-coffee-100">
              <h3 className="text-lg font-bold text-coffee-800">选择身份</h3>
              <p className="text-sm text-coffee-400">选择你的身份以记录消耗</p>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-2">
                {users.map((user) => (
                  <motion.button
                    key={user.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(user.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
                      selectedId === user.id
                        ? "bg-coffee-700 text-white shadow-soft"
                        : "bg-coffee-50 text-coffee-700 hover:bg-coffee-100"
                    )}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-coffee-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-coffee-600" />
                      </div>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-medium">{user.name}</p>
                      <p className={cn(
                        "text-xs",
                        selectedId === user.id ? "text-white/70" : "text-coffee-400"
                      )}>
                        {user.role === "admin" ? "管理员" : "普通成员"}
                      </p>
                    </div>
                    {selectedId === user.id && (
                      <Check className="w-5 h-5" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-coffee-100">
              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-coffee-700 text-white rounded-xl font-medium hover:bg-coffee-800 transition-colors"
              >
                确认选择
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
