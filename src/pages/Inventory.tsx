import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  AlertTriangle,
  TrendingUp,
  Settings,
  Clock,
  ClipboardCheck,
  FileText,
  Users,
  Wallet,
  Vote,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useUserStore } from "@/store/useUserStore";
import { useRestockRequestStore } from "@/store/useRestockRequestStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useDutyStore } from "@/store/useDutyStore";
import { useVoteSuggestionStore } from "@/store/useVoteSuggestionStore";
import { categoryLabels, type MaterialCategory, type Material, type User, type VoteSuggestion } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency, getStockStatus, timeAgo } from "@/utils/date";

const categoryTabs: { key: MaterialCategory | "all"; label: string; icon: string }[] = [
  { key: "all", label: "全部", icon: "📦" },
  { key: "coffee", label: "咖啡豆", icon: "☕" },
  { key: "tea", label: "茶包", icon: "🍵" },
  { key: "dairy", label: "奶制品", icon: "🥛" },
  { key: "snack", label: "零食", icon: "🍪" },
];

export default function Inventory() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | "all">("all");
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedUserForBudget, setSelectedUserForBudget] = useState<User | null>(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [requestQuantity, setRequestQuantity] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [showHistory, setShowHistory] = useState(false);
  const [showBudgetManagement, setShowBudgetManagement] = useState(false);

  const { materials, restocks, restockMaterial, getLowStockMaterials, updateThreshold } =
    useMaterialStore();
  const { currentUser, users } = useUserStore();
  const { submitRequest, getPendingCount, requests } = useRestockRequestStore();
  const { setUserBudget, getAllUserBudgetInfos } = useBudgetStore();
  const { getCurrentDutyUser } = useDutyStore();
  const { getPendingSuggestions, markAsProcessed } = useVoteSuggestionStore();

  const currentDutyUser = getCurrentDutyUser();
  const isCurrentDutyUser = currentUser && currentDutyUser && currentUser.id === currentDutyUser.id;
  const pendingSuggestions = getPendingSuggestions();
  const [selectedSuggestion, setSelectedSuggestion] = useState<VoteSuggestion | null>(null);

  const isAdmin = currentUser?.role === "admin";
  const pendingCount = getPendingCount();

  const filteredMaterials =
    activeCategory === "all"
      ? materials
      : materials.filter((m) => m.category === activeCategory);

  const lowStockMaterials = getLowStockMaterials();

  const getPendingRequestsForMaterial = (materialId: string) => {
    return requests.filter((r) => r.materialId === materialId && r.status === "pending");
  };

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const openRestockModal = (material: Material) => {
    setSelectedMaterial(material);
    setRestockQuantity("");
    setRestockCost(String(material.unitPrice * 10));
    setRestockModalOpen(true);
  };

  const openRequestModal = (material: Material) => {
    setSelectedMaterial(material);
    setRequestQuantity("");
    setRequestReason("");
    setRequestModalOpen(true);
  };

  const handleRestock = () => {
    if (!selectedMaterial || !currentUser) return;

    const quantity = parseInt(restockQuantity);
    const cost = parseFloat(restockCost);

    if (isNaN(quantity) || quantity <= 0) {
      showToast("请输入有效的补货数量", "error");
      return;
    }

    restockMaterial(selectedMaterial.id, quantity, currentUser.id, cost);
    showToast(`补货成功！${selectedMaterial.name} +${quantity}${selectedMaterial.unit}`, "success");
    setRestockModalOpen(false);

    if (selectedSuggestion) {
      markAsProcessed(selectedSuggestion.id);
      setSelectedSuggestion(null);
    }
  };

  const handleSubmitRequest = () => {
    if (!selectedMaterial || !currentUser) return;

    const quantity = parseInt(requestQuantity);

    if (isNaN(quantity) || quantity <= 0) {
      showToast("请输入有效的补货数量", "error");
      return;
    }

    if (!requestReason.trim()) {
      showToast("请填写申请理由", "error");
      return;
    }

    const estimatedCost = quantity * selectedMaterial.unitPrice;

    const requestId = submitRequest(
      selectedMaterial.id,
      quantity,
      estimatedCost,
      currentUser.id,
      requestReason.trim()
    );

    showToast("已提交补货申请，等待管理员审批", "success");
    setRequestModalOpen(false);

    if (selectedSuggestion) {
      markAsProcessed(selectedSuggestion.id, requestId);
      setSelectedSuggestion(null);
    }
  };

  const handleThresholdChange = (materialId: string, threshold: number) => {
    updateThreshold(materialId, threshold);
    showToast("阈值已更新", "success");
  };

  const openBudgetModal = (user: User) => {
    setSelectedUserForBudget(user);
    setNewBudgetAmount(String(user.monthlyBudget));
    setBudgetModalOpen(true);
  };

  const applySuggestionToRequest = (suggestion: VoteSuggestion) => {
    const matchingMaterial = materials.find((m) =>
      m.name.includes(suggestion.optionName) || suggestion.optionName.includes(m.name)
    );

    if (matchingMaterial) {
      setSelectedMaterial(matchingMaterial);
      setRequestQuantity(String(suggestion.suggestedQuantity));
      setRequestReason(`根据投票结果「${suggestion.voteTitle}」，「${suggestion.optionName}」以 ${suggestion.votes} 票胜出，建议补货 ${suggestion.suggestedQuantity} ${matchingMaterial.unit}`);
      setSelectedSuggestion(suggestion);
      setRequestModalOpen(true);
    } else {
      setSelectedMaterial(null);
      setSelectedSuggestion(null);
      showToast(`未找到与「${suggestion.optionName}」匹配的物料，请先在库存中添加该物料后再申请补货`, "warning");
    }
  };

  const applySuggestionToRestock = (suggestion: VoteSuggestion) => {
    const matchingMaterial = materials.find((m) =>
      m.name.includes(suggestion.optionName) || suggestion.optionName.includes(m.name)
    );

    if (matchingMaterial) {
      setSelectedMaterial(matchingMaterial);
      setRestockQuantity(String(suggestion.suggestedQuantity));
      setRestockCost(String(matchingMaterial.unitPrice * suggestion.suggestedQuantity));
      setSelectedSuggestion(suggestion);
      setRestockModalOpen(true);
    } else {
      showToast(`未找到与「${suggestion.optionName}」匹配的物料，请先添加该物料`, "warning");
    }
  };

  const handleSetBudget = () => {
    if (!selectedUserForBudget) return;

    const budget = parseFloat(newBudgetAmount);
    if (isNaN(budget) || budget < 0) {
      showToast("请输入有效的预算金额", "error");
      return;
    }

    setUserBudget(selectedUserForBudget.id, budget);
    showToast(`已为 ${selectedUserForBudget.name} 设置月度预算 ${formatCurrency(budget)}`, "success");
    setBudgetModalOpen(false);
  };

  const allUserBudgetInfos = getAllUserBudgetInfos();

  const getStatusBadge = (stock: number, threshold: number) => {
    const status = getStockStatus(stock, threshold);
    const config = {
      sufficient: { label: "充足", className: "bg-matcha-100 text-matcha-600" },
      low: { label: "偏低", className: "bg-amber-100 text-amber-600" },
      critical: { label: "不足", className: "bg-danger-100 text-danger-500" },
    };
    return config[status];
  };

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
          <h1 className="text-2xl font-bold text-coffee-800">库存管理</h1>
          <p className="text-coffee-500 text-sm mt-1">
            {isAdmin ? "管理所有物料的库存和补货" : "查看库存和提交补货申请"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/restock-approval")}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-soft text-coffee-600 hover:bg-coffee-50 transition-colors relative"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-sm font-medium">补货审批</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
            )}
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setShowBudgetManagement(!showBudgetManagement);
                setShowHistory(false);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl shadow-soft transition-colors",
                showBudgetManagement
                  ? "bg-coffee-700 text-white"
                  : "bg-white text-coffee-600 hover:bg-coffee-50"
              )}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">用户额度管理</span>
            </button>
          )}
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              setShowBudgetManagement(false);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl shadow-soft transition-colors",
              showHistory
                ? "bg-coffee-700 text-white"
                : "bg-white text-coffee-600 hover:bg-coffee-50"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">补货记录</span>
          </button>
        </div>
      </div>

      {lowStockMaterials.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-amber-700">
              有 {lowStockMaterials.length} 种物料库存偏低
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockMaterials.map((m) => (
              <span
                key={m.id}
                className="px-3 py-1 bg-white rounded-full text-sm text-amber-600 border border-amber-200"
              >
                {m.icon} {m.name} ({m.stock}/{m.threshold})
              </span>
            ))}
          </div>
        </div>
      )}

      {isCurrentDutyUser && pendingSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-vote-50 to-vote-100 border border-vote-200 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-vote-500 rounded-xl">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-vote-800">来自投票的补货建议</h3>
              <p className="text-sm text-vote-600">本周值班人员专属 - 投票结果已出，请及时处理</p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingSuggestions.map((suggestion, index) => {
              const matchingMaterial = materials.find((m) =>
                m.name.includes(suggestion.optionName) || suggestion.optionName.includes(m.name)
              );

              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-4 shadow-soft"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-vote-100 flex items-center justify-center text-2xl flex-shrink-0">
                        {suggestion.optionIcon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-coffee-800 truncate">
                            {suggestion.optionName}
                          </h4>
                          <span className="px-2 py-0.5 bg-vote-200 text-vote-700 text-xs rounded-full font-medium">
                            #{suggestion.votes} 票
                          </span>
                        </div>
                        <p className="text-xs text-coffee-500 mt-1 truncate">
                          投票：{suggestion.voteTitle}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-coffee-600">
                            建议数量：<span className="font-bold text-vote-600">{suggestion.suggestedQuantity}</span>
                            {matchingMaterial ? ` ${matchingMaterial.unit}` : " 单位"}
                          </span>
                          {matchingMaterial && (
                            <span className="text-sm text-coffee-500">
                              匹配物料：{matchingMaterial.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAdmin ? (
                        <button
                          onClick={() => applySuggestionToRestock(suggestion)}
                          className="flex items-center gap-1 px-4 py-2 bg-matcha-500 text-white text-sm font-medium rounded-lg hover:bg-matcha-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          直接补货
                        </button>
                      ) : (
                        <button
                          onClick={() => applySuggestionToRequest(suggestion)}
                          className="flex items-center gap-1 px-4 py-2 bg-vote-500 text-white text-sm font-medium rounded-lg hover:bg-vote-600 transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                          一键填入申请
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-vote-600">
            <CheckCircle className="w-4 h-4" />
            <span>补货完成后，建议将自动标记为已处理</span>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {categoryTabs.map((cat) => (
            <motion.button
              key={cat.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                activeCategory === cat.key
                  ? "bg-coffee-700 text-white shadow-soft"
                  : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showBudgetManagement ? (
          <motion.div
            key="budget"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl shadow-soft overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-coffee-100">
              <h3 className="font-bold text-coffee-800">用户月度额度管理</h3>
              <p className="text-sm text-coffee-500 mt-1">为不同用户设置个性化的月度消费预算</p>
            </div>
            <div className="divide-y divide-coffee-50">
              {allUserBudgetInfos.map((budgetInfo, index) => {
                const user = users.find((u) => u.id === budgetInfo.userId);
                if (!user) return null;

                return (
                  <motion.div
                    key={budgetInfo.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="px-6 py-4 flex items-center justify-between hover:bg-coffee-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-coffee-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-coffee-500" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-coffee-800">{user.name}</p>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            user.role === "admin"
                              ? "bg-coffee-100 text-coffee-600"
                              : "bg-coffee-50 text-coffee-500"
                          )}>
                            {user.role === "admin" ? "管理员" : "普通成员"}
                          </span>
                        </div>
                        <div className="mt-1 w-48">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-coffee-500">本月使用</span>
                            <span className={cn(
                              "font-medium",
                              budgetInfo.usagePercentage >= 90
                                ? "text-danger-600"
                                : budgetInfo.usagePercentage >= 70
                                ? "text-amber-600"
                                : "text-matcha-600"
                            )}>
                              {formatCurrency(budgetInfo.usedAmount)} / {formatCurrency(budgetInfo.totalBudget)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-coffee-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                budgetInfo.usagePercentage >= 90
                                  ? "bg-danger-500"
                                  : budgetInfo.usagePercentage >= 70
                                  ? "bg-amber-500"
                                  : "bg-matcha-500"
                              )}
                              style={{ width: `${Math.min(100, budgetInfo.usagePercentage)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-coffee-800">
                          {formatCurrency(budgetInfo.remainingAmount)}
                        </p>
                        <p className="text-xs text-coffee-500">剩余额度</p>
                      </div>
                      <button
                        onClick={() => openBudgetModal(user)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-coffee-500 text-white text-sm font-medium rounded-lg hover:bg-coffee-600 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        设置额度
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : !showHistory ? (
          <motion.div
            key="inventory"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-soft overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-coffee-50">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      物料
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      分类
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      库存
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      阈值
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      单价
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      状态
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-coffee-700">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.map((material, index) => {
                    const status = getStatusBadge(material.stock, material.threshold);
                    const pendingRequests = getPendingRequestsForMaterial(material.id);
                    return (
                      <motion.tr
                        key={material.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-t border-coffee-50 hover:bg-coffee-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                              style={{ backgroundColor: material.color + "20" }}
                            >
                              {material.icon}
                            </div>
                            <div>
                              <p className="font-medium text-coffee-800">{material.name}</p>
                              <p className="text-xs text-coffee-400">{material.description}</p>
                              {pendingRequests.length > 0 && (
                                <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3 inline" />
                                  {pendingRequests.length} 条待审批
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-coffee-600">
                            {categoryLabels[material.category]}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-coffee-800">
                            {material.stock}
                          </span>
                          <span className="text-coffee-400 text-sm ml-1">
                            {material.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={material.threshold}
                              onChange={(e) =>
                                handleThresholdChange(material.id, parseInt(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 text-sm bg-cream-50 border border-coffee-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-coffee-400"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-coffee-600">
                          {formatCurrency(material.unitPrice)}/{material.unit}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("badge text-xs font-medium", status.className)}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isAdmin ? (
                            <button
                              onClick={() => openRestockModal(material)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-matcha-400 text-white text-sm font-medium rounded-lg hover:bg-matcha-500 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              补货
                            </button>
                          ) : (
                            <button
                              onClick={() => openRequestModal(material)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-coffee-500 text-white text-sm font-medium rounded-lg hover:bg-coffee-600 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              申请补货
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl shadow-soft overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-coffee-100">
              <h3 className="font-bold text-coffee-800">补货记录</h3>
            </div>
            <div className="divide-y divide-coffee-50">
              {restocks.slice(0, 20).map((record, index) => {
                const material = materials.find((m) => m.id === record.materialId);
                const user = useUserStore.getState().users.find((u) => u.id === record.operatorId);
                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="px-6 py-4 flex items-center justify-between hover:bg-coffee-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: material?.color + "20" || "#f0f0f0" }}
                      >
                        {material?.icon || "📦"}
                      </div>
                      <div>
                        <p className="font-medium text-coffee-800">
                          {material?.name || "未知物料"}
                        </p>
                        <p className="text-xs text-coffee-400">
                          补货人：{user?.name || "未知"} · {timeAgo(record.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-matcha-600">+{record.quantity}</p>
                      <p className="text-xs text-coffee-400">
                        {formatCurrency(record.cost)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={restockModalOpen}
        onClose={() => setRestockModalOpen(false)}
        title={`补货 - ${selectedMaterial?.name}`}
      >
        {selectedMaterial && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-coffee-50 rounded-xl">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: selectedMaterial.color + "30" }}
              >
                {selectedMaterial.icon}
              </div>
              <div>
                <h4 className="font-bold text-coffee-800">{selectedMaterial.name}</h4>
                <p className="text-sm text-coffee-500">
                  当前库存：{selectedMaterial.stock} {selectedMaterial.unit}
                </p>
                <p className="text-sm text-coffee-500">
                  单价：{formatCurrency(selectedMaterial.unitPrice)}/{selectedMaterial.unit}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                补货数量
              </label>
              <input
                type="number"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                placeholder="输入补货数量"
                className="input-field"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                总费用 (元)
              </label>
              <input
                type="number"
                value={restockCost}
                onChange={(e) => setRestockCost(e.target.value)}
                placeholder="输入总费用"
                className="input-field"
              />
            </div>

            <div className="pt-2">
              <button onClick={handleRestock} className="w-full btn-success">
                确认补货
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title={`申请补货 - ${selectedMaterial?.name}`}
      >
        {selectedMaterial && (
          <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-coffee-50 rounded-xl">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: selectedMaterial.color + "30" }}
            >
              {selectedMaterial.icon}
            </div>
            <div>
              <h4 className="font-bold text-coffee-800">{selectedMaterial.name}</h4>
              <p className="text-sm text-coffee-500">
                当前库存：{selectedMaterial.stock} {selectedMaterial.unit}
              </p>
              <p className="text-sm text-coffee-500">
                单价：{formatCurrency(selectedMaterial.unitPrice)}/{selectedMaterial.unit}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">
              补货数量
            </label>
            <input
              type="number"
              value={requestQuantity}
              onChange={(e) => setRequestQuantity(e.target.value)}
              placeholder="输入需要补货的数量"
              className="input-field"
              autoFocus
            />
            {requestQuantity && !isNaN(parseInt(requestQuantity)) && (
              <p className="text-xs text-coffee-500 mt-1">
                预估费用：{formatCurrency(parseInt(requestQuantity) * selectedMaterial.unitPrice)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">
              申请理由 <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="请说明申请补货的原因，如：库存不足、同事需求大等"
              rows={3}
              className="w-full px-4 py-3 bg-cream-50 border border-coffee-200 rounded-xl text-coffee-800 placeholder-coffee-300 focus:outline-none focus:ring-2 focus:ring-coffee-400 focus:border-transparent resize-none"
            />
          </div>

          <div className="pt-2 space-y-2">
            <button onClick={handleSubmitRequest} className="w-full btn-primary">
              提交申请
            </button>
            <p className="text-xs text-coffee-400 text-center">
              提交后需管理员审批通过后才会生效
            </p>
          </div>
        </div>
      )}
    </Modal>

      <Modal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        title={`设置月度预算 - ${selectedUserForBudget?.name}`}
      >
        {selectedUserForBudget && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-coffee-50 rounded-xl">
              <div className="relative">
                {selectedUserForBudget.avatar ? (
                  <img
                    src={selectedUserForBudget.avatar}
                    alt={selectedUserForBudget.name}
                    className="w-14 h-14 rounded-full"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-coffee-200 flex items-center justify-center">
                    <Users className="w-7 h-7 text-coffee-600" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-coffee-800">{selectedUserForBudget.name}</h4>
                <p className="text-sm text-coffee-500">
                  {selectedUserForBudget.role === "admin" ? "管理员" : "普通成员"}
                </p>
                <p className="text-sm text-coffee-500">
                  当前预算：{formatCurrency(selectedUserForBudget.monthlyBudget)}/月
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">
                月度消费预算 (元)
              </label>
              <input
                type="number"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                placeholder="输入月度预算金额"
                className="input-field"
                autoFocus
                min="0"
                step="0.01"
              />
              <p className="text-xs text-coffee-500 mt-1">
                设置为 0 表示不限制消费额度
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {[100, 200, 300].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setNewBudgetAmount(String(amount))}
                  className={cn(
                    "py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                    newBudgetAmount === String(amount)
                      ? "bg-coffee-600 text-white"
                      : "bg-coffee-100 text-coffee-700 hover:bg-coffee-200"
                  )}
                >
                  ¥{amount}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button onClick={handleSetBudget} className="w-full btn-primary">
                确认设置
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

