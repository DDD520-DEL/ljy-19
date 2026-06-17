import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, AlertTriangle, RefreshCw } from "lucide-react";
import { useDutyStore } from "@/store/useDutyStore";
import { cn } from "@/lib/utils";

export default function DutyBanner() {
  const { bannerState, dismissBanner } = useDutyStore();

  const { update, pending } = bannerState;

  const allBanners: Array<{
    type: "update" | "pending";
    visible: boolean;
    message: string;
  }> = [
    { type: "update", visible: update.visible, message: update.message },
    { type: "pending", visible: pending.visible, message: pending.message },
  ];

  const banners = allBanners.filter(
    (b): b is { type: "update" | "pending"; visible: true; message: string } =>
      b.visible && !!b.message
  );

  return (
    <div className="sticky top-16 z-20">
      <AnimatePresence>
        {banners.map((banner, index) => {
          const isUpdate = banner.type === "update";
          return (
            <motion.div
              key={banner.type}
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "border-b overflow-hidden",
                isUpdate
                  ? "bg-gradient-to-r from-matcha-500 to-matcha-600 border-matcha-400"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400"
              )}
            >
              <div className="px-4 lg:px-6 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <motion.div
                      animate={
                        isUpdate
                          ? { rotate: [0, 10, -10, 0] }
                          : { scale: [1, 1.1, 1] }
                      }
                      transition={{
                        repeat: Infinity,
                        repeatDelay: isUpdate ? 2 : 1.5,
                        duration: 0.5,
                      }}
                    >
                      {isUpdate ? (
                        <RefreshCw className="w-5 h-5 text-white" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-white" />
                      )}
                    </motion.div>
                    <div className="flex items-center gap-2 min-w-0">
                      <Bell className="w-4 h-4 text-white/80 flex-shrink-0" />
                      <p className="text-white font-medium text-sm truncate">
                        {banner.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissBanner(banner.type)}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
                    aria-label={`关闭${isUpdate ? "更新" : "提醒"}通知`}
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
