import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, AlertTriangle, RefreshCw } from "lucide-react";
import { useDutyStore } from "@/store/useDutyStore";
import { cn } from "@/lib/utils";

export default function DutyBanner() {
  const { bannerState, dismissBanner } = useDutyStore();

  const { showBanner, bannerType, message } = bannerState;

  if (!showBanner) return null;

  const isUpdate = bannerType === "update";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "sticky top-16 z-20 border-b",
          isUpdate
            ? "bg-gradient-to-r from-matcha-500 to-matcha-600 border-matcha-400"
            : "bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400"
        )}
      >
        <div className="px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: isUpdate ? [0, 10, -10, 0] : 0 }}
                transition={{ repeat: Infinity, repeatDelay: 2, duration: 0.5 }}
              >
                {isUpdate ? (
                  <RefreshCw className="w-5 h-5 text-white" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-white" />
                )}
              </motion.div>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-white/80" />
                <p className="text-white font-medium text-sm">{message}</p>
              </div>
            </div>
            <button
              onClick={dismissBanner}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
