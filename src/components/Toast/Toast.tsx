import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  isVisible: boolean;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: Check,
    bg: "bg-matcha-500",
    text: "text-white",
  },
  error: {
    icon: X,
    bg: "bg-danger-500",
    text: "text-white",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500",
    text: "text-white",
  },
  info: {
    icon: Info,
    bg: "bg-coffee-600",
    text: "text-white",
  },
};

export default function Toast({
  message,
  type = "success",
  duration = 3000,
  isVisible,
  onClose,
}: ToastProps) {
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={cn(
            "fixed top-4 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-3 px-5 py-3 rounded-xl shadow-medium",
            config.bg,
            config.text
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{message}</p>
          <button
            onClick={onClose}
            className="ml-2 p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
