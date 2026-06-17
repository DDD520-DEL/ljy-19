import { motion } from "framer-motion";
import { Pin, Eye, Calendar, User } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import { useUserStore } from "@/store/useUserStore";
import {
  announcementTypeColors,
  announcementTypeLabels,
  type Announcement,
} from "@/types";
import { formatDate, timeAgo } from "@/utils/date";

interface AnnouncementDetailProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

export default function AnnouncementDetail({
  isOpen,
  onClose,
  announcement,
}: AnnouncementDetailProps) {
  const { getUserById } = useUserStore();

  if (!announcement) return null;

  const typeColor = announcementTypeColors[announcement.type];
  const creator = getUserById(announcement.createdBy);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: typeColor + "20" }}
          >
            <span className="text-2xl">📢</span>
          </div>
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
                style={{ backgroundColor: typeColor + "20", color: typeColor }}
              >
                {announcementTypeLabels[announcement.type]}
              </span>
              {announcement.status === "expired" && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  已过期
                </span>
              )}
              {announcement.status === "archived" && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  已归档
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-coffee-800 leading-tight">
              {announcement.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-coffee-500 flex-wrap">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>{creator?.name || "未知用户"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{timeAgo(announcement.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            <span>{announcement.viewCount} 次阅读</span>
          </div>
        </div>

        {announcement.expiresAt && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{ backgroundColor: typeColor + "10" }}
          >
            <span className="font-medium" style={{ color: typeColor }}>
              有效期至：
            </span>
            <span className="text-coffee-700 ml-1">
              {formatDate(announcement.expiresAt, "YYYY-MM-DD HH:mm")}
            </span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-coffee-50 rounded-xl p-4"
        >
          <p className="text-coffee-700 whitespace-pre-wrap leading-relaxed">
            {announcement.content}
          </p>
        </motion.div>
      </div>
    </Modal>
  );
}
