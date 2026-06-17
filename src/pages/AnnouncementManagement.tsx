import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pin,
  PinOff,
  Archive,
  Trash2,
  Edit,
  Eye,
  Calendar,
  User,
  Search,
  Filter,
  X,
  Megaphone,
  ChevronDown,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import Toast from "@/components/Toast/Toast";
import { ToastType } from "@/components/Toast/Toast";
import { useAnnouncementStore } from "@/store/useAnnouncementStore";
import { useUserStore } from "@/store/useUserStore";
import {
  type Announcement,
  type AnnouncementType,
  type AnnouncementStatus,
  announcementTypeLabels,
  announcementTypeColors,
} from "@/types";
import { cn } from "@/lib/utils";
import { formatDate, timeAgo } from "@/utils/date";

type FilterTab = "all" | "active" | "expired" | "archived";

export default function AnnouncementManagement() {
  const {
    getAllAnnouncements,
    getActiveAnnouncements,
    getExpiredAnnouncements,
    getArchivedAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
    archiveAnnouncement,
    incrementViewCount,
  } = useAnnouncementStore();
  const { currentUser, getUserById } = useUserStore();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "all">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general" as AnnouncementType,
    isPinned: false,
    hasExpiry: false,
    expiresAt: "",
  });

  const isAdmin = currentUser?.role === "admin";

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "全部", count: getAllAnnouncements().length },
    { key: "active", label: "进行中", count: getActiveAnnouncements().length },
    { key: "expired", label: "已过期", count: getExpiredAnnouncements().length },
    { key: "archived", label: "已归档", count: getArchivedAnnouncements().length },
  ];

  const getFilteredAnnouncements = (): Announcement[] => {
    let announcements: Announcement[];
    switch (activeTab) {
      case "active":
        announcements = getActiveAnnouncements();
        break;
      case "expired":
        announcements = getExpiredAnnouncements();
        break;
      case "archived":
        announcements = getArchivedAnnouncements();
        break;
      default:
        announcements = getAllAnnouncements();
    }

    if (typeFilter !== "all") {
      announcements = announcements.filter((a) => a.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      announcements = announcements.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.content.toLowerCase().includes(query)
      );
    }

    return announcements;
  };

  const filteredAnnouncements = getFilteredAnnouncements();

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "general",
      isPinned: false,
      hasExpiry: false,
      expiresAt: "",
    });
    setEditingAnnouncement(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      isPinned: announcement.isPinned,
      hasExpiry: !!announcement.expiresAt,
      expiresAt: announcement.expiresAt ? announcement.expiresAt.slice(0, 16) : "",
    });
    setShowCreateModal(true);
  };

  const handleViewDetail = (announcement: Announcement) => {
    incrementViewCount(announcement.id);
    setViewingAnnouncement(announcement);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      showToast("请输入公告标题", "error");
      return;
    }
    if (!formData.content.trim()) {
      showToast("请输入公告内容", "error");
      return;
    }
    if (formData.hasExpiry && !formData.expiresAt) {
      showToast("请选择过期时间", "error");
      return;
    }

    const expiryDate = formData.hasExpiry
      ? new Date(formData.expiresAt).toISOString()
      : undefined;

    if (editingAnnouncement) {
      updateAnnouncement({
        id: editingAnnouncement.id,
        title: formData.title,
        content: formData.content,
        type: formData.type,
        isPinned: formData.isPinned,
        expiresAt: expiryDate,
      });
      showToast("公告更新成功", "success");
    } else {
      createAnnouncement({
        title: formData.title,
        content: formData.content,
        type: formData.type,
        isPinned: formData.isPinned,
        createdBy: currentUser!.id,
        expiresAt: expiryDate,
      });
      showToast("公告发布成功", "success");
    }

    setShowCreateModal(false);
    resetForm();
  };

  const handleTogglePin = (id: string) => {
    const announcement = getAllAnnouncements().find((a) => a.id === id);
    const wasPinned = announcement?.isPinned;
    togglePin(id);
    showToast(wasPinned ? "已取消置顶" : "已置顶", "success");
  };

  const handleArchive = (id: string) => {
    archiveAnnouncement(id);
    showToast("已归档公告", "success");
  };

  const handleDelete = (id: string) => {
    deleteAnnouncement(id);
    setDeleteConfirmId(null);
    showToast("已删除公告", "success");
  };

  const getStatusLabel = (status: AnnouncementStatus) => {
    switch (status) {
      case "active":
        return { label: "进行中", color: "text-green-600 bg-green-100" };
      case "expired":
        return { label: "已过期", color: "text-gray-600 bg-gray-100" };
      case "archived":
        return { label: "已归档", color: "text-blue-600 bg-blue-100" };
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-coffee-800">公告管理</h1>
          <p className="text-sm text-coffee-500 mt-1">管理茶水间公告通知</p>
        </div>
        {isAdmin && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-coffee-700 text-white rounded-xl font-medium hover:bg-coffee-800 transition-colors shadow-soft"
          >
            <Plus className="w-5 h-5" />
            发布公告
          </motion.button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200",
                activeTab === tab.key
                  ? "bg-coffee-700 text-white shadow-soft"
                  : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-bold rounded-full",
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-white text-coffee-600"
                )}
              >
                {tab.count}
              </span>
            </motion.button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-coffee-400" />
            <input
              type="text"
              placeholder="搜索公告..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-coffee-400 hover:text-coffee-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 border border-coffee-200 rounded-xl hover:bg-coffee-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-coffee-500" />
              <span className="text-sm text-coffee-700">
                {typeFilter === "all" ? "全部类型" : announcementTypeLabels[typeFilter]}
              </span>
              <ChevronDown className="w-4 h-4 text-coffee-400" />
            </button>

            <AnimatePresence>
              {showFilterDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-large border border-coffee-100 py-1 z-10 min-w-[140px]"
                >
                  {(["all", "general", "stock", "maintenance", "holiday"] as const).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setTypeFilter(type);
                          setShowFilterDropdown(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm hover:bg-coffee-50 transition-colors",
                          typeFilter === type
                            ? "text-coffee-700 font-medium bg-coffee-50"
                            : "text-coffee-600"
                        )}
                      >
                        {type === "all" ? "全部类型" : announcementTypeLabels[type]}
                      </button>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-coffee-300 mx-auto mb-3" />
            <p className="text-coffee-400">暂无公告</p>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filteredAnnouncements.map((announcement) => {
              const typeColor = announcementTypeColors[announcement.type];
              const creator = getUserById(announcement.createdBy);
              const statusInfo = getStatusLabel(announcement.status);

              return (
                <motion.div
                  key={announcement.id}
                  variants={item}
                  className="p-4 bg-coffee-50/50 rounded-xl border border-coffee-100 hover:shadow-soft transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {announcement.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                            <Pin className="w-3 h-3" />
                            置顶
                          </span>
                        )}
                        <span
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: typeColor + "20",
                            color: typeColor,
                          }}
                        >
                          {announcementTypeLabels[announcement.type]}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
                            statusInfo.color
                          )}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <h3 className="font-semibold text-coffee-800 mb-1 line-clamp-1">
                        {announcement.title}
                      </h3>
                      <p className="text-sm text-coffee-500 line-clamp-2 mb-3">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-coffee-400 flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{creator?.name || "未知"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{timeAgo(announcement.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{announcement.viewCount} 阅读</span>
                        </div>
                        {announcement.expiresAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              至 {formatDate(announcement.expiresAt, "YYYY-MM-DD")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleViewDetail(announcement)}
                        className="p-2 text-coffee-500 hover:bg-coffee-100 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleTogglePin(announcement.id)}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              announcement.isPinned
                                ? "text-amber-600 hover:bg-amber-50"
                                : "text-coffee-500 hover:bg-coffee-100"
                            )}
                            title={announcement.isPinned ? "取消置顶" : "置顶"}
                          >
                            {announcement.isPinned ? (
                              <PinOff className="w-4 h-4" />
                            ) : (
                              <Pin className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(announcement)}
                            className="p-2 text-coffee-500 hover:bg-coffee-100 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {announcement.status === "active" && (
                            <button
                              onClick={() => handleArchive(announcement.id)}
                              className="p-2 text-coffee-500 hover:bg-coffee-100 rounded-lg transition-colors"
                              title="归档"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirmId(announcement.id)}
                            className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title={editingAnnouncement ? "编辑公告" : "发布公告"}
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1.5">
              公告标题 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入公告标题"
              className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-400 transition-all"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1.5">
              公告类型
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  "general",
                  "stock",
                  "maintenance",
                  "holiday",
                ] as AnnouncementType[]
              ).map((type) => (
                <button
                  key={type}
                  onClick={() => setFormData({ ...formData, type })}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    formData.type === type
                      ? "bg-coffee-700 text-white shadow-soft"
                      : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
                  )}
                >
                  {announcementTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1.5">
              公告内容 <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="请输入公告内容..."
              rows={5}
              className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-400 transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPinned"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="w-4 h-4 text-coffee-600 rounded focus:ring-coffee-500"
            />
            <label htmlFor="isPinned" className="text-sm text-coffee-700">
              置顶公告
            </label>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                id="hasExpiry"
                checked={formData.hasExpiry}
                onChange={(e) =>
                  setFormData({ ...formData, hasExpiry: e.target.checked })
                }
                className="w-4 h-4 text-coffee-600 rounded focus:ring-coffee-500"
              />
              <label htmlFor="hasExpiry" className="text-sm text-coffee-700">
                设置过期时间
              </label>
            </div>
            {formData.hasExpiry && (
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500/30 focus:border-coffee-400 transition-all"
              />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2.5 border border-coffee-200 text-coffee-600 rounded-xl font-medium hover:bg-coffee-50 transition-colors"
            >
              取消
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 bg-coffee-700 text-white rounded-xl font-medium hover:bg-coffee-800 transition-colors"
            >
              {editingAnnouncement ? "保存修改" : "发布公告"}
            </motion.button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!viewingAnnouncement}
        onClose={() => setViewingAnnouncement(null)}
        title="公告详情"
        className="max-w-lg"
      >
        {viewingAnnouncement && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {viewingAnnouncement.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                  <Pin className="w-3 h-3" />
                  置顶
                </span>
              )}
              <span
                className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: announcementTypeColors[viewingAnnouncement.type] + "20",
                  color: announcementTypeColors[viewingAnnouncement.type],
                }}
              >
                {announcementTypeLabels[viewingAnnouncement.type]}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full",
                  getStatusLabel(viewingAnnouncement.status).color
                )}
              >
                {getStatusLabel(viewingAnnouncement.status).label}
              </span>
            </div>

            <h2 className="text-xl font-bold text-coffee-800">
              {viewingAnnouncement.title}
            </h2>

            <div className="flex items-center gap-4 text-sm text-coffee-500 flex-wrap">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{getUserById(viewingAnnouncement.createdBy)?.name || "未知"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{timeAgo(viewingAnnouncement.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                <span>{viewingAnnouncement.viewCount} 次阅读</span>
              </div>
            </div>

            {viewingAnnouncement.expiresAt && (
              <div
                className="p-3 rounded-xl text-sm"
                style={{
                  backgroundColor:
                    announcementTypeColors[viewingAnnouncement.type] + "10",
                }}
              >
                <span
                  className="font-medium"
                  style={{ color: announcementTypeColors[viewingAnnouncement.type] }}
                >
                  有效期至：
                </span>
                <span className="text-coffee-700 ml-1">
                  {formatDate(viewingAnnouncement.expiresAt, "YYYY-MM-DD HH:mm")}
                </span>
              </div>
            )}

            <div className="bg-coffee-50 rounded-xl p-4">
              <p className="text-coffee-700 whitespace-pre-wrap leading-relaxed">
                {viewingAnnouncement.content}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="确认删除"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-coffee-600">确定要删除这条公告吗？此操作不可撤销。</p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 px-4 py-2.5 border border-coffee-200 text-coffee-600 rounded-xl font-medium hover:bg-coffee-50 transition-colors"
            >
              取消
            </button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="flex-1 px-4 py-2.5 bg-danger-500 text-white rounded-xl font-medium hover:bg-danger-600 transition-colors"
            >
              确认删除
            </motion.button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
