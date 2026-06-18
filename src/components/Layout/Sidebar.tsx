import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Package,
  Vote,
  BarChart3,
  Calendar,
  User,
  Coffee,
  ClipboardCheck,
  Users,
  Ticket,
  Shield,
  Megaphone,
  Star,
  CalendarCheck,
  Flame,
  ShoppingCart,
  Trophy,
  Leaf,
  MessageSquare,
} from "lucide-react";
import { useRecyclingStore } from "@/store/useRecyclingStore";
import { cn } from "@/lib/utils";
import { useRestockRequestStore } from "@/store/useRestockRequestStore";
import { useUserStore } from "@/store/useUserStore";
import { useWishListStore } from "@/store/useWishListStore";
import { useCheckInStore } from "@/store/useCheckInStore";
import { useMessageBoardStore } from "@/store/useMessageBoardStore";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { getPendingCount } = useRestockRequestStore();
  const { currentUser, getPendingUsers } = useUserStore();
  const { getWishesByStatus } = useWishListStore();
  const { hasCheckedInToday, getStreakDays } = useCheckInStore();
  const { hasRecordedThisWeek } = useRecyclingStore();
  const { getUnviewedSummaryCount } = useMessageBoardStore();
  const pendingCount = getPendingCount();
  const pendingUserCount = getPendingUsers().length;
  const pendingWishCount = getWishesByStatus("pending").length;
  const unviewedSummaryCount = getUnviewedSummaryCount();
  const isAdmin = currentUser?.role === "admin";
  const checkedInToday = currentUser ? hasCheckedInToday(currentUser.id) : false;
  const streakDays = currentUser ? getStreakDays(currentUser.id) : 0;
  const recyclingPending = !hasRecordedThisWeek();
  const messageBoardBadge = isAdmin ? unviewedSummaryCount : 0;

  const navItems = [
    { path: "/", label: "首页", icon: Home },
    { path: "/checkin", label: "每日签到", icon: CalendarCheck, badge: !checkedInToday ? 1 : 0, streak: streakDays },
    { path: "/inventory", label: "库存管理", icon: Package },
    ...(isAdmin || pendingCount > 0
      ? [{ path: "/restock-approval", label: "补货审批", icon: ClipboardCheck, badge: pendingCount }]
      : []),
    { path: "/group-purchase", label: "团队拼单", icon: Users },
    { path: "/group-buy", label: "团购预约", icon: ShoppingCart },
    { path: "/vote", label: "我想喝什么", icon: Vote },
    { path: "/wishlist", label: "心愿单", icon: Star, badge: isAdmin ? pendingWishCount : 0 },
    { path: "/message-board", label: "留言板", icon: MessageSquare, badge: messageBoardBadge },
    { path: "/leaderboard", label: "积分排行", icon: Trophy },
    { path: "/stats", label: "消耗统计", icon: BarChart3 },
    { path: "/duty", label: "采购轮值", icon: Calendar },
    { path: "/recycling", label: "环保回收", icon: Leaf, badge: recyclingPending ? 1 : 0 },
    { path: "/announcements", label: "公告通知", icon: Megaphone },
    ...(isAdmin
      ? [
          { path: "/invitations", label: "邀请码管理", icon: Ticket },
          { path: "/users", label: "用户管理", icon: Shield, badge: pendingUserCount },
        ]
      : []),
    { path: "/profile", label: "个人中心", icon: User },
  ];

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white shadow-large z-50",
          "lg:translate-x-0 lg:static lg:z-0",
          "flex flex-col"
        )}
      >
        <div className="p-6 border-b border-coffee-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coffee-600 to-coffee-800 flex items-center justify-center">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-coffee-800">咖啡角</h1>
              <p className="text-xs text-coffee-400">共享饮品追踪</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-coffee-700 text-white shadow-soft"
                        : "text-coffee-600 hover:bg-coffee-50 hover:text-coffee-800"
                    )}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {"streak" in item && item.streak >= 3 && !isActive && (
                        <Flame className="w-3 h-3 text-orange-500 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <span className="font-medium">{item.label}</span>
                    {"badge" in item && item.badge > 0 && (
                      <span
                        className={cn(
                          "ml-auto px-2 py-0.5 text-xs font-bold rounded-full",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-danger-500 text-white"
                        )}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                    {"streak" in item && item.streak > 0 && !("badge" in item && item.badge > 0) && isActive && (
                      <span className="ml-auto flex items-center gap-0.5 px-2 py-0.5 bg-white/20 text-white text-xs font-bold rounded-full">
                        <Flame className="w-3 h-3" />
                        {item.streak}
                      </span>
                    )}
                    {isActive && !(("badge" in item && item.badge > 0) || ("streak" in item && item.streak > 0)) && (
                      <motion.span
                        layoutId="activeIndicator"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                      />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-coffee-100">
          <div className="p-4 bg-gradient-to-r from-cream-100 to-cream-50 rounded-xl">
            <p className="text-sm text-coffee-600 font-medium">☕ 今日小贴士</p>
            <p className="text-xs text-coffee-500 mt-1">
              喝咖啡可以提高专注力，但下午3点后尽量少喝哦~
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
