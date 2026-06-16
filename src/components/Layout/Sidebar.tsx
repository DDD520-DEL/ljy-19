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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "首页", icon: Home },
  { path: "/inventory", label: "库存管理", icon: Package },
  { path: "/vote", label: "我想喝什么", icon: Vote },
  { path: "/stats", label: "消耗统计", icon: BarChart3 },
  { path: "/duty", label: "采购轮值", icon: Calendar },
  { path: "/profile", label: "个人中心", icon: User },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

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
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
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
