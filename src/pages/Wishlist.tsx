import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Heart,
  CheckCircle,
  XCircle,
  ExternalLink,
  User,
  Clock,
  Filter,
  Star,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useWishListStore } from "@/store/useWishListStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/utils/date";
import type { WishStatus } from "@/types";
import { wishStatusLabels, wishStatusColors } from "@/types";

export default function Wishlist() {
  const [modalOpen, setModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedWishId, setSelectedWishId] = useState<string | null>(null);
  const [adminAction, setAdminAction] = useState<"purchased" | "declined">("purchased");
  const [adminNote, setAdminNote] = useState("");

  const [wishName, setWishName] = useState("");
  const [wishLink, setWishLink] = useState("");
  const [wishReason, setWishReason] = useState("");

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  const [activeFilter, setActiveFilter] = useState<WishStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"latest" | "likes">("likes");

  const { wishes, addWish, toggleLike, markAsPurchased, markAsDeclined, hasUserLiked } = useWishListStore();
  const { currentUser, users } = useUserStore();

  const isAdmin = currentUser?.role === "admin";

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || "未知用户";
  };

  const getUserAvatar = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.avatar;
  };

  const filteredWishes = useMemo(() => {
    let result = [...(wishes || [])];

    if (activeFilter !== "all") {
      result = result.filter((w) => w.status === activeFilter);
    }

    if (sortBy === "likes") {
      result.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [wishes, activeFilter, sortBy]);

  const stats = useMemo(() => {
    const wishList = wishes || [];
    return {
      total: wishList.length,
      pending: wishList.filter((w) => w.status === "pending").length,
      purchased: wishList.filter((w) => w.status === "purchased").length,
      declined: wishList.filter((w) => w.status === "declined").length,
      totalLikes: wishList.reduce((sum, w) => sum + (w.likes?.length || 0), 0),
    };
  }, [wishes]);

  const handleSubmit = () => {
    if (!currentUser) return;

    if (!wishName.trim()) {
      showToast("请输入心愿名称", "error");
      return;
    }

    if (!wishReason.trim()) {
      showToast("请填写推荐理由", "error");
      return;
    }

    addWish(wishName.trim(), wishReason.trim(), currentUser.id, wishLink.trim());
    showToast("心愿提交成功！", "success");
    setModalOpen(false);
    setWishName("");
    setWishLink("");
    setWishReason("");
  };

  const handleLike = (wishId: string) => {
    if (!currentUser) return;
    toggleLike(wishId, currentUser.id);
  };

  const openAdminModal = (wishId: string, action: "purchased" | "declined") => {
    setSelectedWishId(wishId);
    setAdminAction(action);
    setAdminNote("");
    setAdminModalOpen(true);
  };

  const handleAdminAction = () => {
    if (!currentUser || !selectedWishId) return;

    if (adminAction === "purchased") {
      markAsPurchased(selectedWishId, currentUser.id, adminNote.trim() || undefined);
      showToast("已标记为已采购", "success");
    } else {
      markAsDeclined(selectedWishId, currentUser.id, adminNote.trim() || undefined);
      showToast("已标记为暂不采购", "success");
    }

    setAdminModalOpen(false);
    setSelectedWishId(null);
    setAdminNote("");
  };

  const filterTabs = [
    { key: "all" as const, label: "全部", count: stats.total },
    { key: "pending" as const, label: "待处理", count: stats.pending },
    { key: "purchased" as const, label: "已采购", count: stats.purchased },
    { key: "declined" as const, label: "暂不采购", count: stats.declined },
  ];

  const selectedWish = selectedWishId ? wishes.find((w) => w.id === selectedWishId) : null;

  return (
    <div>
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coffee-800">心愿单</h1>
          <p className="text-coffee-500 text-sm mt-1">
            {isAdmin ? "管理所有心愿，标记采购状态" : "提交心愿，为喜欢的心愿点赞"}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-wish-500 to-wish-600 text-white rounded-xl shadow-soft hover:from-wish-600 hover:to-wish-700 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>提交心愿</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl shadow-soft p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-coffee-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-coffee-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-800">{stats.total}</p>
              <p className="text-xs text-coffee-500">总心愿数</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-soft p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
              <p className="text-xs text-coffee-500">待处理</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-soft p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-matcha-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-matcha-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-matcha-700">{stats.purchased}</p>
              <p className="text-xs text-coffee-500">已采购</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-soft p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-rose-700">{stats.totalLikes}</p>
              <p className="text-xs text-coffee-500">总点赞数</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {filterTabs.map((tab) => (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveFilter(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                  activeFilter === tab.key
                    ? "bg-wish-600 text-white shadow-soft"
                    : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold",
                    activeFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-white text-coffee-500"
                  )}
                >
                  {tab.count}
                </span>
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-coffee-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "latest" | "likes")}
              className="px-3 py-1.5 rounded-lg bg-coffee-50 text-coffee-700 text-sm border-0 focus:ring-2 focus:ring-wish-400 cursor-pointer"
            >
              <option value="likes">按点赞数</option>
              <option value="latest">按最新发布</option>
            </select>
          </div>
        </div>
      </div>

      {filteredWishes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft p-16 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-wish-50 flex items-center justify-center">
            <Star className="w-10 h-10 text-wish-400" />
          </div>
          <h3 className="text-lg font-bold text-coffee-800 mb-2">还没有心愿</h3>
          <p className="text-coffee-500 mb-6">
            {activeFilter === "all"
              ? "成为第一个提交心愿的人吧！"
              : `当前没有${wishStatusLabels[activeFilter]}的心愿`}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-wish-500 text-white rounded-xl hover:bg-wish-600 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>提交心愿</span>
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredWishes.map((wish, index) => {
              const isLiked = currentUser ? hasUserLiked(wish.id, currentUser.id) : false;
              const isCreator = currentUser?.id === wish.createdBy;

              return (
                <motion.div
                  key={wish.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                  className={cn(
                    "bg-white rounded-2xl shadow-soft overflow-hidden transition-all",
                    wish.status !== "pending" && "opacity-90"
                  )}
                >
                  <div
                    className="h-1.5"
                    style={{ backgroundColor: wishStatusColors[wish.status] }}
                  />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-wish-50 flex items-center justify-center flex-shrink-0">
                          <Star className="w-5 h-5 text-wish-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-coffee-800 truncate">{wish.name}</h3>
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0"
                              style={{ backgroundColor: wishStatusColors[wish.status] }}
                            >
                              {wishStatusLabels[wish.status]}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-coffee-400">
                            <span className="flex items-center gap-1">
                              {getUserAvatar(wish.createdBy) ? (
                                <img
                                  src={getUserAvatar(wish.createdBy)}
                                  alt=""
                                  className="w-3.5 h-3.5 rounded-full"
                                />
                              ) : (
                                <User className="w-3.5 h-3.5" />
                              )}
                              {getUserName(wish.createdBy)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {timeAgo(wish.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLike(wish.id)}
                        disabled={!currentUser}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all flex-shrink-0",
                          isLiked
                            ? "bg-rose-500 text-white shadow-soft"
                            : "bg-rose-50 text-rose-600 hover:bg-rose-100",
                          !currentUser && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                        <span className="font-bold text-sm">{wish.likes.length}</span>
                      </button>
                    </div>

                    <p className="text-sm text-coffee-600 leading-relaxed mb-3">
                      {wish.reason}
                    </p>

                    {wish.recommendLink && (
                      <a
                        href={wish.recommendLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-3 rounded-lg bg-coffee-50 text-coffee-600 text-xs font-medium hover:bg-coffee-100 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        查看推荐链接
                      </a>
                    )}

                    {wish.adminNote && (
                      <div className="p-3 rounded-xl bg-coffee-50 border border-coffee-100 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-coffee-500 mb-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          管理员备注
                        </div>
                        <p className="text-sm text-coffee-700">{wish.adminNote}</p>
                      </div>
                    )}

                    {isAdmin && wish.status === "pending" && (
                      <div className="flex items-center gap-2 pt-3 border-t border-coffee-50">
                        <button
                          onClick={() => openAdminModal(wish.id, "purchased")}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-matcha-500 text-white text-sm font-medium hover:bg-matcha-600 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          已采购
                        </button>
                        <button
                          onClick={() => openAdminModal(wish.id, "declined")}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-500 text-white text-sm font-medium hover:bg-gray-600 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          暂不采购
                        </button>
                      </div>
                    )}

                    {isCreator && wish.status === "pending" && (
                      <div className="pt-3 border-t border-coffee-50">
                        <p className="text-xs text-coffee-400 text-center">
                          这是您提交的心愿，等待管理员处理中
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="提交心愿"
      >
        <p className="text-sm text-coffee-500 mb-4">分享你希望茶水间新增的物资</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1.5">
              物资名称 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={wishName}
              onChange={(e) => setWishName(e.target.value)}
              placeholder="例如：手冲咖啡壶"
              className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:border-wish-400 focus:ring-2 focus:ring-wish-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1.5">
              推荐链接 <span className="text-coffee-400 text-xs">（可选）</span>
            </label>
            <div className="relative">
              <input
                type="url"
                value={wishLink}
                onChange={(e) => setWishLink(e.target.value)}
                placeholder="https://example.com/product"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-coffee-200 focus:border-wish-400 focus:ring-2 focus:ring-wish-100 outline-none transition-all"
              />
              <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-300" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1.5">
              推荐理由 <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={wishReason}
              onChange={(e) => setWishReason(e.target.value)}
              placeholder="为什么想要这个？有什么特别的好处？"
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:border-wish-400 focus:ring-2 focus:ring-wish-100 outline-none transition-all resize-none"
            />
            <p className="text-xs text-coffee-400 mt-1.5">
              {wishReason.length}/500 字
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-coffee-50 text-coffee-600 font-medium hover:bg-coffee-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-wish-500 to-wish-600 text-white font-medium hover:from-wish-600 hover:to-wish-700 transition-all shadow-soft"
            >
              <Send className="w-4 h-4" />
              提交心愿
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        title={adminAction === "purchased" ? "标记为已采购" : "标记为暂不采购"}
      >
        {selectedWish && (
          <p className="text-sm text-coffee-500 mb-4">心愿：{selectedWish.name}</p>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1.5">
              备注 <span className="text-coffee-400 text-xs">（可选）</span>
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                adminAction === "purchased"
                  ? "例如：已采购，放在储物柜第二层"
                  : "例如：预算有限，下个月再考虑"
              }
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:border-wish-400 focus:ring-2 focus:ring-wish-100 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setAdminModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-coffee-50 text-coffee-600 font-medium hover:bg-coffee-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleAdminAction}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all shadow-soft",
                adminAction === "purchased"
                  ? "bg-gradient-to-r from-matcha-500 to-emerald-500 hover:from-matcha-600 hover:to-emerald-600"
                  : "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
              )}
            >
              {adminAction === "purchased" ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  确认已采购
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  确认暂不采购
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
