import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertOctagon,
  X,
  Star,
  ArrowUpDown,
  Sparkles,
  Flame,
  BarChart3,
  Package,
  Zap,
  Minus,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useUserStore } from "@/store/useUserStore";
import { useRestockRequestStore } from "@/store/useRestockRequestStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useDutyStore } from "@/store/useDutyStore";
import { useVoteSuggestionStore } from "@/store/useVoteSuggestionStore";
import { useReviewStore } from "@/store/useReviewStore";
import { useConsumptionStore } from "@/store/useConsumptionStore";
import { categoryLabels, type MaterialCategory, type Material, type User, type VoteSuggestion, type RestockSuggestion } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency, getStockStatus, timeAgo, getBatchExpiryInfo, formatExpiryStatus, formatDate, addDays } from "@/utils/date";

const categoryTabs: { key: MaterialCategory | "all"; label: string; icon: string }[] = [
  { key: "all", label: "全部", icon: "📦" },
  { key: "coffee", label: "咖啡豆", icon: "☕" },
  { key: "tea", label: "茶包", icon: "🍵" },
  { key: "dairy", label: "奶制品", icon: "🥛" },
  { key: "snack", label: "零食", icon: "🍪" },
];

interface RestockBatchInput {
  id: string;
  quantity: string;
  productionDate: string;
  expiryDate: string;
}

export default function Inventory() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | "all">("all");
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedUserForBudget, setSelectedUserForBudget] = useState<User | null>(null);
  const [restockCost, setRestockCost] = useState("");
  const [requestQuantity, setRequestQuantity] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [newBudgetAmount, setNewBudgetAmount] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [showHistory, setShowHistory] = useState(false);
  const [showBudgetManagement, setShowBudgetManagement] = useState(false);
  const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
  const [restockBatches, setRestockBatches] = useState<RestockBatchInput[]>([]);
  const [sortBy, setSortBy] = useState<"default" | "rating_desc" | "rating_asc" | "review_count">("default");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestionQuantities, setSuggestionQuantities] = useState<Record<string, number>>({});
  const [batchMode, setBatchMode] = useState(false);
  const [batchIndex, setBatchIndex] = useState(0);

  type SortOption = typeof sortBy;

  const sortOptions: { key: SortOption; label: string; icon: string }[] = [
    { key: "default", label: "默认排序", icon: "📋" },
    { key: "rating_desc", label: "评分从高到低", icon: "⭐" },
    { key: "rating_asc", label: "评分从低到高", icon: "📉" },
    { key: "review_count", label: "评价数量", icon: "💬" },
  ];

  const {
    materials,
    restocks,
    restockMaterial,
    restockMaterialWithBatches,
    getLowStockMaterials,
    updateThreshold,
    getUsableStock,
    getSortedBatchesByExpiry,
    getExpiringSoonBatches,
  } = useMaterialStore();
  const { currentUser, users } = useUserStore();
  const { submitRequest, getPendingCount, requests } = useRestockRequestStore();
  const { setUserBudget, getAllUserBudgetInfos } = useBudgetStore();
  const { getCurrentDutyUser } = useDutyStore();
  const { getPendingSuggestions, markAsProcessed } = useVoteSuggestionStore();
  const { getMaterialRating } = useReviewStore();
  const { getRestockSuggestions } = useConsumptionStore();

  const currentDutyUser = getCurrentDutyUser();
  const isCurrentDutyUser = currentUser && currentDutyUser && currentUser.id === currentDutyUser.id;
  const pendingSuggestions = getPendingSuggestions();
  const [selectedSuggestion, setSelectedSuggestion] = useState<VoteSuggestion | null>(null);

  const restockSuggestions = useMemo(() => {
    return getRestockSuggestions(materials);
  }, [materials, getRestockSuggestions]);

  const filteredRestockSuggestions = useMemo(() => {
    if (activeCategory === "all") return restockSuggestions;
    return restockSuggestions.filter((s) => s.category === activeCategory);
  }, [restockSuggestions, activeCategory]);

  const getSuggestionQuantity = (suggestionId: string, defaultQty: number) => {
    return suggestionQuantities[suggestionId] ?? defaultQty;
  };

  const updateSuggestionQuantity = (suggestionId: string, newQty: number) => {
    setSuggestionQuantities((prev) => ({
      ...prev,
      [suggestionId]: Math.max(1, newQty),
    }));
  };

  const applySmartSuggestionToRestock = (suggestion: RestockSuggestion) => {
    const material = materials.find((m) => m.id === suggestion.materialId);
    if (!material) return;

    const qty = getSuggestionQuantity(suggestion.materialId, suggestion.suggestedQuantity);
    setSelectedMaterial(material);
    setRestockBatches([
      {
        ...createNewBatchInput(material),
        quantity: String(qty),
      },
    ]);
    setRestockCost(String(material.unitPrice * qty));
    setSelectedSuggestion(null);
    setRestockModalOpen(true);
  };

  const applySmartSuggestionToRequest = (suggestion: RestockSuggestion) => {
    const material = materials.find((m) => m.id === suggestion.materialId);
    if (!material) return;

    const qty = getSuggestionQuantity(suggestion.materialId, suggestion.suggestedQuantity);
    setSelectedMaterial(material);
    setRequestQuantity(String(qty));

    const reasonParts = [
      `基于过去3个月消费数据分析，月均消耗约 ${suggestion.threeMonthAverage}${material.unit}，`,
      `日均消耗 ${suggestion.dailyAverage}${material.unit}。`,
      suggestion.isVolatile ? "消费波动较大，建议多备货。" : "",
    ].filter(Boolean);
    setRequestReason(reasonParts.join(""));
    setSelectedSuggestion(null);
    setRequestModalOpen(true);
  };

  const batchApplyAllToRestock = () => {
    if (!isAdmin && !isCurrentDutyUser) {
      showToast("仅管理员或本周值班人员可批量补货", "warning");
      return;
    }

    if (filteredRestockSuggestions.length === 0) {
      showToast("暂无需要补货的物料建议", "info");
      return;
    }

    const totalCost = filteredRestockSuggestions.reduce((sum, s) => {
      const qty = getSuggestionQuantity(s.materialId, s.suggestedQuantity);
      return sum + qty * s.unitPrice;
    }, 0);

    showToast(
      `已准备 ${filteredRestockSuggestions.length} 种物料，预估总费用 ${formatCurrency(totalCost)}。请在弹窗中逐一确认。`,
      "success"
    );

    setBatchMode(true);
    setBatchIndex(0);

    const firstSuggestion = filteredRestockSuggestions[0];
    if (isAdmin) {
      applySmartSuggestionToRestock(firstSuggestion);
    } else {
      applySmartSuggestionToRequest(firstSuggestion);
    }
  };

  const handleNextBatchItem = () => {
    const nextIndex = batchIndex + 1;
    if (nextIndex >= filteredRestockSuggestions.length) {
      setBatchMode(false);
      setBatchIndex(0);
      showToast("全部物料处理完成！", "success");
      return;
    }

    setBatchIndex(nextIndex);
    const nextSuggestion = filteredRestockSuggestions[nextIndex];
    if (isAdmin) {
      applySmartSuggestionToRestock(nextSuggestion);
    } else {
      applySmartSuggestionToRequest(nextSuggestion);
    }
  };

  const cancelBatchMode = () => {
    setBatchMode(false);
    setBatchIndex(0);
    setRestockModalOpen(false);
    setRequestModalOpen(false);
    showToast("已取消批量处理", "info");
  };

  const isAdmin = currentUser?.role === "admin";
  const pendingCount = getPendingCount();
  const expiringSoonBatches = getExpiringSoonBatches(7);

  const filteredMaterials =
    activeCategory === "all"
      ? materials
      : materials.filter((m) => m.category === activeCategory);

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    const ratingA = getMaterialRating(a.id);
    const ratingB = getMaterialRating(b.id);

    switch (sortBy) {
      case "rating_desc":
        return ratingB.averageRating - ratingA.averageRating || ratingB.reviewCount - ratingA.reviewCount;
      case "rating_asc":
        if (ratingA.reviewCount === 0 && ratingB.reviewCount > 0) return 1;
        if (ratingB.reviewCount === 0 && ratingA.reviewCount > 0) return -1;
        return ratingA.averageRating - ratingB.averageRating;
      case "review_count":
        return ratingB.reviewCount - ratingA.reviewCount;
      default:
        return 0;
    }
  });

  const lowStockMaterials = getLowStockMaterials();

  const toggleMaterialExpand = (materialId: string) => {
    const newExpanded = new Set(expandedMaterials);
    if (newExpanded.has(materialId)) {
      newExpanded.delete(materialId);
    } else {
      newExpanded.add(materialId);
    }
    setExpandedMaterials(newExpanded);
  };

  const getPendingRequestsForMaterial = (materialId: string) => {
    return requests.filter((r) => r.materialId === materialId && r.status === "pending");
  };

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const createNewBatchInput = (material: Material): RestockBatchInput => {
    const today = formatDate(new Date(), "YYYY-MM-DD");
    const defaultShelfLife = material.defaultShelfLifeDays || 90;
    const defaultExpiry = formatDate(addDays(new Date(), defaultShelfLife), "YYYY-MM-DD");
    return {
      id: Math.random().toString(36).substring(2, 11),
      quantity: "",
      productionDate: today,
      expiryDate: defaultExpiry,
    };
  };

  const openRestockModal = (material: Material) => {
    setSelectedMaterial(material);
    setRestockCost(String(material.unitPrice * 10));
    setRestockBatches([createNewBatchInput(material)]);
    setRestockModalOpen(true);
  };

  const addRestockBatch = () => {
    if (!selectedMaterial) return;
    setRestockBatches([...restockBatches, createNewBatchInput(selectedMaterial)]);
  };

  const removeRestockBatch = (batchId: string) => {
    if (restockBatches.length <= 1) return;
    setRestockBatches(restockBatches.filter((b) => b.id !== batchId));
  };

  const updateRestockBatch = (batchId: string, field: keyof RestockBatchInput, value: string) => {
    setRestockBatches(
      restockBatches.map((b) => (b.id === batchId ? { ...b, [field]: value } : b))
    );
  };

  const autoCalculateExpiry = (batchId: string) => {
    if (!selectedMaterial) return;
    const batch = restockBatches.find((b) => b.id === batchId);
    if (!batch || !batch.productionDate) return;

    const defaultShelfLife = selectedMaterial.defaultShelfLifeDays || 90;
    const production = new Date(batch.productionDate);
    const expiry = formatDate(addDays(production, defaultShelfLife), "YYYY-MM-DD");
    updateRestockBatch(batchId, "expiryDate", expiry);
  };

  const openRequestModal = (material: Material) => {
    setSelectedMaterial(material);
    setRequestQuantity("");
    setRequestReason("");
    setRequestModalOpen(true);
  };

  const handleRestock = () => {
    if (!selectedMaterial || !currentUser) return;

    const validBatches = restockBatches
      .map((b) => ({
        ...b,
        qtyNum: parseInt(b.quantity),
      }))
      .filter((b) => !isNaN(b.qtyNum) && b.qtyNum > 0);

    if (validBatches.length === 0) {
      showToast("请至少输入一个有效的批次数量", "error");
      return;
    }

    const invalidDates = validBatches.some(
      (b) => !b.productionDate || !b.expiryDate || new Date(b.expiryDate) <= new Date(b.productionDate)
    );

    if (invalidDates) {
      showToast("请检查批次日期，保质期必须晚于生产日期", "error");
      return;
    }

    const cost = parseFloat(restockCost);
    if (isNaN(cost) || cost < 0) {
      showToast("请输入有效的总费用", "error");
      return;
    }

    const batchesData = validBatches.map((b) => ({
      quantity: b.qtyNum,
      productionDate: b.productionDate,
      expiryDate: b.expiryDate,
    }));

    if (batchesData.length === 1) {
      restockMaterial(
        selectedMaterial.id,
        batchesData[0].quantity,
        currentUser.id,
        cost,
        { productionDate: batchesData[0].productionDate, expiryDate: batchesData[0].expiryDate }
      );
    } else {
      restockMaterialWithBatches(selectedMaterial.id, currentUser.id, cost, batchesData);
    }

    const totalQty = batchesData.reduce((sum, b) => sum + b.quantity, 0);
    showToast(`补货成功！${selectedMaterial.name} +${totalQty}${selectedMaterial.unit}（${batchesData.length}个批次）`, "success");
    setRestockModalOpen(false);

    if (selectedSuggestion) {
      markAsProcessed(selectedSuggestion.id);
      setSelectedSuggestion(null);
    }

    if (batchMode) {
      setTimeout(() => {
        handleNextBatchItem();
      }, 500);
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

    if (batchMode) {
      setTimeout(() => {
        handleNextBatchItem();
      }, 500);
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
      setRestockBatches([
        {
          ...createNewBatchInput(matchingMaterial),
          quantity: String(suggestion.suggestedQuantity),
        },
      ]);
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

  const getBatchExpiryStyles = (status: string) => {
    switch (status) {
      case "expired":
        return {
          badge: "bg-gray-200 text-gray-500",
          row: "bg-gray-50 opacity-60",
        };
      case "expiring_soon":
        return {
          badge: "bg-amber-100 text-amber-700",
          row: "bg-amber-50/50",
        };
      default:
        return {
          badge: "bg-matcha-100 text-matcha-700",
          row: "",
        };
    }
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

      {expiringSoonBatches.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertOctagon className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-amber-700">
              有 {expiringSoonBatches.length} 个批次即将过期（7天内）
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringSoonBatches.slice(0, 6).map((b) => {
              const expiryInfo = getBatchExpiryInfo(b.expiryDate);
              return (
                <span
                  key={b.id}
                  className="px-3 py-1 bg-white rounded-full text-sm text-amber-600 border border-amber-200"
                >
                  {b.material.icon} {b.material.name} - {b.remainingQuantity}{b.material.unit}（{formatExpiryStatus(expiryInfo)}）
                </span>
              );
            })}
            {expiringSoonBatches.length > 6 && (
              <span className="px-3 py-1 bg-white rounded-full text-sm text-amber-500 border border-amber-200">
                +{expiringSoonBatches.length - 6} 更多
              </span>
            )}
          </div>
        </div>
      )}

      {lowStockMaterials.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-amber-700">
              有 {lowStockMaterials.length} 种物料库存偏低
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockMaterials.map((m) => {
              const usable = getUsableStock(m.id);
              return (
                <span
                  key={m.id}
                  className="px-3 py-1 bg-white rounded-full text-sm text-amber-600 border border-amber-200"
                >
                  {m.icon} {m.name} ({usable}/{m.threshold})
                </span>
              );
            })}
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

      {filteredRestockSuggestions.length > 0 && (isCurrentDutyUser || isAdmin) && showSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200 rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-coffee-800">智能补货建议</h3>
                <p className="text-sm text-coffee-500">
                  基于过去3个月消费数据分析 · {filteredRestockSuggestions.length} 种物料需要关注
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {filteredRestockSuggestions.length > 1 && (
                <button
                  onClick={batchApplyAllToRestock}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
                >
                  <Zap className="w-4 h-4" />
                  批量一键处理
                </button>
              )}
              <button
                onClick={() => setShowSuggestions(false)}
                className="p-2 text-coffee-400 hover:text-coffee-600 hover:bg-coffee-100/50 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <AnimatePresence>
              {filteredRestockSuggestions.map((suggestion, index) => {
                const suggestedQty = getSuggestionQuantity(suggestion.materialId, suggestion.suggestedQuantity);
                const urgency =
                  suggestion.estimatedDays < 7
                    ? { label: "紧急", className: "bg-danger-100 text-danger-600", icon: <Flame className="w-3.5 h-3.5" /> }
                    : suggestion.estimatedDays < 15
                    ? { label: "紧张", className: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="w-3.5 h-3.5" /> }
                    : { label: "正常", className: "bg-matcha-100 text-matcha-700", icon: <Package className="w-3.5 h-3.5" /> };

                return (
                  <motion.div
                    key={suggestion.materialId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: suggestion.materialColor + "30" }}
                      >
                        {suggestion.materialIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-coffee-800 truncate">{suggestion.materialName}</h4>
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", urgency.className)}>
                            {urgency.icon}
                            {urgency.label}
                          </span>
                          {suggestion.isVolatile && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-xs font-medium">
                              <TrendingUp className="w-3.5 h-3.5" />
                              建议多备
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-coffee-400 mt-0.5">{categoryLabels[suggestion.category]}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="bg-coffee-50/80 rounded-lg py-2 px-1">
                        <div className="flex items-center justify-center gap-1 text-coffee-400 text-xs mb-0.5">
                          <Package className="w-3 h-3" />
                          当前库存
                        </div>
                        <p className="font-bold text-coffee-800 text-sm">
                          {suggestion.currentStock}
                          <span className="text-xs font-normal text-coffee-500 ml-0.5">{suggestion.materialUnit}</span>
                        </p>
                      </div>
                      <div className="bg-coffee-50/80 rounded-lg py-2 px-1">
                        <div className="flex items-center justify-center gap-1 text-coffee-400 text-xs mb-0.5">
                          <BarChart3 className="w-3 h-3" />
                          月均消耗
                        </div>
                        <p className="font-bold text-coffee-800 text-sm">
                          {suggestion.threeMonthAverage}
                          <span className="text-xs font-normal text-coffee-500 ml-0.5">{suggestion.materialUnit}</span>
                        </p>
                      </div>
                      <div className="bg-coffee-50/80 rounded-lg py-2 px-1">
                        <div className="flex items-center justify-center gap-1 text-coffee-400 text-xs mb-0.5">
                          <Clock className="w-3 h-3" />
                          可支撑
                        </div>
                        <p className={cn(
                          "font-bold text-sm",
                          suggestion.estimatedDays < 7 ? "text-danger-600" : suggestion.estimatedDays < 15 ? "text-amber-600" : "text-matcha-600"
                        )}>
                          {suggestion.estimatedDays >= 999 ? "∞" : suggestion.estimatedDays}
                          <span className="text-xs font-normal ml-0.5">天</span>
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-coffee-500">消费趋势（近3月）</span>
                      </div>
                      <div className="flex items-end gap-1 h-10">
                        {suggestion.trendData.map((month, mIndex) => {
                          const maxQty = Math.max(...suggestion.trendData.map((m) => m.totalQuantity), 1);
                          const heightPercent = Math.max((month.totalQuantity / maxQty) * 100, 8);
                          return (
                            <div key={month.month} className="flex-1 flex flex-col items-center gap-0.5">
                              <div
                                className={cn(
                                  "w-full rounded-t-sm transition-all",
                                  mIndex === suggestion.trendData.length - 1
                                    ? "bg-gradient-to-t from-amber-400 to-amber-300"
                                    : "bg-coffee-200"
                                )}
                                style={{ height: `${heightPercent}%` }}
                                title={`${month.month}: ${month.totalQuantity}${suggestion.materialUnit}`}
                              />
                              <span className="text-[9px] text-coffee-400 leading-none">
                                {month.month.slice(5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-coffee-700">建议补货</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateSuggestionQuantity(suggestion.materialId, suggestedQty - 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-amber-200 text-coffee-600 hover:bg-amber-100 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            value={suggestedQty}
                            onChange={(e) => updateSuggestionQuantity(suggestion.materialId, parseInt(e.target.value) || 1)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 px-2 py-1 text-center text-sm font-bold bg-white border border-amber-200 rounded-md text-coffee-800 focus:outline-none focus:ring-1 focus:ring-amber-400"
                            min="1"
                          />
                          <button
                            onClick={() => updateSuggestionQuantity(suggestion.materialId, suggestedQty + 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-md bg-white border border-amber-200 text-coffee-600 hover:bg-amber-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <span className="text-sm text-coffee-500 ml-1">{suggestion.materialUnit}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-coffee-500">
                        <span>安全阈值：{suggestion.threshold}{suggestion.materialUnit}</span>
                        <span>预估费用：<span className="font-bold text-coffee-700">{formatCurrency(suggestedQty * suggestion.unitPrice)}</span></span>
                      </div>

                      <button
                        onClick={() => isAdmin ? applySmartSuggestionToRestock(suggestion) : applySmartSuggestionToRequest(suggestion)}
                        className={cn(
                          "w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-all shadow-sm",
                          isAdmin
                            ? "bg-gradient-to-r from-matcha-500 to-emerald-500 text-white hover:from-matcha-600 hover:to-emerald-600"
                            : "bg-gradient-to-r from-coffee-500 to-coffee-600 text-white hover:from-coffee-600 hover:to-coffee-700"
                        )}
                      >
                        {isAdmin ? (
                          <>
                            <Plus className="w-4 h-4" />
                            一键补货
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4" />
                            一键填入申请
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {!showSuggestions && filteredRestockSuggestions.length > 0 && (isCurrentDutyUser || isAdmin) && (
        <div className="mb-6">
          <button
            onClick={() => setShowSuggestions(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 border-dashed rounded-2xl text-amber-700 hover:from-amber-100 hover:to-orange-100 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">
              展开 {filteredRestockSuggestions.length} 条智能补货建议
            </span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-soft p-4 mb-6 space-y-3">
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
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-coffee-500">
            <ArrowUpDown className="w-4 h-4" />
            <span>排序：</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap overflow-x-auto scrollbar-hide">
            {sortOptions.map((option) => (
              <motion.button
                key={option.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSortBy(option.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200",
                  sortBy === option.key
                    ? "bg-amber-500 text-white shadow-soft"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                )}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </motion.button>
            ))}
          </div>
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
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700 w-10"></th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      物料
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      分类
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      可用库存
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      阈值
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      单价
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-coffee-700">
                      评分
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
                  {sortedMaterials.map((material, index) => {
                    const usableStock = getUsableStock(material.id);
                    const status = getStatusBadge(usableStock, material.threshold);
                    const pendingRequests = getPendingRequestsForMaterial(material.id);
                    const isExpanded = expandedMaterials.has(material.id);
                    const sortedBatches = getSortedBatchesByExpiry(material.id);
                    const hasExpired = sortedBatches.some(b => b.expiryInfo.isExpired && b.batch.remainingQuantity > 0);
                    const rating = getMaterialRating(material.id);

                    return (
                      <>
                        <motion.tr
                          key={material.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={cn(
                            "border-t border-coffee-50 hover:bg-coffee-50/50 transition-colors cursor-pointer",
                            isExpanded && "bg-coffee-50/30"
                          )}
                          onClick={() => toggleMaterialExpand(material.id)}
                        >
                          <td className="px-4 py-4">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-coffee-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-coffee-400" />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                style={{ backgroundColor: material.color + "20" }}
                              >
                                {material.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-coffee-800">{material.name}</p>
                                  {hasExpired && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                                      <AlertOctagon className="w-3 h-3" />
                                      有过期批次
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-coffee-400">{material.description}</p>
                                {pendingRequests.length > 0 && (
                                  <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3 inline" />
                                    {pendingRequests.length} 条待审批
                                  </p>
                                )}
                                <p className="text-xs text-coffee-400 mt-0.5">
                                  {sortedBatches.length} 个批次
                                </p>
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
                              {usableStock}
                            </span>
                            <span className="text-coffee-400 text-sm ml-1">
                              {material.unit}
                            </span>
                            {material.stock > usableStock && (
                              <p className="text-xs text-gray-400">
                                总库存 {material.stock}{material.unit}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={material.threshold}
                                onChange={(e) =>
                                  handleThresholdChange(material.id, parseInt(e.target.value) || 0)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="w-16 px-2 py-1 text-sm bg-cream-50 border border-coffee-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-coffee-400"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-coffee-600">
                            {formatCurrency(material.unitPrice)}/{material.unit}
                          </td>
                          <td className="px-6 py-4">
                            {rating.reviewCount > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={cn(
                                          "w-3.5 h-3.5 flex-shrink-0",
                                          star <= Math.round(rating.averageRating)
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-coffee-200"
                                        )}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-semibold text-amber-600">
                                    {rating.averageRating.toFixed(1)}
                                  </span>
                                </div>
                                <span className="text-xs text-coffee-400">
                                  {rating.reviewCount} 条评价
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-coffee-300">暂无评价</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("badge text-xs font-medium", status.className)}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div onClick={(e) => e.stopPropagation()}>
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
                            </div>
                          </td>
                        </motion.tr>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr
                              key={`${material.id}-batches`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-coffee-50/20"
                            >
                              <td colSpan={9} className="px-6 py-3">
                                <div className="ml-16 overflow-hidden rounded-xl border border-coffee-100 bg-white">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="bg-coffee-100/50">
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-coffee-600">
                                          生产日期
                                        </th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-coffee-600">
                                          保质期至
                                        </th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-coffee-600">
                                          入库数量
                                        </th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-coffee-600">
                                          剩余数量
                                        </th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-coffee-600">
                                          过期状态
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sortedBatches.map(({ batch, expiryInfo }) => {
                                        const styles = getBatchExpiryStyles(expiryInfo.status);
                                        const canConsume = !expiryInfo.isExpired && batch.remainingQuantity > 0;

                                        return (
                                          <tr
                                            key={batch.id}
                                            className={cn(
                                              "border-t border-coffee-50 transition-colors",
                                              styles.row
                                            )}
                                          >
                                            <td className="px-4 py-2 text-coffee-600">
                                              <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-coffee-400" />
                                                {batch.productionDate}
                                              </div>
                                            </td>
                                            <td className="px-4 py-2 text-coffee-600">
                                              <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-coffee-400" />
                                                {batch.expiryDate}
                                              </div>
                                            </td>
                                            <td className="px-4 py-2 text-coffee-600">
                                              {batch.quantity}{material.unit}
                                            </td>
                                            <td className="px-4 py-2">
                                              <span className={cn(
                                                "font-medium",
                                                canConsume ? "text-coffee-800" : "text-gray-400 line-through"
                                              )}>
                                                {batch.remainingQuantity}{material.unit}
                                              </span>
                                            </td>
                                            <td className="px-4 py-2">
                                              <span className={cn(
                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                                styles.badge
                                              )}>
                                                {expiryInfo.isExpired ? (
                                                  <AlertOctagon className="w-3 h-3" />
                                                ) : expiryInfo.isExpiringSoon ? (
                                                  <AlertTriangle className="w-3 h-3" />
                                                ) : null}
                                                {formatExpiryStatus(expiryInfo)}
                                              </span>
                                              {expiryInfo.isExpired && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                  已过期，不可取用
                                                </p>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                      {sortedBatches.length === 0 && (
                                        <tr>
                                          <td colSpan={5} className="px-4 py-4 text-center text-coffee-400 text-sm">
                                            暂无批次记录
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </>
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
        onClose={() => {
          if (batchMode) {
            cancelBatchMode();
          } else {
            setRestockModalOpen(false);
          }
        }}
        title={batchMode ? `批量补货 (${batchIndex + 1}/${filteredRestockSuggestions.length}) - ${selectedMaterial?.name}` : `补货 - ${selectedMaterial?.name}`}
      >
        {selectedMaterial && (
          <div className="space-y-4">
            {batchMode && (
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <Zap className="w-4 h-4" />
                  <span>
                    批量处理中：第 <span className="font-bold">{batchIndex + 1}</span> / {filteredRestockSuggestions.length} 项
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${((batchIndex + 1) / filteredRestockSuggestions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

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
                  当前可用：{getUsableStock(selectedMaterial.id)} {selectedMaterial.unit}
                </p>
                <p className="text-sm text-coffee-500">
                  单价：{formatCurrency(selectedMaterial.unitPrice)}/{selectedMaterial.unit}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-coffee-700">
                  批次信息
                </label>
                <button
                  type="button"
                  onClick={addRestockBatch}
                  className="inline-flex items-center gap-1 text-sm text-coffee-600 hover:text-coffee-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  添加批次
                </button>
              </div>

              {restockBatches.map((batch, bIndex) => {
                const expiryInfo = batch.productionDate && batch.expiryDate
                  ? getBatchExpiryInfo(batch.expiryDate)
                  : null;
                const qtyNum = parseInt(batch.quantity);

                return (
                  <div
                    key={batch.id}
                    className="p-4 border border-coffee-200 rounded-xl bg-cream-50/50 space-y-3 relative"
                  >
                    {restockBatches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRestockBatch(batch.id)}
                        className="absolute top-2 right-2 p-1 text-coffee-400 hover:text-danger-500 transition-colors rounded-lg hover:bg-danger-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-coffee-600">
                        批次 {bIndex + 1}
                      </p>
                      {expiryInfo && !isNaN(qtyNum) && qtyNum > 0 && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          expiryInfo.isExpired
                            ? "bg-gray-200 text-gray-600"
                            : expiryInfo.isExpiringSoon
                            ? "bg-amber-100 text-amber-700"
                            : "bg-matcha-100 text-matcha-700"
                        )}>
                          {formatExpiryStatus(expiryInfo)}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-coffee-600 mb-1">
                          生产日期
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400" />
                          <input
                            type="date"
                            value={batch.productionDate}
                            onChange={(e) => {
                              updateRestockBatch(batch.id, "productionDate", e.target.value);
                            }}
                            onBlur={() => autoCalculateExpiry(batch.id)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-400"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-coffee-600 mb-1">
                          保质期至
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-coffee-400" />
                          <input
                            type="date"
                            value={batch.expiryDate}
                            onChange={(e) => updateRestockBatch(batch.id, "expiryDate", e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-coffee-600 mb-1">
                        入库数量
                      </label>
                      <input
                        type="number"
                        value={batch.quantity}
                        onChange={(e) => updateRestockBatch(batch.id, "quantity", e.target.value)}
                        placeholder={`输入该批次入库数量（${selectedMaterial.unit}）`}
                        className="w-full px-4 py-2 text-sm bg-white border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-400"
                        min="1"
                      />
                    </div>
                  </div>
                );
              })}
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

            <div className="pt-2 space-y-2">
              <button onClick={handleRestock} className="w-full btn-success">
                {batchMode ? "确认补货，下一个" : "确认补货"}
              </button>
              {batchMode && (
                <div className="flex gap-2">
                  <button
                    onClick={handleNextBatchItem}
                    className="flex-1 py-2.5 text-sm font-medium text-coffee-600 bg-coffee-50 rounded-lg hover:bg-coffee-100 transition-colors"
                  >
                    跳过此项
                  </button>
                  <button
                    onClick={cancelBatchMode}
                    className="flex-1 py-2.5 text-sm font-medium text-danger-600 bg-danger-50 rounded-lg hover:bg-danger-100 transition-colors"
                  >
                    取消批量
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={requestModalOpen}
        onClose={() => {
          if (batchMode) {
            cancelBatchMode();
          } else {
            setRequestModalOpen(false);
          }
        }}
        title={batchMode ? `批量申请补货 (${batchIndex + 1}/${filteredRestockSuggestions.length}) - ${selectedMaterial?.name}` : `申请补货 - ${selectedMaterial?.name}`}
      >
        {selectedMaterial && (
          <div className="space-y-4">
            {batchMode && (
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <Zap className="w-4 h-4" />
                  <span>
                    批量处理中：第 <span className="font-bold">{batchIndex + 1}</span> / {filteredRestockSuggestions.length} 项
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${((batchIndex + 1) / filteredRestockSuggestions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

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
                当前可用：{getUsableStock(selectedMaterial.id)} {selectedMaterial.unit}
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
              {batchMode ? "提交申请，下一个" : "提交申请"}
            </button>
            {batchMode && (
              <div className="flex gap-2">
                <button
                  onClick={handleNextBatchItem}
                  className="flex-1 py-2.5 text-sm font-medium text-coffee-600 bg-coffee-50 rounded-lg hover:bg-coffee-100 transition-colors"
                >
                  跳过此项
                </button>
                <button
                  onClick={cancelBatchMode}
                  className="flex-1 py-2.5 text-sm font-medium text-danger-600 bg-danger-50 rounded-lg hover:bg-danger-100 transition-colors"
                >
                  取消批量
                </button>
              </div>
            )}
            {!batchMode && (
              <p className="text-xs text-coffee-400 text-center">
                提交后需管理员审批通过后才会生效
              </p>
            )}
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
