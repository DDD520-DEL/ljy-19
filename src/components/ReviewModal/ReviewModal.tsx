import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Material } from "@/types";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  quantity: number;
  onSubmit: (rating: 1 | 2 | 3 | 4 | 5, comment?: string) => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  material,
  quantity,
  onSubmit,
}: ReviewModalProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");

  const handleClose = () => {
    setRating(5);
    setHoverRating(0);
    setComment("");
    onClose();
  };

  const handleSubmit = () => {
    if (rating < 1) return;
    onSubmit(rating, comment.trim() || undefined);
    setRating(5);
    setHoverRating(0);
    setComment("");
  };

  const ratingLabels: Record<number, string> = {
    1: "很差",
    2: "一般",
    3: "还行",
    4: "不错",
    5: "非常好",
  };

  return (
    <AnimatePresence>
      {isOpen && material && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-large overflow-hidden",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-3 border-b border-coffee-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-coffee-800">评价一下吧</h3>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-coffee-50 text-coffee-400 hover:text-coffee-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 p-4 bg-coffee-50 rounded-2xl mb-6">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: material.color + "30" }}
                >
                  {material.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-coffee-800">{material.name}</h4>
                  <p className="text-sm text-coffee-500">
                    取用 {quantity} {material.unit} · 感谢您的评价！
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-coffee-700 mb-3 text-center">
                  您对这次取用满意吗？
                </p>
                <div className="flex items-center justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star as 1 | 2 | 3 | 4 | 5)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "w-9 h-9 transition-all",
                          (hoverRating || rating) >= star
                            ? "text-amber-400 fill-amber-400"
                            : "text-coffee-200"
                        )}
                      />
                    </motion.button>
                  ))}
                </div>
                <p className="text-center text-sm font-medium text-amber-600">
                  {ratingLabels[hoverRating || rating]}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  说点什么？<span className="text-coffee-400 font-normal">（选填）</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 100))}
                  placeholder="口感、新鲜度、建议……"
                  rows={3}
                  className="w-full px-4 py-3 text-sm bg-cream-50 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-400 focus:border-transparent resize-none placeholder:text-coffee-300"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-coffee-400">
                    {comment.length}/100
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-xl font-medium text-coffee-600 bg-coffee-50 hover:bg-coffee-100 transition-colors text-sm"
                >
                  稍后再说
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  disabled={rating < 1}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all",
                    rating >= 1
                      ? "bg-coffee-700 text-white hover:bg-coffee-800"
                      : "bg-coffee-100 text-coffee-300 cursor-not-allowed"
                  )}
                >
                  <Send className="w-4 h-4" />
                  提交评价
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
