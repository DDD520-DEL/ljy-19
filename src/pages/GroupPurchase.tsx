import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Users,
  Clock,
  Check,
  Link2,
  Minus,
  ChevronRight,
  Lock,
  PackageOpen,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useGroupPurchaseStore } from "@/store/useGroupPurchaseStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useUserStore } from "@/store/useUserStore";
import { useConsumptionStore } from "@/store/useConsumptionStore";
import { cn } from "@/lib/utils";
import { formatCurrency, timeAgo, formatDate } from "@/utils/date";
import type { GroupPurchase, GroupPurchaseParticipantItem } from "@/types";

type TabKey = "active" | "closed" | "settled";

export default function GroupPurchase() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGP, setSelectedGP] = useState<GroupPurchase | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  const { currentUser, getUserById } = useUserStore();
  const { materials, getUsableStock } = useMaterialStore();
  const { addConsumption } = useConsumptionStore();
  const {
    getActiveGroupPurchases,
    getClosedGroupPurchases,
    getSettledGroupPurchases,
    getGroupPurchaseByShareCode,
    getLockedQuantityForMaterial,
    getAvailableStockForMaterial,
    hasUserJoined,
    createGroupPurchase,
    joinGroupPurchase,
    closeGroupPurchase,
    settleGroupPurchase,
    checkAndSettleExpired,
  } = useGroupPurchaseStore();

  useEffect(() => {
    const timer = setInterval(() => {
      checkAndSettleExpired();
    }, 30000);
    checkAndSettleExpired();
    return () => clearInterval(timer);
  }, [checkAndSettleExpired]);

  useEffect(() => {
    const joinCode = searchParams.get("join");
    if (joinCode) {
      const gp = getGroupPurchaseByShareCode(joinCode);
      if (gp && gp.status === "active") {
        setSelectedGP(gp);
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

  const handleViewDetail = (gp: GroupPurchase) => {
    setSelectedGP(gp);
    setShowDetailModal(true);
  };

  const handleCloseGP = (gpId: string) => {
    closeGroupPurchase(gpId);
    setShowDetailModal(false);
    showToast("拼单已提前截止", "info");
  };

  const handleSettleGP = (gp: GroupPurchase) => {
    if (!currentUser) return;

    const materialStore = useMaterialStore.getState();

    const materialTotals: Record<string, number> = {};
    gp.participants.forEach((p) => {
      p.items.forEach((item) => {
        materialTotals[item.materialId] = (materialTotals[item.materialId] || 0) + item.quantity;
      });
    });

    for (const [materialId, totalQty] of Object.entries(materialTotals)) {
      const usable = materialStore.getUsableStock(materialId);
      const locked = getLockedQuantityForMaterial(materialId);
      const actualAvailable = usable - locked + (materialTotals[materialId] || 0);
      if (actualAvailable < totalQty) {
        const material = materials.find((m) => m.id === materialId);
        showToast(`库存不足：${material?.name || "物料"}需要 ${totalQty}，可用 ${actualAvailable}`, "error");
        return;
      }
    }

    for (const [materialId, totalQty] of Object.entries(materialTotals)) {
      const success = materialStore.consumeMaterial(materialId, totalQty);
      if (!success) {
        const material = materials.find((m) => m.id === materialId);
        showToast(`扣减库存失败：${material?.name || "物料"}`, "error");
        return;
      }
    }

    gp.participants.forEach((p) => {
      p.items.forEach((item) => {
        addConsumption(p.userId, item.materialId, item.quantity);
      });
    });

    const settledGP = settleGroupPurchase(gp.id);
    if (settledGP) {
      setShowDetailModal(false);
      showToast("拼单已结算，库存已扣减，消费已记录", "success");
    } else {
      showToast("结算失败，拼单状态异常", "error");
    }
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "active", label: "进行中", count: getActiveGroupPurchases().length },
    { key: "closed", label: "待结算", count: getClosedGroupPurchases().length },
    { key: "settled", label: "已结算", count: getSettledGroupPurchases().length },
  ];

  const displayList =
    activeTab === "active"
      ? getActiveGroupPurchases()
      : activeTab === "closed"
      ? getClosedGroupPurchases()
      : getSettledGroupPurchases();

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
          <h2 className="text-2xl font-bold text-coffee-800">团队拼单</h2>
          <p className="text-sm text-coffee-500 mt-1">发起拼单，和同事一起分享饮品</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-coffee-700 text-white rounded-xl font-medium shadow-soft hover:bg-coffee-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          发起拼单
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
              <p className="text-coffee-400 font-medium">暂无{tabs.find((t) => t.key === activeTab)?.label}的拼单</p>
              {activeTab === "active" && (
                <p className="text-sm text-coffee-300 mt-1">点击右上角按钮发起一个拼单吧</p>
              )}
            </div>
          )}

          {displayList.map((gp) => (
            <GroupPurchaseCard
              key={gp.id}
              gp={gp}
              getUserById={getUserById}
              materials={materials}
              onViewDetail={handleViewDetail}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {showCreateModal && (
        <CreateGroupPurchaseModal
          materials={materials}
          getUsableStock={getUsableStock}
          getAvailableStockForMaterial={getAvailableStockForMaterial}
          currentUser={currentUser}
          showToast={showToast}
          onClose={() => setShowCreateModal(false)}
          onCreate={(materialIds, deadline) => {
            if (!currentUser) return;
            const newGP = createGroupPurchase(currentUser.id, materialIds, deadline);
            setShowCreateModal(false);
            showToast(`拼单已创建！分享码: ${newGP.shareCode}`, "success");
          }}
        />
      )}

      {showJoinModal && selectedGP && (
        <JoinGroupPurchaseModal
          gp={selectedGP}
          materials={materials}
          currentUser={currentUser}
          getAvailableStockForMaterial={getAvailableStockForMaterial}
          hasUserJoined={hasUserJoined}
          showToast={showToast}
          onClose={() => {
            setShowJoinModal(false);
            setSelectedGP(null);
          }}
          onJoin={(items) => {
            if (!currentUser) return;
            const success = joinGroupPurchase(selectedGP.id, currentUser.id, items);
            if (success) {
              setShowJoinModal(false);
              setSelectedGP(null);
              showToast("已加入拼单！", "success");
            } else {
              showToast("加入失败，请检查拼单状态", "error");
            }
          }}
        />
      )}

      {showDetailModal && selectedGP && (
        <GroupPurchaseDetailModal
          gp={selectedGP}
          materials={materials}
          currentUser={currentUser}
          getUserById={getUserById}
          getUsableStock={getUsableStock}
          getLockedQuantityForMaterial={getLockedQuantityForMaterial}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedGP(null);
          }}
          onCloseGP={handleCloseGP}
          onSettleGP={handleSettleGP}
        />
      )}
    </div>
  );
}

function GroupPurchaseCard({
  gp,
  getUserById,
  materials,
  onViewDetail,
}: {
  gp: GroupPurchase;
  getUserById: (id: string) => { name: string; avatar?: string } | undefined;
  materials: { id: string; name: string; icon: string; unit: string; unitPrice: number }[];
  onViewDetail: (gp: GroupPurchase) => void;
}) {
  const creator = getUserById(gp.creatorId);
  const isExpired = new Date(gp.deadline) <= new Date();

  const hasAnyLocked = gp.materialIds.some((mid) => {
    const participantQty = gp.participants.reduce((s, p) => {
      const item = p.items.find((i) => i.materialId === mid);
      return s + (item?.quantity || 0);
    }, 0);
    return participantQty > 0;
  });

  const statusConfig = {
    active: { label: "进行中", color: "bg-matcha-100 text-matcha-700" },
    closed: { label: "待结算", color: "bg-amber-100 text-amber-700" },
    settled: { label: "已结算", color: "bg-coffee-100 text-coffee-600" },
  };
  const statusInfo = statusConfig[gp.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-soft p-5 hover:shadow-medium transition-shadow cursor-pointer"
      onClick={() => onViewDetail(gp)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-coffee-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-coffee-800">{creator?.name || "未知"}</span>
              <span className="text-xs text-coffee-400">发起的拼单</span>
            </div>
            <p className="text-xs text-coffee-400">{timeAgo(gp.createdAt)}</p>
          </div>
        </div>
        <span className={cn("px-2.5 py-1 text-xs font-semibold rounded-full", statusInfo.color)}>
          {statusInfo.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {gp.materialIds.map((mid) => {
          const m = materials.find((mat) => mat.id === mid);
          if (!m) return null;
          const participantQty = gp.participants.reduce((s, p) => {
            const item = p.items.find((i) => i.materialId === mid);
            return s + (item?.quantity || 0);
          }, 0);
          return (
            <div key={mid} className="flex items-center gap-1.5 px-3 py-1.5 bg-coffee-50 rounded-lg">
              <span className="text-sm">{m.icon}</span>
              <span className="text-sm font-medium text-coffee-700">{m.name}</span>
              {participantQty > 0 && (
                <span className="text-xs text-coffee-400">已锁定 {participantQty}{m.unit}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-coffee-500">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{gp.participants.length} 人参与</span>
          </div>
          {gp.status === "active" && (
            <div className={cn("flex items-center gap-1", isExpired ? "text-danger-500" : "text-coffee-500")}>
              <Clock className="w-4 h-4" />
              <span>{isExpired ? "已到期" : `截止 ${formatDate(new Date(gp.deadline), "MM-DD HH:mm")}`}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {gp.status === "active" && hasAnyLocked && (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
              <Lock className="w-3 h-3 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">库存锁定中</span>
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-coffee-300" />
        </div>
      </div>
    </motion.div>
  );
}

function CreateGroupPurchaseModal({
  materials,
  getUsableStock,
  getAvailableStockForMaterial,
  currentUser,
  showToast,
  onClose,
  onCreate,
}: {
  materials: { id: string; name: string; icon: string; unit: string; category: string; unitPrice: number }[];
  getUsableStock: (id: string) => number;
  getAvailableStockForMaterial: (id: string, usableStock: number) => number;
  currentUser: { id: string; name: string } | null;
  showToast: (message: string, type?: ToastType) => void;
  onClose: () => void;
  onCreate: (materialIds: string[], deadline: string) => void;
}) {
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("18:00");

  useEffect(() => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    setDeadlineDate(formatDate(now, "YYYY-MM-DD"));
  }, []);

  const toggleMaterial = (id: string) => {
    setSelectedMaterials((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!currentUser) {
      showToast("请先选择用户身份", "warning");
      return;
    }
    if (selectedMaterials.size === 0) {
      showToast("请至少选择一种物料", "warning");
      return;
    }
    if (!deadlineDate) {
      showToast("请选择截止日期", "warning");
      return;
    }

    const deadline = new Date(`${deadlineDate}T${deadlineTime}`);
    if (deadline <= new Date()) {
      showToast("截止时间必须晚于当前时间", "warning");
      return;
    }

    onCreate(Array.from(selectedMaterials), deadline.toISOString());
  };

  const deadline = deadlineDate ? new Date(`${deadlineDate}T${deadlineTime}`) : null;
  const isDeadlineValid = deadline && deadline > new Date();

  return (
    <Modal isOpen={true} onClose={onClose} title="发起拼单">
      <div className="space-y-5">
        {!currentUser && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            请先在个人中心选择用户身份
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-coffee-700 mb-2">选择物料</label>
          <p className="text-xs text-coffee-400 mb-3">选择拼单包含的物料种类</p>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {materials.map((m) => {
              const usable = getUsableStock(m.id);
              const available = getAvailableStockForMaterial(m.id, usable);
              const isSelected = selectedMaterials.has(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMaterial(m.id)}
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
                      可用 {available}{m.unit}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
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

        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={selectedMaterials.size === 0 || !isDeadlineValid || !currentUser}
            className={cn(
              "w-full py-3 rounded-xl font-medium transition-all duration-200",
              selectedMaterials.size > 0 && isDeadlineValid && currentUser
                ? "bg-coffee-700 text-white hover:bg-coffee-800 shadow-soft"
                : "bg-coffee-100 text-coffee-300 cursor-not-allowed"
            )}
          >
            创建拼单
          </button>
        </div>
      </div>
    </Modal>
  );
}

function JoinGroupPurchaseModal({
  gp,
  materials,
  currentUser,
  getAvailableStockForMaterial,
  hasUserJoined,
  showToast,
  onClose,
  onJoin,
}: {
  gp: GroupPurchase;
  materials: { id: string; name: string; icon: string; unit: string; unitPrice: number }[];
  currentUser: { id: string; name: string } | null;
  getAvailableStockForMaterial: (id: string, usableStock: number) => number;
  hasUserJoined: (gpId: string, userId: string) => boolean;
  showToast: (message: string, type?: ToastType) => void;
  onClose: () => void;
  onJoin: (items: GroupPurchaseParticipantItem[]) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    const init: Record<string, number> = {};
    gp.materialIds.forEach((mid) => {
      init[mid] = 1;
    });
    setQuantities(init);
  }, [gp.materialIds]);

  if (!currentUser) {
    return (
      <Modal isOpen={true} onClose={onClose} title="加入拼单">
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          请先在个人中心选择用户身份
        </div>
      </Modal>
    );
  }

  if (hasUserJoined(gp.id, currentUser.id)) {
    return (
      <Modal isOpen={true} onClose={onClose} title="加入拼单">
        <div className="flex items-center gap-2 p-3 bg-matcha-50 rounded-xl text-sm text-matcha-700">
          <Check className="w-4 h-4 flex-shrink-0" />
          你已加入此拼单
        </div>
      </Modal>
    );
  }

  const adjustQuantity = (materialId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[materialId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [materialId]: next };
    });
  };

  const handleSubmit = () => {
    const items: GroupPurchaseParticipantItem[] = [];
    for (const [materialId, quantity] of Object.entries(quantities)) {
      if (quantity > 0) {
        items.push({ materialId, quantity });
      }
    }
    if (items.length === 0) {
      showToast("请至少选择一种物料的数量", "warning");
      return;
    }

    const materialStore = useMaterialStore.getState();
    for (const item of items) {
      const usable = materialStore.getUsableStock(item.materialId);
      const available = getAvailableStockForMaterial(item.materialId, usable);
      if (item.quantity > available) {
        const mat = materials.find((mt) => mt.id === item.materialId);
        showToast(`${mat?.name || "物料"}库存不足，可用 ${available}${mat?.unit || ""}`, "error");
        return;
      }
    }

    onJoin(items);
  };

  const totalCost = Object.entries(quantities).reduce((sum, [mid, qty]) => {
    const m = materials.find((mat) => mat.id === mid);
    return sum + (m ? qty * m.unitPrice : 0);
  }, 0);

  const hasAnyItem = Object.values(quantities).some((q) => q > 0);

  return (
    <Modal isOpen={true} onClose={onClose} title="加入拼单">
      <div className="space-y-4">
        <div className="p-3 bg-coffee-50 rounded-xl">
          <p className="text-sm text-coffee-600">
            分享码：<span className="font-bold text-coffee-800">{gp.shareCode}</span>
          </p>
          <p className="text-xs text-coffee-400 mt-1">
            截止：{formatDate(new Date(gp.deadline), "YYYY-MM-DD HH:mm")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-700 mb-2">选择数量</label>
          <div className="space-y-3">
            {gp.materialIds.map((mid) => {
              const m = materials.find((mat) => mat.id === mid);
              if (!m) return null;
              const qty = quantities[mid] || 0;
              const materialStore = useMaterialStore.getState();
              const usable = materialStore.getUsableStock(mid);
              const available = getAvailableStockForMaterial(mid, usable);
              return (
                <div key={mid} className="flex items-center justify-between p-3 bg-coffee-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-coffee-700">{m.name}</p>
                      <p className="text-xs text-coffee-400">
                        {formatCurrency(m.unitPrice)}/{m.unit} · 可用 {available}{m.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustQuantity(mid, -1)}
                      className="w-8 h-8 rounded-lg bg-white border border-coffee-200 flex items-center justify-center hover:bg-coffee-100 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-coffee-500" />
                    </button>
                    <span className="w-8 text-center font-semibold text-coffee-800">{qty}</span>
                    <button
                      onClick={() => adjustQuantity(mid, 1)}
                      disabled={qty >= available}
                      className="w-8 h-8 rounded-lg bg-white border border-coffee-200 flex items-center justify-center hover:bg-coffee-100 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4 text-coffee-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {totalCost > 0 && (
          <div className="flex items-center justify-between p-3 bg-cream-100 rounded-xl">
            <span className="text-sm text-coffee-600">预估费用</span>
            <span className="font-bold text-coffee-800">{formatCurrency(totalCost)}</span>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!hasAnyItem}
          className={cn(
            "w-full py-3 rounded-xl font-medium transition-all duration-200",
            hasAnyItem
              ? "bg-coffee-700 text-white hover:bg-coffee-800 shadow-soft"
              : "bg-coffee-100 text-coffee-300 cursor-not-allowed"
          )}
        >
          加入拼单
        </button>
      </div>
    </Modal>
  );
}

function GroupPurchaseDetailModal({
  gp,
  materials,
  currentUser,
  getUserById,
  getUsableStock,
  getLockedQuantityForMaterial,
  onClose,
  onCloseGP,
  onSettleGP,
}: {
  gp: GroupPurchase;
  materials: { id: string; name: string; icon: string; unit: string; unitPrice: number }[];
  currentUser: { id: string; name: string; avatar?: string; role: string } | null;
  getUserById: (id: string) => { name: string; avatar?: string } | undefined;
  getUsableStock: (id: string) => number;
  getLockedQuantityForMaterial: (id: string) => number;
  onClose: () => void;
  onCloseGP: (gpId: string) => void;
  onSettleGP: (gp: GroupPurchase) => void;
}) {
  const [copied, setCopied] = useState(false);

  const isCreator = currentUser?.id === gp.creatorId;
  const shareLink = `${window.location.origin}/group-purchase?join=${gp.shareCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(gp.shareCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback
      }
    }
  };

  const materialTotals: Record<string, number> = {};
  gp.participants.forEach((p) => {
    p.items.forEach((item) => {
      materialTotals[item.materialId] = (materialTotals[item.materialId] || 0) + item.quantity;
    });
  });

  return (
    <Modal isOpen={true} onClose={onClose} title="拼单详情" className="max-w-lg">
      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-coffee-50 to-cream-100 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-coffee-500">分享码</span>
            <span className="px-3 py-1 bg-white rounded-lg font-mono font-bold text-coffee-800 tracking-widest">
              {gp.shareCode}
            </span>
          </div>
          {gp.status === "active" && (
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-coffee-700 text-white rounded-xl text-sm font-medium hover:bg-coffee-800 transition-colors mt-2"
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
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-coffee-500">
            <Clock className="w-4 h-4" />
            <span>
              {gp.status === "active"
                ? `截止：${formatDate(new Date(gp.deadline), "YYYY-MM-DD HH:mm")}`
                : gp.status === "closed"
                ? `截止于：${gp.closedAt ? formatDate(new Date(gp.closedAt), "YYYY-MM-DD HH:mm") : "-"}`
                : `结算于：${gp.settledAt ? formatDate(new Date(gp.settledAt), "YYYY-MM-DD HH:mm") : "-"}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-coffee-500">
            <Users className="w-4 h-4" />
            <span>{gp.participants.length} 人参与</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-coffee-700 mb-2">物料汇总</h4>
          <div className="space-y-2">
            {gp.materialIds.map((mid) => {
              const m = materials.find((mat) => mat.id === mid);
              if (!m) return null;
              const totalQty = materialTotals[mid] || 0;
              const usable = getUsableStock(mid);
              const locked = getLockedQuantityForMaterial(mid);
              return (
                <div key={mid} className="flex items-center justify-between p-3 bg-coffee-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{m.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-coffee-700">{m.name}</p>
                      <p className="text-xs text-coffee-400">
                        库存 {usable}{m.unit}
                        {locked > 0 && <span className="text-amber-500"> · 锁定 {locked}{m.unit}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-coffee-800">{totalQty}{m.unit}</span>
                    {totalQty > 0 && gp.status !== "settled" && (
                      <div className="flex items-center gap-1 text-xs text-amber-500">
                        <Lock className="w-3 h-3" />
                        <span>已锁定</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {gp.participants.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-coffee-700 mb-2">参与人员</h4>
            <div className="space-y-2">
              {gp.participants.map((p) => {
                const user = getUserById(p.userId);
                const pCost = p.items.reduce((sum, item) => {
                  const m = materials.find((mat) => mat.id === item.materialId);
                  return sum + (m ? item.quantity * m.unitPrice : 0);
                }, 0);
                return (
                  <div key={p.userId} className="p-3 bg-coffee-50/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-coffee-700">
                        {user?.name || p.userId}
                      </span>
                      <span className="text-xs text-coffee-400">
                        {formatCurrency(pCost)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.items.map((item) => {
                        const m = materials.find((mat) => mat.id === item.materialId);
                        return (
                          <span key={item.materialId} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-md text-xs text-coffee-600">
                            {m?.icon} {m?.name} x{item.quantity}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {gp.participants.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-coffee-400">暂无人参与，分享拼单码邀请同事吧</p>
          </div>
        )}

        {gp.status === "active" && isCreator && (
          <button
            onClick={() => onCloseGP(gp.id)}
            className="w-full py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
          >
            提前截止拼单
          </button>
        )}

        {gp.status === "closed" && isCreator && (
          <button
            onClick={() => onSettleGP(gp)}
            className="w-full py-3 bg-coffee-700 text-white rounded-xl font-medium hover:bg-coffee-800 shadow-soft transition-colors"
          >
            确认结算（扣减库存并记录消费）
          </button>
        )}

        {gp.status === "settled" && (
          <div className="flex items-center gap-2 p-3 bg-matcha-50 rounded-xl">
            <Check className="w-5 h-5 text-matcha-600" />
            <span className="text-sm font-medium text-matcha-700">已结算完成，库存已扣减，每人消费已记录</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
