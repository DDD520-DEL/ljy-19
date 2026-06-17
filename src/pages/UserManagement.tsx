import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  Clock,
  Shield,
  ShieldAlert,
  DollarSign,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  UserPlus,
  Edit3,
  Save,
  X,
  ChevronDown,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import Toast from "@/components/Toast/Toast";
import Empty from "@/components/Empty";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/utils/date";
import type { User, UserStatus } from "@/types";

type ToastState = {
  isVisible: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
};

type TabType = "pending" | "all";

export default function UserManagement() {
  const {
    currentUser,
    users,
    getPendingUsers,
    approveUser,
    updateUserRole,
    updateUserBudget,
    initUsers,
  } = useUserStore();

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState<number>(0);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    initUsers();
  }, [initUsers]);

  const pendingUsers = getPendingUsers();
  const allUsers = [...users].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "pending" ? -1 : 1;
    }
    return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
  });

  const displayUsers = activeTab === "pending" ? pendingUsers : allUsers;

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const handleApproveUser = (userId: string, userName: string) => {
    approveUser(userId);
    showToast(`已通过 ${userName} 的注册申请`, "success");
  };

  const handleUpdateRole = (userId: string, role: "user" | "admin", userName: string) => {
    updateUserRole(userId, role);
    setShowRoleMenu(null);
    showToast(
      `已将 ${userName} 设置为${role === "admin" ? "管理员" : "普通成员"}`,
      "success"
    );
  };

  const handleStartEditBudget = (user: User) => {
    setEditingUserId(user.id);
    setEditBudget(user.monthlyBudget);
  };

  const handleSaveBudget = (userId: string, userName: string) => {
    if (editBudget < 0) {
      showToast("预算不能为负数", "error");
      return;
    }
    updateUserBudget(userId, editBudget);
    setEditingUserId(null);
    showToast(`已更新 ${userName} 的月度预算`, "success");
  };

  const handleCancelEditBudget = () => {
    setEditingUserId(null);
  };

  const statusConfig: Record<
    UserStatus,
    { label: string; icon: typeof Clock; className: string; dotClass: string }
  > = {
    pending: {
      label: "待审核",
      icon: Clock,
      className: "text-amber-600 bg-amber-50",
      dotClass: "bg-amber-500",
    },
    active: {
      label: "已激活",
      icon: CheckCircle,
      className: "text-matcha-600 bg-matcha-50",
      dotClass: "bg-matcha-500",
    },
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-danger-50 flex items-center justify-center mb-4">
          <XCircle className="w-10 h-10 text-danger-400" />
        </div>
        <h2 className="text-xl font-bold text-coffee-800 mb-2">无权限访问</h2>
        <p className="text-coffee-500">仅管理员可以查看用户管理页面</p>
      </div>
    );
  }

  return (
    <div>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-coffee-800">用户管理</h1>
        <p className="text-coffee-500 text-sm mt-1">
          审核新成员申请，管理用户角色和权限
        </p>
      </div>

      {/* 统计卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          {
            label: "总用户数",
            value: users.length,
            icon: Users,
            color: "text-coffee-600",
            bg: "bg-coffee-100",
          },
          {
            label: "待审核",
            value: pendingUsers.length,
            icon: UserPlus,
            color: "text-amber-600",
            bg: "bg-amber-100",
            highlight: pendingUsers.length > 0,
          },
          {
            label: "已激活",
            value: users.filter((u) => u.status === "active").length,
            icon: UserCheck,
            color: "text-matcha-600",
            bg: "bg-matcha-100",
          },
          {
            label: "管理员",
            value: users.filter((u) => u.role === "admin").length,
            icon: Shield,
            color: "text-violet-600",
            bg: "bg-violet-100",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "bg-white rounded-2xl p-5 shadow-soft relative overflow-hidden",
                stat.highlight && "ring-2 ring-amber-300"
              )}
            >
              {stat.highlight && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold">
                    {stat.value}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                  <Icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <span className="text-sm text-coffee-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-coffee-800">{stat.value}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tab 切换 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6"
      >
        {[
          {
            key: "pending",
            label: "待审核",
            count: pendingUsers.length,
            showBadge: pendingUsers.length > 0,
          },
          { key: "all", label: "全部用户", count: users.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              activeTab === tab.key
                ? "bg-coffee-600 text-white shadow-soft"
                : "bg-white text-coffee-600 hover:bg-coffee-50"
            )}
          >
            <span>{tab.label}</span>
            {tab.showBadge && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold",
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-amber-500 text-white"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* 用户列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-soft overflow-hidden"
      >
        {displayUsers.length > 0 ? (
          <div className="divide-y divide-coffee-50">
            {displayUsers.map((user, index) => {
              const statusCfg = statusConfig[user.status];
              const isPending = user.status === "pending";
              const isEditingBudget = editingUserId === user.id;
              const isSelf = currentUser?.id === user.id;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.03 }}
                  className="p-5 hover:bg-coffee-50/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-coffee-100 flex items-center justify-center">
                          <Users className="w-6 h-6 text-coffee-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-bold text-coffee-800 text-lg">
                          {user.name}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                            statusCfg.className
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dotClass)} />
                          {statusCfg.label}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                            user.role === "admin"
                              ? "text-violet-600 bg-violet-50"
                              : "text-coffee-500 bg-coffee-50"
                          )}
                        >
                          {user.role === "admin" ? (
                            <>
                              <Shield className="w-3 h-3" />
                              管理员
                            </>
                          ) : (
                            <>
                              <Users className="w-3 h-3" />
                              普通成员
                            </>
                          )}
                        </span>
                        {isSelf && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-sky-600 bg-sky-50">
                            当前用户
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm mb-3">
                        {user.email && (
                          <div className="flex items-center gap-1.5 text-coffee-500">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-coffee-500">
                          <Calendar className="w-4 h-4" />
                          <span>加入于 {formatDate(user.joinDate, "YYYY-MM-DD")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-coffee-400" />
                          <span className="text-sm text-coffee-500">月度预算：</span>
                          {isEditingBudget ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editBudget}
                                onChange={(e) =>
                                  setEditBudget(Number(e.target.value))
                                }
                                className="w-24 px-3 py-1.5 rounded-lg border-2 border-coffee-200 focus:border-coffee-400 focus:outline-none text-sm font-medium text-coffee-800"
                                min={0}
                              />
                              <button
                                onClick={() =>
                                  handleSaveBudget(user.id, user.name)
                                }
                                className="p-1.5 rounded-lg bg-matcha-100 text-matcha-600 hover:bg-matcha-200 transition-colors"
                                title="保存"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={handleCancelEditBudget}
                                className="p-1.5 rounded-lg bg-coffee-100 text-coffee-500 hover:bg-coffee-200 transition-colors"
                                title="取消"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-coffee-700">
                                {formatCurrency(user.monthlyBudget)}
                              </span>
                              <button
                                onClick={() => handleStartEditBudget(user)}
                                className="p-1 rounded-lg hover:bg-coffee-100 text-coffee-400 hover:text-coffee-600 transition-colors"
                                title="编辑预算"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleApproveUser(user.id, user.name)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-matcha-500 text-white hover:bg-matcha-600 transition-all duration-200 shadow-soft active:scale-[0.98]"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>通过审核</span>
                        </button>
                      )}

                      {!isPending && !isSelf && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowRoleMenu(
                                showRoleMenu === user.id ? null : user.id
                              )
                            }
                            className={cn(
                              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                              user.role === "admin"
                                ? "bg-violet-50 text-violet-600 hover:bg-violet-100"
                                : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
                            )}
                          >
                            {user.role === "admin" ? (
                              <ShieldAlert className="w-4 h-4" />
                            ) : (
                              <Shield className="w-4 h-4" />
                            )}
                            <span>
                              {user.role === "admin" ? "降级" : "升级"}
                            </span>
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {showRoleMenu === user.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowRoleMenu(null)}
                              />
                              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-large border border-coffee-100 overflow-hidden z-20">
                                <button
                                  onClick={() =>
                                    handleUpdateRole(
                                      user.id,
                                      "user",
                                      user.name
                                    )
                                  }
                                  className={cn(
                                    "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-coffee-50 transition-colors",
                                    user.role === "user" &&
                                      "text-coffee-400"
                                  )}
                                  disabled={user.role === "user"}
                                >
                                  <Users className="w-4 h-4" />
                                  <span>普通成员</span>
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateRole(
                                      user.id,
                                      "admin",
                                      user.name
                                    )
                                  }
                                  className={cn(
                                    "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-violet-50 transition-colors",
                                    user.role === "admin" && "text-violet-400"
                                  )}
                                  disabled={user.role === "admin"}
                                >
                                  <Shield className="w-4 h-4" />
                                  <span>管理员</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="p-12">
            <Empty
              icon={Users}
              title={activeTab === "pending" ? "暂无待审核用户" : "暂无用户"}
              description={
                activeTab === "pending"
                  ? "所有新成员都已审核完成"
                  : "系统还没有用户"
              }
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
