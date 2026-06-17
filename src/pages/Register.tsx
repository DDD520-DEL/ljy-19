import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserPlus,
  Mail,
  User,
  Ticket,
  ArrowLeft,
  Coffee,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useInvitationStore } from "@/store/useInvitationStore";
import { useUserStore } from "@/store/useUserStore";
import Toast from "@/components/Toast/Toast";
import { cn } from "@/lib/utils";

type ToastState = {
  isVisible: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
};

type Step = "validate" | "register" | "success";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get("code") || "";

  const { validateInvitationCode, useInvitationCode: consumeInvitationCode, initInvitationCodes } = useInvitationStore();
  const { registerUser, initUsers } = useUserStore();

  const [step, setStep] = useState<Step>("validate");
  const [invitationCode, setInvitationCode] = useState(codeFromUrl);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [validatedCode, setValidatedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ code?: string; name?: string; email?: string }>({});
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    initInvitationCodes();
    initUsers();
  }, [initInvitationCodes, initUsers]);

  const showToast = (message: string, type: ToastState["type"] = "success") => {
    setToast({ isVisible: true, message, type });
  };

  const handleValidateCode = useCallback(() => {
    const trimmedCode = invitationCode.trim().toUpperCase();

    if (!trimmedCode) {
      setErrors({ code: "请输入邀请码" });
      return;
    }

    const result = validateInvitationCode(trimmedCode);

    if (!result.valid) {
      setErrors({ code: result.reason });
      showToast(result.reason || "邀请码验证失败", "error");
      return;
    }

    setErrors({});
    setValidatedCode(trimmedCode);
    setStep("register");
    showToast("邀请码验证成功", "success");
  }, [invitationCode, validateInvitationCode]);

  useEffect(() => {
    if (codeFromUrl) {
      handleValidateCode();
    }
  }, [codeFromUrl, handleValidateCode]);

  const validateForm = () => {
    const newErrors: { name?: string; email?: string } = {};

    if (!name.trim()) {
      newErrors.name = "请输入姓名";
    } else if (name.trim().length < 2) {
      newErrors.name = "姓名至少需要2个字符";
    }

    if (!email.trim()) {
      newErrors.email = "请输入邮箱";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "请输入有效的邮箱地址";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm() || !validatedCode) return;

    setIsLoading(true);

    try {
      const newUser = registerUser(name.trim(), email.trim());
      const useSuccess = consumeInvitationCode(validatedCode, newUser.id, newUser.name, newUser.email || "");

      if (!useSuccess) {
        showToast("邀请码使用失败，请重试", "error");
        setIsLoading(false);
        return;
      }

      setStep("success");
      showToast("注册成功！等待管理员审核", "success");
    } catch {
      showToast("注册失败，请重试", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToValidate = () => {
    setStep("validate");
    setValidatedCode(null);
    setName("");
    setEmail("");
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-coffee-50 to-cream-100 flex items-center justify-center p-4">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((t) => ({ ...t, isVisible: false }))}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-coffee-600 to-coffee-800 mb-4 shadow-medium">
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-coffee-800">咖啡角</h1>
          <p className="text-coffee-500 mt-1">办公室共享饮品追踪</p>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-large overflow-hidden"
        >
          {step === "validate" && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-coffee-100">
                  <Ticket className="w-6 h-6 text-coffee-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-coffee-800">输入邀请码</h2>
                  <p className="text-sm text-coffee-500">请输入管理员提供的邀请码</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coffee-700 mb-2">
                    邀请码
                  </label>
                  <div className="relative">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-coffee-400" />
                    <input
                      type="text"
                      value={invitationCode}
                      onChange={(e) => {
                        setInvitationCode(e.target.value.toUpperCase());
                        if (errors.code) setErrors({ ...errors, code: undefined });
                      }}
                      placeholder="请输入8位邀请码"
                      maxLength={8}
                      className={cn(
                        "w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-coffee-500/20",
                        errors.code
                          ? "border-danger-300 bg-danger-50 focus:border-danger-400"
                          : "border-coffee-100 bg-coffee-50/50 focus:border-coffee-400 focus:bg-white"
                      )}
                      style={{ letterSpacing: "0.1em", textTransform: "uppercase" }}
                    />
                  </div>
                  {errors.code && (
                    <div className="flex items-center gap-1.5 mt-2 text-danger-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.code}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleValidateCode}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-coffee-600 to-coffee-700 text-white font-medium shadow-soft hover:from-coffee-700 hover:to-coffee-800 transition-all duration-200 active:scale-[0.98]"
                >
                  验证邀请码
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-coffee-100">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center justify-center gap-2 w-full py-3 text-coffee-500 hover:text-coffee-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>返回首页</span>
                </button>
              </div>
            </div>
          )}

          {step === "register" && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-matcha-100">
                  <UserPlus className="w-6 h-6 text-matcha-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-coffee-800">填写信息</h2>
                  <p className="text-sm text-coffee-500">邀请码有效，请填写个人信息</p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-matcha-50 border border-matcha-100 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-matcha-600 flex-shrink-0" />
                <span className="text-sm text-matcha-700">
                  邀请码 <span className="font-mono font-bold">{validatedCode}</span> 验证通过
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-coffee-700 mb-2">
                    姓名
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-coffee-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: undefined });
                      }}
                      placeholder="请输入您的姓名"
                      className={cn(
                        "w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-coffee-500/20",
                        errors.name
                          ? "border-danger-300 bg-danger-50 focus:border-danger-400"
                          : "border-coffee-100 bg-coffee-50/50 focus:border-coffee-400 focus:bg-white"
                      )}
                    />
                  </div>
                  {errors.name && (
                    <div className="flex items-center gap-1.5 mt-2 text-danger-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-coffee-700 mb-2">
                    邮箱
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-coffee-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      placeholder="请输入您的邮箱"
                      className={cn(
                        "w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-coffee-500/20",
                        errors.email
                          ? "border-danger-300 bg-danger-50 focus:border-danger-400"
                          : "border-coffee-100 bg-coffee-50/50 focus:border-coffee-400 focus:bg-white"
                      )}
                    />
                  </div>
                  {errors.email && (
                    <div className="flex items-center gap-1.5 mt-2 text-danger-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBackToValidate}
                    className="flex-1 py-3.5 rounded-xl border-2 border-coffee-200 text-coffee-600 font-medium hover:bg-coffee-50 transition-all duration-200 active:scale-[0.98]"
                  >
                    返回
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-coffee-600 to-coffee-700 text-white font-medium shadow-soft hover:from-coffee-700 hover:to-coffee-800 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>注册中...</span>
                      </>
                    ) : (
                      "提交注册"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-matcha-100 mb-6"
              >
                <CheckCircle className="w-10 h-10 text-matcha-600" />
              </motion.div>

              <h2 className="text-xl font-bold text-coffee-800 mb-2">注册申请已提交</h2>
              <p className="text-coffee-500 mb-6">
                管理员会尽快审核您的申请，审核通过后即可使用系统。
              </p>

              <div className="bg-cream-50 rounded-xl p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-coffee-500">姓名</span>
                    <span className="font-medium text-coffee-700">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-coffee-500">邮箱</span>
                    <span className="font-medium text-coffee-700">{email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-coffee-500">初始角色</span>
                    <span className="font-medium text-coffee-700">普通成员</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-coffee-500">状态</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      待审核
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/")}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-coffee-600 to-coffee-700 text-white font-medium shadow-soft hover:from-coffee-700 hover:to-coffee-800 transition-all duration-200 active:scale-[0.98]"
              >
                返回首页
              </button>
            </div>
          )}
        </motion.div>

        <p className="text-center text-coffee-400 text-xs mt-6">
          加入即表示您同意我们的使用条款
        </p>
      </motion.div>
    </div>
  );
}
