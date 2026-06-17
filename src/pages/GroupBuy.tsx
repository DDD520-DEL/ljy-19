import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Clock,
  Check,
  Link2,
  Minus,
  ChevronRight,
  Target,
  TrendingDown,
  PackageOpen,
  AlertCircle,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useGroupBuyStore } from "@/store/useGroupBuyStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";
import { formatCurrency, timeAgo, formatDate } from "@/utils/date";
import type { GroupBuyReservation } from "@/types";

type TabKey = "active" | "succeeded" | "cancelled";

const getRemainingTime = (deadline: string): { text: string; isExpired: boolean } => {
  const end = new Date(deadline).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return { text: "已到期", isExpired: true };
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  if (days > 0) return { text: `剩余 ${days}天${remainHours}小时`, isExpired: false };
  if (hours > 0) return { text: `剩余 ${hours}小时`, isExpired: false };
  const minutes = Math.floor(diff / (1000 * 60));
  return { text: `剩余 ${minutes}分钟`, isExpired: false };
};

export default function GroupBuy() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selected, setSelected] = useState<GroupBuyReservation | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [, setTick] = useState(0);

  const { currentUser, getUserById } = useUserStore();
  const { materials } = useMaterialStore();
  const {
    getActiveReservations,
    getSucceededReservations,
    getCancelledReservations,
    getReservationByShareCode,
    getTotalCommitted,
    hasUserJoined,
    createReservation,
    joinReservation,
    cancelReservation,
    checkAndSettleExpired,
  } = useGroupBuyStore();

  useEffect(() => {
    const timer = setInterval(() => {
      checkAndSettleExpired();
      setTick((t) => t + 1);
    }, 30000);
    checkAndSettleExpired();
    return () => clearInterval(timer);
  }, [checkAndSettleExpired]);

  useEffect(() => {
    const joinCode = searchParams.get("join");
    if (joinCode) {
      const r = getReservationByShareCode(joinCode);
      if (r && r.status === "active") {
        setSelected(r);
        setShowJoinModal(true);
      }
      setSearchParams({});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleViewDetail = (r: GroupBuyReservation) => {
    setSelected(r);
    setShowDetailModal(true);
  };

  const handleJoin = (r: GroupBuyReservation) => {
    setShowDetailModal(false);
    setSelected(r);
    setShowJoinModal(true);
  };

  const handleCancel = (id: string) => {
    cancelReservation(id);
    setShowDetailModal(false);
    showToast("已取消团购预约", "info");
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "active", label: "进行中", count: getActiveReservations().length },
    { key: "succeeded", label: "已成团", count: getSucceededReservations().length },
    { key: "cancelled", label: "已取消", count: getCancelledReservations().length },
  ];

  const displayList =
    activeTab === "active"
      ? getActiveReservations()
      : activeTab === "succeeded"
      ? getSucceededReservations()
      : getCancelledReservations();

  return (
    <div>
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-coffee-800">团购预约</h2>
          <p className="text-sm text-coffee-500 mt-1">
            发起物资团购，达目标份数自动生成补货单通知值班人采购
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-coffee-700 text-white rounded-xl font-medium shadow-soft hover:bg-coffee-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          发起团购
        </motion.button>
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-1 mb-6 flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
              activeTab === tab.key
                ? "bg-coffee-700 text-white shadow-soft"
                : "text-coffee-500 hover:text-coffee-700"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-xs font-bold rounded-full",
                  activeTab === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-coffee-100 text-coffee-600"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {displayList.length === 0 && (
            <div className="text-center py-16">
              <PackageOpen className="w-16 h-16 text-coffee-200 mx-auto mb-4" />
              <p className="text-coffee-400 font-medium">
                暂无{tabs.find((t) => t.key === activeTab)?.label}的团购
              </p>
              {activeTab === "active" && (
                <p className="text-sm text-coffee-300 mt-1">点击右上角按钮发起一个团购预约吧</p>
              )}
            </div>
          )}

          {displayList.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              materials={materials}
              getUserById={getUserById}
              getTotalCommitted={getTotalCommitted}
              currentUser={currentUser}
              hasUserJoined={hasUserJoined}
              onViewDetail={handleViewDetail}
              onJoin={handleJoin}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {showCreateModal && (
        <CreateReservationModal
          materials={materials}
          currentUser={currentUser}
          showToast={showToast}
          onClose={() => setShowCreateModal(false)}
          onCreate={(materialId, unitPrice, targetQuantity, deadline, title) => {
            if (!currentUser) return;
            const newR = createReservation(
              currentUser.id,
              materialId,
              unitPrice,
              targetQuantity,
              deadline,
              title
            );
            setShowCreateModal(false);
            showToast(`团购已创建！分享码: ${newR.shareCode}`, "success");
          }}
        />
      )}

      {showJoinModal && selected && (
        <JoinReservationModal
          reservation={selected}
          materials={materials}
          currentUser={currentUser}
          getTotalCommitted={getTotalCommitted}
          hasUserJoined={hasUserJoined}
          showToast={showToast}
          onClose={() => {
            setShowJoinModal(false);
            setSelected(null);
          }}
          onJoin={(quantity) => {
            if (!currentUser) return;
            const success = joinReservation(selected.id, currentUser.id, quantity);
            if (success) {
              setShowJoinModal(false);
              setSelected(null);
              showToast("已参与团购预约！", "success");
            } else {
              showToast("参与失败，请检查团购状态", "error");
            }
          }}
        />
      )}

      {showDetailModal && selected && (
        <ReservationDetailModal
          reservation={selected}
          materials={materials}
          currentUser={currentUser}
          getUserById={getUserById}
          getTotalCommitted={getTotalCommitted}
          hasUserJoined={hasUserJoined}
          onClose={() => {
            setShowDetailModal(false);
            setSelected(null);
          }}
          onJoin={handleJoin}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

function ProgressBar({
  committed,
  target,
  reached,
}: {
  committed: number;
  target: number;
  reached: boolean;
}) {
  const percentage = target > 0 ? Math.min(100, (committed / target) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-coffee-500">
          已预约 <span className="text-coffee-800 font-bold">{committed}</span> / {target}
        </span>
        <span
          className={cn(
            "text-xs font-bold",
            reached ? "text-matcha-600" : percentage >= 50 ? "text-amber-600" : "text-coffee-500"
          )}
        >
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 bg-coffee-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            reached ? "bg-matcha-500" : percentage >= 50 ? "bg-amber-500" : "bg-coffee-500"
          )}
        />
      </div>
    </div>
  );
}

function ReservationCard({
  reservation,
  materials,
  getUserById,
  getTotalCommitted,
  currentUser,
  hasUserJoined,
  onViewDetail,
  onJoin,
}: {
  reservation: GroupBuyReservation;
  materials: { id: string; name: string; icon: string; unit: string; unitPrice: number; color: string }[];
  getUserById: (id: string) => { name: string; avatar?: string } | undefined;
  getTotalCommitted: (id: string) => number;
  currentUser: { id: string } | null;
  hasUserJoined: (id: string, userId: string) => boolean;
  onViewDetail: (r: GroupBuyReservation) => void;
  onJoin: (r: GroupBuyReservation) => void;
}) {
  const material = materials.find((m) => m.id === reservation.materialId);
  const creator = getUserById(reservation.creatorId);
  const committed = getTotalCommitted(reservation.id);
  const reached = committed >= reservation.targetQuantity;
  const { text: remainingText, isExpired } = getRemainingTime(reservation.deadline);
  const joined = currentUser ? hasUserJoined(reservation.id, currentUser.id) : false;
  const discount =
    material && material.unitPrice > reservation.unitPrice
      ? Math.round((1 - reservation.unitPrice / material.unitPrice) * 100)
      : 0;

  const statusConfig = {
    active: { label: "进行中", color: "bg-matcha-100 text-matcha-700" },
    succeeded: { label: "已成团", color: "bg-coffee-100 text-coffee-600" },
    cancelled: { label: "已取消", color: "bg-danger-100 text-danger-600" },
  };
  const statusInfo = statusConfig[reservation.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-soft p-5 hover:shadow-medium transition-shadow"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: (material?.color || "#ddd") + "25" }}
          >
            {material?.icon || "📦"}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-coffee-800 truncate">{reservation.title}</span>
              {discount > 0 && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-danger-50 text-danger-600 text-xs font-bold rounded-full">
                  <TrendingDown className="w-3 h-3" />
                  省{discount}%
                </span>
              )}
            </div>
            <p className="text-xs text-coffee-400 truncate">
              {material?.name || "未知物料"} · {creator?.name || "未知"} 发起 · {timeAgo(reservation.createdAt)}
            </p>
          </div>
        </div>
        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0", statusInfo.color)}>
          {statusInfo.label}
        </span>
      </div>

      <div className="mb-3">
        <ProgressBar committed={committed} target={reservation.targetQuantity} reached={reached} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4 text-sm text-coffee-500">
          <div className="flex items-center gap-1">
            <span className="text-coffee-400">优惠价</span>
            <span className="font-bold text-coffee-800">
              {formatCurrency(reservation.unitPrice)}
            </span>
            <span className="text-xs text-coffee-400">/{material?.unit || "份"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{reservation.participants.length} 人</span>
          </div>
          {reservation.status === "active" && (
            <div
              className={cn(
                "flex items-center gap-1",
                isExpired ? "text-danger-500" : "text-coffee-500"
              )}
            >
              <Clock className="w-4 h-4" />
              <span>{remainingText}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {reservation.status === "active" && !joined && (
            <button
              onClick={() => onJoin(reservation)}
              className="px-3 py-1.5 bg-coffee-700 text-white text-sm font-medium rounded-lg hover:bg-coffee-800 transition-colors"
            >
              参与预约
            </button>
          )}
          {reservation.status === "active" && joined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-matcha-50 text-matcha-700 text-xs font-medium rounded-lg">
              <Check className="w-3.5 h-3.5" />
              已参与
            </span>
          )}
          <button
            onClick={() => onViewDetail(reservation)}
            className="flex items-center gap-1 px-2 py-1.5 text-coffee-500 text-sm hover:text-coffee-700 transition-colors"
          >
            详情
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CreateReservationModal({
  materials,
  currentUser,
  showToast,
  onClose,
  onCreate,
}: {
  materials: { id: string; name: string; icon: string; unit: string; unitPrice: number; color: string; category: string }[];
  currentUser: { id: string; name: string } | null;
  showToast: (message: string, type?: ToastType) => void;
  onClose: () => void;
  onCreate: (
    materialId: string,
    unitPrice: number,
    targetQuantity: number,
    deadline: string,
    title: string
  ) => void;
}) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("20:00");

  useEffect(() => {
    const now = new Date();
    now.setDate(now.getDate() + 2);
    setDeadlineDate(formatDate(now, "YYYY-MM-DD"));
  }, []);

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId) || null;

  const handleSelectMaterial = (id: string) => {
    const m = materials.find((mat) => mat.id === id);
    if (!m) return;
    setSelectedMaterialId(id);
    if (!title) setTitle(m.name);
    if (!unitPrice) setUnitPrice(m.unitPrice.toFixed(2));
  };

  const deadline = deadlineDate ? new Date(`${deadlineDate}T${deadlineTime}`) : null;
  const isDeadlineValid = deadline && deadline > new Date();

  const parsedUnitPrice = parseFloat(unitPrice);
  const parsedTarget = parseInt(targetQuantity, 10);
  const discount =
    selectedMaterial && parsedUnitPrice > 0 && selectedMaterial.unitPrice > parsedUnitPrice
      ? Math.round((1 - parsedUnitPrice / selectedMaterial.unitPrice) * 100)
      : 0;
  const totalCost =
    !isNaN(parsedTarget) && !isNaN(parsedUnitPrice) ? parsedTarget * parsedUnitPrice : 0;

  const canSubmit =
    !!selectedMaterialId &&
    !!title.trim() &&
    !isNaN(parsedUnitPrice) &&
    parsedUnitPrice > 0 &&
    !isNaN(parsedTarget) &&
    parsedTarget > 0 &&
    !!isDeadlineValid &&
    !!currentUser;

  const handleSubmit = () => {
    if (!currentUser) {
      showToast("请先选择用户身份", "warning");
      return;
    }
    if (!selectedMaterialId) {
      showToast("请选择团购物料", "warning");
      return;
    }
    if (!title.trim()) {
      showToast("请填写团购标题", "warning");
      return;
    }
    if (isNaN(parsedUnitPrice) || parsedUnitPrice <= 0) {
      showToast("请填写有效的单价", "warning");
      return;
    }
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      showToast("请填写有效的目标份数", "warning");
      return;
    }
    if (!isDeadlineValid) {
      showToast("截止时间必须晚于当前时间", "warning");
      return;
    }
    onCreate(
      selectedMaterialId,
      parsedUnitPrice,
      parsedTarget,
      deadline!.toISOString(),
      title.trim()
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="发起团购预约">
      <div className="space-y-5">
        {!currentUser && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            请先在个人中心选择用户身份
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-coffee-700 mb-2">选择物料</label>
          <p className="text-xs text-coffee-400 mb-3">批量采购某种物资享优惠价</p>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {materials.map((m) => {
              const isSelected = selectedMaterialId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelectMaterial(m.id)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl transition-all duration-200 text-left",
                    isSelected
                      ? "bg-coffee-700 text-white shadow-soft"
                      : "bg-coffee-50 text-coffee-700 hover:bg-coffee-100"
                  )}
                >
                  <span className="text-lg">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className={cn("text-xs", isSelected ? "text-white/70" : "text-coffee-400")}>
                      原价 {formatCurrency(m.unitPrice)}/{m.unit}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-700 mb-2">团购标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={selectedMaterial ? `${selectedMaterial.name} 团购` : "如：咖啡豆批量团购"}
            className="w-full px-3 py-2.5 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-coffee-700 mb-2">优惠单价</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-coffee-400 text-sm">¥</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-coffee-400 mt-1">
              /{selectedMaterial?.unit || "份"}
              {discount > 0 && (
                <span className="text-danger-600 font-medium"> · 较原价省 {discount}%</span>
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-coffee-700 mb-2">目标份数</label>
            <input
              type="number"
              min="1"
              value={targetQuantity}
              onChange={(e) => setTargetQuantity(e.target.value)}
              placeholder="如：50"
              className="w-full px-3 py-2.5 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-transparent"
            />
            <p className="text-xs text-coffee-400 mt-1">达成后自动生成补货单</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-700 mb-2">截止时间</label>
          <div className="flex gap-3">
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-transparent"
            />
            <input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="w-28 px-3 py-2.5 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-transparent"
            />
          </div>
          {deadlineDate && !isDeadlineValid && (
            <p className="text-xs text-danger-500 mt-1">截止时间必须晚于当前时间</p>
          )}
        </div>

        {!isNaN(parsedTarget) && parsedTarget > 0 && !isNaN(parsedUnitPrice) && parsedUnitPrice > 0 && (
          <div className="flex items-center justify-between p-3 bg-cream-100 rounded-xl">
            <span className="text-sm text-coffee-600">达标后采购总额</span>
            <span className="font-bold text-coffee-800">{formatCurrency(totalCost)}</span>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "w-full py-3 rounded-xl font-medium transition-all duration-200",
              canSubmit
                ? "bg-coffee-700 text-white hover:bg-coffee-800 shadow-soft"
                : "bg-coffee-100 text-coffee-300 cursor-not-allowed"
            )}
          >
            创建团购预约
          </button>
        </div>
      </div>
    </Modal>
  );
}

function JoinReservationModal({
  reservation,
  materials,
  currentUser,
  getTotalCommitted,
  hasUserJoined,
  showToast,
  onClose,
  onJoin,
}: {
  reservation: GroupBuyReservation;
  materials: { id: string; name: string; icon: string; unit: string; unitPrice: number; color: string }[];
  currentUser: { id: string; name: string } | null;
  getTotalCommitted: (id: string) => number;
  hasUserJoined: (id: string, userId: string) => boolean;
  showToast: (message: string, type?: ToastType) => void;
  onClose: () => void;
  onJoin: (quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const material = materials.find((m) => m.id === reservation.materialId);
  const committed = getTotalCommitted(reservation.id);

  if (!currentUser) {
    return (
      <Modal isOpen={true} onClose={onClose} title="参与团购预约">
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          请先在个人中心选择用户身份
        </div>
      </Modal>
    );
  }

  if (hasUserJoined(reservation.id, currentUser.id)) {
    return (
      <Modal isOpen={true} onClose={onClose} title="参与团购预约">
        <div className="flex items-center gap-2 p-3 bg-matcha-50 rounded-xl text-sm text-matcha-700">
          <Check className="w-4 h-4 flex-shrink-0" />
          你已参与此团购
        </div>
      </Modal>
    );
  }

  const adjust = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(999, prev + delta)));
  };

  const handleSubmit = () => {
    if (quantity <= 0) {
      showToast("请选择有效的份数", "warning");
      return;
    }
    onJoin(quantity);
  };

  const cost = quantity * reservation.unitPrice;

  return (
    <Modal isOpen={true} onClose={onClose} title="参与团购预约">
      <div className="space-y-4">
        <div className="p-3 bg-coffee-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{material?.icon}</span>
            <span className="font-bold text-coffee-800">{reservation.title}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-coffee-500">
            <span>
              优惠价 <span className="font-bold text-coffee-800">{formatCurrency(reservation.unitPrice)}</span>/{material?.unit || "份"}
            </span>
            <span>分享码：{reservation.shareCode}</span>
          </div>
          <p className="text-xs text-coffee-400 mt-1">
            截止：{formatDate(new Date(reservation.deadline), "YYYY-MM-DD HH:mm")}
          </p>
        </div>

        <div className="mb-1">
          <ProgressBar committed={committed} target={reservation.targetQuantity} reached={committed >= reservation.targetQuantity} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-700 mb-2">选择份数</label>
          <div className="flex items-center justify-between p-3 bg-coffee-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-coffee-700">{material?.name || "物料"}</p>
              <p className="text-xs text-coffee-400">每人限参与一次，可调整份数</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjust(-1)}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-lg bg-white border border-coffee-200 flex items-center justify-center hover:bg-coffee-100 transition-colors disabled:opacity-40"
              >
                <Minus className="w-4 h-4 text-coffee-500" />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-14 text-center font-semibold text-coffee-800 bg-white border border-coffee-200 rounded-lg py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
              />
              <button
                onClick={() => adjust(1)}
                disabled={quantity >= 999}
                className="w-8 h-8 rounded-lg bg-white border border-coffee-200 flex items-center justify-center hover:bg-coffee-100 transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4 text-coffee-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-cream-100 rounded-xl">
          <span className="text-sm text-coffee-600">预估费用</span>
          <span className="font-bold text-coffee-800">{formatCurrency(cost)}</span>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-coffee-700 text-white rounded-xl font-medium hover:bg-coffee-800 shadow-soft transition-colors"
        >
          确认参与
        </button>
      </div>
    </Modal>
  );
}

function ReservationDetailModal({
  reservation,
  materials,
  currentUser,
  getUserById,
  getTotalCommitted,
  hasUserJoined,
  onClose,
  onJoin,
  onCancel,
}: {
  reservation: GroupBuyReservation;
  materials: { id: string; name: string; icon: string; unit: string; unitPrice: number; color: string }[];
  currentUser: { id: string; name: string; avatar?: string; role: string } | null;
  getUserById: (id: string) => { name: string; avatar?: string } | undefined;
  getTotalCommitted: (id: string) => number;
  hasUserJoined: (id: string, userId: string) => boolean;
  onClose: () => void;
  onJoin: (r: GroupBuyReservation) => void;
  onCancel: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const material = materials.find((m) => m.id === reservation.materialId);
  const creator = getUserById(reservation.creatorId);
  const committed = getTotalCommitted(reservation.id);
  const reached = committed >= reservation.targetQuantity;
  const isCreator = currentUser?.id === reservation.creatorId;
  const joined = currentUser ? hasUserJoined(reservation.id, currentUser.id) : false;
  const shareLink = `${window.location.origin}/group-buy?join=${reservation.shareCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(reservation.shareCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback
      }
    }
  };

  const statusConfig = {
    active: { label: "进行中", icon: Clock, color: "text-matcha-600", bg: "bg-matcha-50" },
    succeeded: { label: "已成团", icon: CheckCircle2, color: "text-coffee-600", bg: "bg-coffee-50" },
    cancelled: { label: "已取消", icon: XCircle, color: "text-danger-600", bg: "bg-danger-50" },
  };
  const StatusIcon = statusConfig[reservation.status].icon;

  return (
    <Modal isOpen={true} onClose={onClose} title="团购详情" className="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-coffee-50 to-cream-100 rounded-xl">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: (material?.color || "#ddd") + "30" }}
          >
            {material?.icon || "📦"}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-coffee-800 truncate">{reservation.title}</h4>
            <p className="text-xs text-coffee-500">{material?.name || "未知物料"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-coffee-800">
                {formatCurrency(reservation.unitPrice)}
              </span>
              <span className="text-xs text-coffee-400">/{material?.unit || "份"}</span>
              {material && material.unitPrice > reservation.unitPrice && (
                <span className="text-xs text-coffee-400 line-through">
                  {formatCurrency(material.unitPrice)}
                </span>
              )}
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0",
              statusConfig[reservation.status].bg,
              statusConfig[reservation.status].color
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {statusConfig[reservation.status].label}
          </span>
        </div>

        <div className="p-4 bg-coffee-50 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-coffee-500" />
            <span className="text-sm font-semibold text-coffee-700">预约进度</span>
          </div>
          <ProgressBar committed={committed} target={reservation.targetQuantity} reached={reached} />
          <div className="flex items-center justify-between mt-3 text-xs text-coffee-500">
            <span>目标 {reservation.targetQuantity}{material?.unit || "份"}</span>
            <span>
              达标后采购总额约 {formatCurrency(reservation.targetQuantity * reservation.unitPrice)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-coffee-500">
            <Clock className="w-4 h-4" />
            <span>
              {reservation.status === "active"
                ? `截止：${formatDate(new Date(reservation.deadline), "YYYY-MM-DD HH:mm")}`
                : reservation.status === "succeeded"
                ? `成团于：${reservation.settledAt ? formatDate(new Date(reservation.settledAt), "YYYY-MM-DD HH:mm") : "-"}`
                : `取消于：${reservation.cancelledAt ? formatDate(new Date(reservation.cancelledAt), "YYYY-MM-DD HH:mm") : "-"}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-coffee-500">
            <Users className="w-4 h-4" />
            <span>{reservation.participants.length} 人参与</span>
          </div>
        </div>

        {reservation.status === "active" && (
          <div className="p-4 bg-gradient-to-r from-coffee-50 to-cream-100 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-coffee-500">分享码</span>
              <span className="px-3 py-1 bg-white rounded-lg font-mono font-bold text-coffee-800 tracking-widest">
                {reservation.shareCode}
              </span>
            </div>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-coffee-700 text-white rounded-xl text-sm font-medium hover:bg-coffee-800 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  复制分享链接
                </>
              )}
            </button>
          </div>
        )}

        {reservation.status === "succeeded" && reservation.restockRequestId && (
          <div className="p-4 bg-matcha-50 border border-matcha-200 rounded-xl">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-matcha-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-matcha-700">已达标，补货单已自动生成</p>
                <p className="text-xs text-matcha-600 mt-1">
                  已通知值班人下单采购，共 {committed}{material?.unit || "份"}，金额 {formatCurrency(committed * reservation.unitPrice)}
                </p>
                <Link
                  to="/restock-approval"
                  className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-coffee-700 hover:text-coffee-800"
                >
                  前往补货审批
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {reservation.status === "cancelled" && (
          <div className="flex items-center gap-2 p-3 bg-danger-50 rounded-xl">
            <XCircle className="w-5 h-5 text-danger-500" />
            <span className="text-sm text-danger-700">
              未达目标份数（{committed}/{reservation.targetQuantity}），已自动取消
            </span>
          </div>
        )}

        {reservation.participants.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-coffee-700 mb-2">参与人员</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {reservation.participants.map((p) => {
                const user = getUserById(p.userId);
                return (
                  <div
                    key={p.userId}
                    className="flex items-center justify-between p-3 bg-coffee-50/50 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-coffee-200 flex items-center justify-center text-sm font-medium text-coffee-700">
                        {user?.avatar || user?.name?.[0] || "?"}
                      </div>
                      <span className="text-sm font-medium text-coffee-700">
                        {user?.name || p.userId}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-coffee-800">
                        {p.quantity}{material?.unit || "份"}
                      </span>
                      <p className="text-xs text-coffee-400">
                        {formatCurrency(p.quantity * reservation.unitPrice)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {reservation.participants.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-coffee-400">暂无人参与，分享团购码邀请同事吧</p>
          </div>
        )}

        <div className="text-xs text-coffee-400 text-center">
          发起人：{creator?.name || "未知"}
        </div>

        {reservation.status === "active" && (
          <div className="flex items-center gap-3 pt-1">
            {!joined && (
              <button
                onClick={() => onJoin(reservation)}
                className="flex-1 py-3 bg-coffee-700 text-white rounded-xl font-medium hover:bg-coffee-800 shadow-soft transition-colors"
              >
                参与预约
              </button>
            )}
            {isCreator && (
              <button
                onClick={() => onCancel(reservation.id)}
                className="flex-1 py-3 bg-danger-50 text-danger-600 rounded-xl font-medium hover:bg-danger-100 transition-colors"
              >
                取消团购
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
