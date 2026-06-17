import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Ticket,
  Plus,
  Copy,
  Check,
  Clock,
  XCircle,
  CheckCircle,
  User,
  Mail,
  Calendar,
  ExternalLink,
  Share2,
} from "lucide-react";
import { useInvitationStore } from "@/store/useInvitationStore";
import { useUserStore } from "@/store/useUserStore";
import Toast from "@/components/Toast/Toast";
import Empty from "@/components/Empty";
import { formatDate, timeAgo } from "@/utils/date";
import { cn } from "@/lib/utils";
import type { InvitationCodeStatus } from "@/types";

type ToastState = {
  isVisible: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
};

const statusConfig: Record<
  InvitationCodeStatus,
  { label: string; icon: typeof Clock; className: string; dotClass: string }
> = {
  active: {
    label: "有效",
    icon: Clock,
    className: "text-matcha-600 bg-matcha-50",
    dotClass: "bg-matcha-500",
  },
  used: {
    label: "已使用",
    icon: CheckCircle,
    className: "text-coffee-600 bg-coffee-50",
    dotClass: "bg-coffee-500",
  },
  expired: {
    label: "已过期",
    icon: XCircle,
    className: "text-danger-600 bg-danger-50",
    dotClass: "bg-danger-500",
  },
};

export default function InvitationManagement() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();
  const {
    invitationCodes,
    createInvitationCode,
    getInvitationCodesByCreator,
    initInvitationCodes,
  } = useInvitationStore();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | InvitationCodeStatus>("all");
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    initInvitationCodes();
  }, [initInvitationCodes]);

  const myCodes = isAdmin ? invitationCodes : getInvitationCodesByCreator(currentUser?.id || "");

  const filteredCodes = myCodes
    .filter((code) => filter === "all" || code.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: myCodes.length,
    active: myCodes.filter((c) => c.status === "active").length,
    used: myCodes.filter((c) => c.status === "used").length,
    expired: myCodes.filter((c) => c.status === "expired").length,
  };

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const handleCreateCode = () => {
    if (!currentUser) return;

    const newCode = createInvitationCode(currentUser.id);
    showToast("邀请码创建成功", "success");

    setTimeout(() => {
      handleCopyCode(newCode.code);
    }, 300);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast("邀请码已复制到剪贴板", "success");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      showToast("复制失败，请手动复制", "error");
    }
  };

  const handleCopyLink = async (code: string) => {
    const registerUrl = `${window.location.origin}/register?code=${code}`;
    try {
      await navigator.clipboard.writeText(registerUrl);
      showToast("注册链接已复制到剪贴板", "success");
    } catch {
      showToast("复制失败，请手动复制", "error");
    }
  };

  const handleGoToRegister = (code: string) => {
    navigate(`/register?code=${code}`);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-danger-50 flex items-center justify-center mb-4">
          <XCircle className="w-10 h-10 text-danger-400" />
        </div>
        <h2 className="text-xl font-bold text-coffee-800 mb-2">无权限访问</h2>
        <p className="text-coffee-500">仅管理员可以查看邀请码管理页面</p>
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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-coffee-800">邀请码管理</h1>
          <p className="text-coffee-500 text-sm mt-1">
            生成邀请码邀请新成员加入，邀请码24小时内有效
          </p>
        </div>
        <button
          onClick={handleCreateCode}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-coffee-600 to-coffee-700 text-white font-medium shadow-soft hover:from-coffee-700 hover:to-coffee-800 transition-all duration-200 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>生成邀请码</span>
        </button>
      </div>

      {/* 统计卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          {
            label: "全部邀请码",
            value: stats.total,
            icon: Ticket,
            color: "text-coffee-600",
            bg: "bg-coffee-100",
          },
          {
            label: "有效",
            value: stats.active,
            icon: Clock,
            color: "text-matcha-600",
            bg: "bg-matcha-100",
          },
          {
            label: "已使用",
            value: stats.used,
            icon: CheckCircle,
            color: "text-sky-600",
            bg: "bg-sky-100",
          },
          {
            label: "已过期",
            value: stats.expired,
            icon: XCircle,
            color: "text-danger-600",
            bg: "bg-danger-100",
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-soft"
            >
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

      {/* 筛选标签 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6"
      >
        {[
          { key: "all", label: "全部" },
          { key: "active", label: "有效" },
          { key: "used", label: "已使用" },
          { key: "expired", label: "已过期" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as typeof filter)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              filter === item.key
                ? "bg-coffee-600 text-white shadow-soft"
                : "bg-white text-coffee-600 hover:bg-coffee-50"
            )}
          >
            {item.label}
          </button>
        ))}
      </motion.div>

      {/* 邀请码列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-soft overflow-hidden"
      >
        {filteredCodes.length > 0 ? (
          <div className="divide-y divide-coffee-50">
            {filteredCodes.map((code, index) => {
              const config = statusConfig[code.status];
              const isActive = code.status === "active";

              return (
                <motion.div
                  key={code.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.03 }}
                  className="p-5 hover:bg-coffee-50/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-coffee-50">
                      <Ticket className="w-6 h-6 text-coffee-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="font-mono text-xl font-bold text-coffee-800 tracking-wider"
                        >
                          {code.code}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            config.className
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
                          {config.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
                        <div className="flex items-center gap-1.5 text-coffee-500">
                          <Calendar className="w-4 h-4" />
                          <span>创建于 {timeAgo(code.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-coffee-500">
                          <Clock className="w-4 h-4" />
                          <span>
                            {isActive
                              ? `有效期至 ${formatDate(code.expiresAt, "MM-DD HH:mm")}`
                              : code.status === "used"
                              ? `使用于 ${timeAgo(code.usedAt || code.createdAt)}`
                              : `过期于 ${timeAgo(code.expiresAt)}`}
                          </span>
                        </div>
                      </div>

                      {code.status === "used" && (
                        <div className="mt-3 p-3 bg-cream-50 rounded-xl border border-coffee-100">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-coffee-400" />
                              <span className="text-coffee-500">注册用户：</span>
                              <span className="font-medium text-coffee-700">
                                {code.registeredUserName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-coffee-400" />
                              <span className="text-coffee-500">邮箱：</span>
                              <span className="font-medium text-coffee-700">
                                {code.registeredUserEmail}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {isActive && (
                        <>
                          <button
                            onClick={() => handleCopyCode(code.code)}
                            className={cn(
                              "flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                              copiedCode === code.code
                                ? "bg-matcha-100 text-matcha-600"
                                : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
                            )}
                            title="复制邀请码"
                          >
                            {copiedCode === code.code ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>复制</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleCopyLink(code.code)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-coffee-50 text-coffee-600 hover:bg-coffee-100 transition-all duration-200"
                            title="复制注册链接"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>链接</span>
                          </button>
                          <button
                            onClick={() => handleGoToRegister(code.code)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-coffee-600 text-white hover:bg-coffee-700 transition-all duration-200"
                            title="打开注册页面"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>注册</span>
                          </button>
                        </>
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
              icon={Ticket}
              title="暂无邀请码"
              description={
                filter === "all"
                  ? "点击上方按钮生成第一个邀请码"
                  : `当前没有${filter === "active" ? "有效" : filter === "used" ? "已使用" : "已过期"}的邀请码`
              }
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
