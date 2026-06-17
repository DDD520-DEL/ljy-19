import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, ChevronLeft, ChevronRight, Pin } from "lucide-react";
import { useAnnouncementStore } from "@/store/useAnnouncementStore";
import { announcementTypeColors, announcementTypeLabels, type Announcement } from "@/types";
import { cn } from "@/lib/utils";
import { formatDate, timeAgo } from "@/utils/date";

interface AnnouncementBannerProps {
  onViewDetail?: (announcement: Announcement) => void;
}

export default function AnnouncementBanner({ onViewDetail }: AnnouncementBannerProps) {
  const { getActiveAnnouncements, incrementViewCount } = useAnnouncementStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const activeAnnouncements = getActiveAnnouncements();
  const hasAnnouncements = activeAnnouncements.length > 0;

  useEffect(() => {
    if (!hasAnnouncements || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeAnnouncements.length, hasAnnouncements, isPaused]);

  const goToPrev = () => {
    if (!hasAnnouncements) return;
    setCurrentIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
  };

  const goToNext = () => {
    if (!hasAnnouncements) return;
    setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
  };

  const handleClick = (announcement: Announcement) => {
    incrementViewCount(announcement.id);
    onViewDetail?.(announcement);
  };

  if (!hasAnnouncements) return null;

  const currentAnnouncement = activeAnnouncements[currentIndex];
  const typeColor = announcementTypeColors[currentAnnouncement.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-soft p-4 mb-6 border border-coffee-100"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: typeColor + "20" }}
        >
          <Megaphone className="w-5 h-5" style={{ color: typeColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-coffee-800 truncate">公告通知</h3>
            {activeAnnouncements.length > 1 && (
              <span className="text-xs text-coffee-400">
                {currentIndex + 1} / {activeAnnouncements.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAnnouncement.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="cursor-pointer"
            onClick={() => handleClick(currentAnnouncement)}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {currentAnnouncement.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                      <Pin className="w-3 h-3" />
                      置顶
                    </span>
                  )}
                  <span
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{ backgroundColor: typeColor + "20", color: typeColor }}
                  >
                    {announcementTypeLabels[currentAnnouncement.type]}
                  </span>
                </div>
                <h4 className="font-semibold text-coffee-800 mb-1 truncate">
                  {currentAnnouncement.title}
                </h4>
                <p className="text-sm text-coffee-500 line-clamp-2">
                  {currentAnnouncement.content}
                </p>
                <p className="text-xs text-coffee-400 mt-2">
                  {timeAgo(currentAnnouncement.createdAt)}
                  {currentAnnouncement.expiresAt && (
                    <span className="ml-3">
                      有效期至 {formatDate(currentAnnouncement.expiresAt, "YYYY-MM-DD")}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {activeAnnouncements.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-8 h-8 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-coffee-600 hover:bg-coffee-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-8 h-8 bg-white/90 backdrop-blur rounded-full shadow-md flex items-center justify-center text-coffee-600 hover:bg-coffee-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {activeAnnouncements.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {activeAnnouncements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "bg-coffee-600 w-4"
                  : "bg-coffee-200 hover:bg-coffee-300"
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
