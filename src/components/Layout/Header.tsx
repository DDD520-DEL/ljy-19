import { useState } from "react";
import { Menu, Bell, User } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useMaterialStore } from "@/store/useMaterialStore";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { currentUser } = useUserStore();
  const { getLowStockMaterials } = useMaterialStore();
  const lowStockMaterials = getLowStockMaterials();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-coffee-100">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-coffee-50 transition-colors"
          >
            <Menu className="w-5 h-5 text-coffee-600" />
          </button>

          <div>
            <h2 className="text-lg font-bold text-coffee-800">欢迎回来 👋</h2>
            <p className="text-sm text-coffee-400 hidden sm:block">
              今天想喝点什么？
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-coffee-50 transition-colors relative">
              <Bell className="w-5 h-5 text-coffee-600" />
              {lowStockMaterials.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full animate-pulse-soft" />
              )}
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-coffee-50 transition-colors"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-coffee-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-coffee-600" />
                </div>
              )}
              <span className="text-sm font-medium text-coffee-700 hidden sm:block">
                {currentUser?.name}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-medium border border-coffee-100 py-2 animate-slide-down">
                <div className="px-4 py-2 border-b border-coffee-50">
                  <p className="font-medium text-coffee-800">{currentUser?.name}</p>
                  <p className="text-xs text-coffee-400">
                    {currentUser?.role === "admin" ? "管理员" : "普通成员"}
                  </p>
                </div>
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-4 py-2 text-sm text-coffee-600 hover:bg-coffee-50 transition-colors"
                >
                  个人中心
                </button>
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="w-full text-left px-4 py-2 text-sm text-danger-500 hover:bg-danger-50 transition-colors"
                >
                  切换用户
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
