import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Heart,
  MessageSquare,
  Send,
  Filter,
  Pin,
  PinOff,
  Reply,
  Trash2,
  User,
  Clock,
  BarChart3,
  Sparkles,
  TrendingUp,
  Eye,
  CheckCircle,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useMessageBoardStore } from "@/store/useMessageBoardStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import { timeAgo, formatDate } from "@/utils/date";
import type { MessageType, MessageSortBy } from "@/types";
import {
  messageTypeLabels,
  messageTypeColors,
  messageTypeIcons,
} from "@/types";

export default function MessageBoard() {
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const [messageType, setMessageType] = useState<MessageType>("suggestion");
  const [messageContent, setMessageContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  const [activeFilter, setActiveFilter] = useState<MessageType | "all">("all");
  const [sortBy, setSortBy] = useState<MessageSortBy>("latest");

  const {
    messages,
    addMessage,
    toggleLike,
    hasUserLiked,
    pinMessage,
    unpinMessage,
    replyToMessage,
    deleteMessage,
    getMessages,
    getWeeklySummary,
    getUnviewedSummaryCount,
    markSummaryAsViewed,
  } = useMessageBoardStore();

  const { currentUser } = useUserStore();
  const isAdmin = currentUser?.role === "admin";
  const unviewedSummaryCount = getUnviewedSummaryCount();
  const weeklySummary = getWeeklySummary();

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const filteredMessages = useMemo(() => {
    return getMessages(sortBy, activeFilter);
  }, [messages, activeFilter, sortBy, getMessages]);

  const stats = useMemo(() => {
    const messageList = messages || [];
    return {
      total: messageList.length,
      suggestion: messageList.filter((m) => m.type === "suggestion").length,
      complaint: messageList.filter((m) => m.type === "complaint").length,
      thanks: messageList.filter((m) => m.type === "thanks").length,
      totalLikes: messageList.reduce((sum, m) => sum + m.likes.length, 0),
      pinned: messageList.filter((m) => m.isPinned).length,
    };
  }, [messages]);

  const handleSubmit = () => {
    if (!currentUser) return;

    if (!messageContent.trim()) {
      showToast("请输入留言内容", "error");
      return;
    }

    if (messageContent.trim().length < 5) {
      showToast("留言内容至少需要 5 个字", "error");
      return;
    }

    addMessage(
      messageType,
      messageContent.trim(),
      isAnonymous,
      currentUser.id,
      currentUser.name,
      currentUser.avatar
    );

    showToast("留言发布成功！", "success");
    setPostModalOpen(false);
    setMessageContent("");
    setIsAnonymous(false);
    setMessageType("suggestion");
  };

  const handleLike = (messageId: string) => {
    if (!currentUser) {
      showToast("请先登录", "error");
      return;
    }
    toggleLike(messageId, currentUser.id);
  };

  const handlePin = (messageId: string, isPinned: boolean) => {
    if (isPinned) {
      unpinMessage(messageId);
      showToast("已取消置顶", "success");
    } else {
      pinMessage(messageId);
      showToast("已置顶该留言", "success");
    }
  };

  const openReplyModal = (messageId: string) => {
    setSelectedMessageId(messageId);
    setReplyContent("");
    setReplyModalOpen(true);
  };

  const handleReply = () => {
    if (!currentUser || !selectedMessageId) return;

    if (!replyContent.trim()) {
      showToast("请输入回复内容", "error");
      return;
    }

    replyToMessage(selectedMessageId, replyContent.trim(), currentUser.id, currentUser.name);
    showToast("回复成功！", "success");
    setReplyModalOpen(false);
    setSelectedMessageId(null);
    setReplyContent("");
  };

  const handleDelete = (messageId: string) => {
    if (confirm("确定要删除这条留言吗？")) {
      deleteMessage(messageId);
      showToast("已删除留言", "success");
    }
  };

  const openSummaryModal = () => {
    setSummaryModalOpen(true);
    if (weeklySummary && !weeklySummary.viewedByAdmin) {
      markSummaryAsViewed(weeklySummary.id);
    }
  };

  const filterTabs = [
    { key: "all" as const, label: "全部", count: stats.total },
    { key: "suggestion" as const, label: "建议", count: stats.suggestion },
    { key: "complaint" as const, label: "吐槽", count: stats.complaint },
    { key: "thanks" as const, label: "感谢", count: stats.thanks },
  ];

  const sortOptions: { value: MessageSortBy; label: string }[] = [
    { value: "latest", label: "最新发布" },
    { value: "popular", label: "最多点赞" },
    { value: "oldest", label: "最早发布" },
  ];

  const selectedMessage = selectedMessageId
    ? messages.find((m) => m.id === selectedMessageId)
    : null;

  useEffect(() => {
    if (weeklySummary && isAdmin && unviewedSummaryCount > 0) {
      setTimeout(() => {
        showToast(`有 ${unviewedSummaryCount} 份新的每周留言汇总待查看`, "success");
      }, 1000);
    }
  }, []);

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
          <h1 className="text-2xl font-bold text-coffee-800">茶水间留言板</h1>
          <p className="text-coffee-500 text-sm mt-1">
            {isAdmin
              ? "管理留言，回复用户，查看每周汇总"
              : "匿名或实名留言，分享你的想法和建议"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={openSummaryModal}
              className="relative flex items-center gap-2 px-4 py-2.5 bg-white border border-coffee-200 text-coffee-700 rounded-xl hover:bg-coffee-50 transition-colors font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              <span>每周汇总</span>
              {unviewedSummaryCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unviewedSummaryCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setPostModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-coffee-600 to-coffee-800 text-white rounded-xl shadow-soft hover:from-coffee-700 hover:to-coffee-900 transition-all font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>发布留言</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl shadow-soft p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-coffee-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-coffee-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-coffee-800">{stats.total}</p>
              <p className="text-xs text-coffee-500">总留言数</p>
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
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <span className="text-xl">{messageTypeIcons.suggestion}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.suggestion}</p>
              <p className="text-xs text-coffee-500">建议</p>
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
            <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
              <span className="text-xl">{messageTypeIcons.complaint}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.complaint}</p>
              <p className="text-xs text-coffee-500">吐槽</p>
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
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
              <span className="text-xl">{messageTypeIcons.thanks}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.thanks}</p>
              <p className="text-xs text-coffee-500">感谢</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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
                    ? "bg-coffee-700 text-white shadow-soft"
                    : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
                )}
              >
                {tab.key !== "all" && (
                  <span>{messageTypeIcons[tab.key as MessageType]}</span>
                )}
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
              onChange={(e) => setSortBy(e.target.value as MessageSortBy)}
              className="px-3 py-1.5 rounded-lg bg-coffee-50 text-coffee-700 text-sm border-0 focus:ring-2 focus:ring-coffee-400 cursor-pointer"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft p-16 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-coffee-50 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-coffee-400" />
          </div>
          <h3 className="text-lg font-bold text-coffee-800 mb-2">还没有留言</h3>
          <p className="text-coffee-500 mb-6">
            {activeFilter === "all"
              ? "成为第一个留言的人吧！"
              : `当前没有${messageTypeLabels[activeFilter as MessageType]}类型的留言`}
          </p>
          <button
            onClick={() => setPostModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coffee-600 text-white rounded-xl hover:bg-coffee-700 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>发布留言</span>
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredMessages.map((message, index) => {
              const isLiked = currentUser ? hasUserLiked(message.id, currentUser.id) : false;
              const isOwnMessage = currentUser?.id === message.userId;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                  className={cn(
                    "bg-white rounded-2xl shadow-soft overflow-hidden transition-all",
                    message.isPinned && "ring-2 ring-amber-400"
                  )}
                >
                  {message.isPinned && (
                    <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1.5 flex items-center gap-2">
                      <Pin className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-bold text-white">置顶留言</span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {message.isAnonymous ? (
                          <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-coffee-400" />
                          </div>
                        ) : message.userAvatar ? (
                          <img
                            src={message.userAvatar}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-coffee-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium text-white flex-shrink-0"
                              style={{ backgroundColor: messageTypeColors[message.type] }}
                            >
                              {messageTypeIcons[message.type]} {messageTypeLabels[message.type]}
                            </span>
                            <h3 className="font-bold text-coffee-800">
                              {message.isAnonymous ? "匿名用户" : message.userName}
                            </h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-coffee-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {timeAgo(message.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handlePin(message.id, message.isPinned)}
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                message.isPinned
                                  ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                                  : "bg-coffee-50 text-coffee-400 hover:bg-coffee-100"
                              )}
                              title={message.isPinned ? "取消置顶" : "置顶"}
                            >
                              {message.isPinned ? (
                                <PinOff className="w-4 h-4" />
                              ) : (
                                <Pin className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openReplyModal(message.id)}
                              className="p-2 rounded-lg bg-coffee-50 text-coffee-400 hover:bg-coffee-100 transition-colors"
                              title="回复"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(message.id)}
                              className="p-2 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {isOwnMessage && !isAdmin && (
                          <button
                            onClick={() => handleDelete(message.id)}
                            className="p-2 rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-100 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-coffee-700 leading-relaxed mb-4 whitespace-pre-wrap">
                      {message.content}
                    </p>

                    {message.reply && (
                      <div className="p-4 rounded-xl bg-coffee-50 border border-coffee-100 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg bg-coffee-600 flex items-center justify-center">
                            <Reply className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-sm font-bold text-coffee-700">
                            管理员 {message.reply.adminName} 回复
                          </span>
                          <span className="text-xs text-coffee-400">
                            {timeAgo(message.reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-coffee-600 leading-relaxed">
                          {message.reply.content}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-coffee-50">
                      <button
                        onClick={() => handleLike(message.id)}
                        disabled={!currentUser}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all",
                          isLiked
                            ? "bg-rose-500 text-white shadow-soft"
                            : "bg-rose-50 text-rose-600 hover:bg-rose-100",
                          !currentUser && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                        <span className="font-bold text-sm">{message.likes.length}</span>
                      </button>

                      {isAdmin && !message.reply && (
                        <button
                          onClick={() => openReplyModal(message.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-coffee-50 text-coffee-600 hover:bg-coffee-100 transition-colors text-sm font-medium"
                        >
                          <Reply className="w-4 h-4" />
                          <span>回复</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        title="发布留言"
      >
        <p className="text-sm text-coffee-500 mb-4">
          分享你对茶水间的建议、吐槽或感谢
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">
              留言类型 <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["suggestion", "complaint", "thanks"] as MessageType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMessageType(type)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all",
                    messageType === type
                      ? "border-coffee-600 bg-coffee-50"
                      : "border-coffee-100 hover:border-coffee-200"
                  )}
                >
                  <span className="text-2xl">{messageTypeIcons[type]}</span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      messageType === type ? "text-coffee-700" : "text-coffee-500"
                    )}
                  >
                    {messageTypeLabels[type]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1.5">
              留言内容 <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="请输入你的留言内容..."
              rows={5}
              maxLength={500}
              className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100 outline-none transition-all resize-none"
            />
            <p className="text-xs text-coffee-400 mt-1.5 text-right">
              {messageContent.length}/500 字
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-coffee-50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-coffee-300 text-coffee-600 focus:ring-coffee-400"
              />
              <label htmlFor="anonymous" className="text-sm text-coffee-600 cursor-pointer">
                匿名发布
              </label>
            </div>
            {!isAnonymous && currentUser && (
              <div className="flex items-center gap-2">
                {currentUser.avatar && (
                  <img
                    src={currentUser.avatar}
                    alt=""
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span className="text-sm text-coffee-600">
                  将以 {currentUser.name} 发布
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setPostModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-coffee-50 text-coffee-600 font-medium hover:bg-coffee-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-coffee-600 to-coffee-800 text-white font-medium hover:from-coffee-700 hover:to-coffee-900 transition-all shadow-soft"
            >
              <Send className="w-4 h-4" />
              发布留言
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={replyModalOpen}
        onClose={() => setReplyModalOpen(false)}
        title="回复留言"
      >
        {selectedMessage && (
          <>
            <div className="p-4 rounded-xl bg-coffee-50 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: messageTypeColors[selectedMessage.type] }}
                >
                  {messageTypeLabels[selectedMessage.type]}
                </span>
                <span className="text-sm text-coffee-500">
                  {selectedMessage.isAnonymous ? "匿名用户" : selectedMessage.userName}
                </span>
              </div>
              <p className="text-sm text-coffee-700">{selectedMessage.content}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-1.5">
                  回复内容 <span className="text-danger-500">*</span>
                </label>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="请输入回复内容..."
                  rows={4}
                  maxLength={300}
                  className="w-full px-4 py-2.5 rounded-xl border border-coffee-200 focus:border-coffee-400 focus:ring-2 focus:ring-coffee-100 outline-none transition-all resize-none"
                />
                <p className="text-xs text-coffee-400 mt-1.5 text-right">
                  {replyContent.length}/300 字
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setReplyModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-coffee-50 text-coffee-600 font-medium hover:bg-coffee-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleReply}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-coffee-600 to-coffee-800 text-white font-medium hover:from-coffee-700 hover:to-coffee-900 transition-all shadow-soft"
                >
                  <Send className="w-4 h-4" />
                  发送回复
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        title="每周留言汇总"
        className="max-w-2xl"
      >
        {weeklySummary ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-coffee-500">统计周期</p>
                <p className="font-bold text-coffee-800">
                  {formatDate(weeklySummary.weekStart, "YYYY-MM-DD")} ~{" "}
                  {formatDate(weeklySummary.weekEnd, "YYYY-MM-DD")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-coffee-500">本周留言数</p>
                <p className="text-2xl font-bold text-coffee-800">
                  {weeklySummary.totalMessages}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-coffee-600" />
                <h3 className="font-bold text-coffee-800">热门关键词 TOP10</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {weeklySummary.keywords.length > 0 ? (
                  weeklySummary.keywords.map((item, index) => (
                    <motion.div
                      key={item.word}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "px-4 py-2 rounded-full font-medium",
                        index === 0
                          ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
                          : index === 1
                          ? "bg-gradient-to-r from-gray-300 to-gray-400 text-white"
                          : index === 2
                          ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white"
                          : "bg-coffee-100 text-coffee-700"
                      )}
                    >
                      <span className="mr-1">#{index + 1}</span>
                      {item.word}
                      <span className="ml-1 opacity-75">({item.count})</span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-coffee-400 text-sm">暂无关键词数据</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-coffee-600" />
                <h3 className="font-bold text-coffee-800">高赞留言 TOP3</h3>
              </div>
              <div className="space-y-3">
                {weeklySummary.topMessages.length > 0 ? (
                  weeklySummary.topMessages.map((item, index) => (
                    <div
                      key={item.messageId}
                      className="p-4 rounded-xl bg-coffee-50 flex items-start gap-3"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white",
                          index === 0
                            ? "bg-gradient-to-br from-amber-400 to-orange-500"
                            : index === 1
                            ? "bg-gradient-to-br from-gray-300 to-gray-400"
                            : "bg-gradient-to-br from-amber-600 to-amber-700"
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-coffee-700 leading-relaxed">
                          {item.content}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-coffee-400">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                          <span>{item.likes} 人点赞</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-coffee-400 text-sm">暂无高赞留言</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-coffee-100">
              <button
                onClick={() => setSummaryModalOpen(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-coffee-600 to-coffee-800 text-white font-medium hover:from-coffee-700 hover:to-coffee-900 transition-all shadow-soft"
              >
                <CheckCircle className="w-4 h-4" />
                我知道了
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 text-coffee-300 mx-auto mb-3" />
            <p className="text-coffee-500">本周还没有留言数据</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
