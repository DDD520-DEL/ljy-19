import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  FileText,
} from "lucide-react";
import Modal from "@/components/Modal/Modal";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useRestockRequestStore } from "@/store/useRestockRequestStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useUserStore } from "@/store/useUserStore";
import { categoryLabels, type RestockRequestStatus, type RestockRequest } from "@/types";
import { cn } from "@/lib/utils";
import { formatCurrency, timeAgo } from "@/utils/date";

const statusTabs: { key: RestockRequestStatus | "all"; label: string; icon: typeof Clock }[] = [
  { key: "all", label: "全部", icon: ClipboardList },
  { key: "pending", label: "待审批", icon: Clock },
  { key: "approved", label: "已通过", icon: CheckCircle },
  { key: "rejected", label: "已拒绝", icon: XCircle },
];

const statusConfig: Record<
  RestockRequestStatus,
  { label: string; className: string; dotClass: string }
> = {
  pending: {
    label: "待审批",
    className: "bg-amber-100 text-amber-700",
    dotClass: "bg-amber-500",
  },
  approved: {
    label: "已通过",
    className: "bg-matcha-100 text-matcha-700",
    dotClass: "bg-matcha-500",
  },
  rejected: {
    label: "已拒绝",
    className: "bg-danger-100 text-danger-600",
    dotClass: "bg-danger-500",
  },
};

export default function RestockApproval() {
  const [activeStatus, setActiveStatus] = useState<RestockRequestStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<RestockRequest | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");

  const { requests, approveRequest, rejectRequest, getPendingCount } = useRestockRequestStore();
  const { materials } = useMaterialStore();
  const { currentUser, users, getUserById } = useUserStore();

  const isAdmin = currentUser?.role === "admin";

  const filteredRequests =
    activeStatus === "all"
      ? requests
      : requests.filter((r) => r.status === activeStatus);

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleApprove = (request: RestockRequest) => {
    if (!currentUser) return;
    const success = approveRequest(request.id, currentUser.id);
    if (success) {
      const material = materials.find((m) => m.id === request.materialId);
      showToast(`已通过 ${material?.name || "物料"} 的补货申请`, "success");
    }
  };

  const openRejectModal = (request: RestockRequest) => {
    setSelectedRequest(request);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleReject = () => {
    if (!selectedRequest || !currentUser) return;

    if (!rejectReason.trim()) {
      showToast("请填写拒绝原因", "error");
      return;
    }

    const success = rejectRequest(selectedRequest.id, currentUser.id, rejectReason.trim());
    if (success) {
      const material = materials.find((m) => m.id === selectedRequest.materialId);
      showToast(`已拒绝 ${material?.name || "物料"} 的补货申请`, "success");
      setRejectModalOpen(false);
    }
  };

  const openDetailModal = (request: RestockRequest) => {
    setSelectedRequest(request);
    setDetailModalOpen(true);
  };

  const pendingCount = getPendingCount();

  const renderRequestCard = (request: RestockRequest, index: number) => {
    const material = materials.find((m) => m.id === request.materialId);
    const applicant = getUserById(request.applicantId);
    const approver = request.approverId ? getUserById(request.approverId) : null;
    const status = statusConfig[request.status];

    return (
      <motion.div
        key={request.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="bg-white rounded-2xl shadow-soft p-5 hover:shadow-medium transition-shadow"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: (material?.color || "#ddd") + "25" }}
            >
              {material?.icon || "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-bold text-coffee-800 truncate">
                  {material?.name || "未知物料"}
                </h4>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    status.className
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", status.dotClass)} />
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-coffee-500 mb-2 flex-wrap">
                <span>
                  分类：{material ? categoryLabels[material.category] : "未知"}
                </span>
                <span className="text-coffee-300">·</span>
                <span>申请人：{applicant?.name || "未知"}</span>
                <span className="text-coffee-300">·</span>
                <span>{timeAgo(request.createdAt)}</span>
              </div>
              {request.reason && (
                <p className="text-sm text-coffee-600 bg-coffee-50 rounded-lg px-3 py-2 line-clamp-2">
                  <FileText className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                  {request.reason}
                </p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold text-matcha-600">+{request.quantity}</p>
            <p className="text-xs text-coffee-400">
              {material?.unit || "件"}
            </p>
            <p className="text-sm font-medium text-coffee-600 mt-1">
              {formatCurrency(request.estimatedCost)}
            </p>
          </div>
        </div>

        {request.status === "rejected" && request.rejectReason && (
          <div className="mt-3 p-3 bg-danger-50 border border-danger-100 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-danger-600 mb-0.5">拒绝原因：</p>
                <p className="text-sm text-danger-700">{request.rejectReason}</p>
              </div>
            </div>
          </div>
        )}

        {request.status === "approved" && approver && (
          <div className="mt-3 text-xs text-coffee-500 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-matcha-500" />
            <span>
              由 <span className="font-medium text-coffee-700">{approver.name}</span> 于{" "}
              {request.approvedAt && timeAgo(request.approvedAt)} 审批通过
            </span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-coffee-50 flex items-center justify-between gap-3">
          <button
            onClick={() => openDetailModal(request)}
            className="text-sm text-coffee-500 hover:text-coffee-700 flex items-center gap-1 transition-colors"
          >
            查看详情
            <ChevronRight className="w-4 h-4" />
          </button>

          {isAdmin && request.status === "pending" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openRejectModal(request)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger-50 text-danger-600 text-sm font-medium rounded-lg hover:bg-danger-100 transition-colors"
              >
                <X className="w-4 h-4" />
                拒绝
              </button>
              <button
                onClick={() => handleApprove(request)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-matcha-500 text-white text-sm font-medium rounded-lg hover:bg-matcha-600 transition-colors"
              >
                <Check className="w-4 h-4" />
                通过
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
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
          <h1 className="text-2xl font-bold text-coffee-800">补货审批</h1>
          <p className="text-coffee-500 text-sm mt-1">
            {isAdmin ? "审批补货申请，管理库存采购" : "查看补货申请的审批状态"}
          </p>
        </div>
        {isAdmin && pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-amber-700">
              有 {pendingCount} 条待审批申请
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {statusTabs.map((tab) => {
            const Icon = tab.icon;
            const count =
              tab.key === "all"
                ? requests.length
                : requests.filter((r) => r.status === tab.key).length;
            return (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveStatus(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                  activeStatus === tab.key
                    ? "bg-coffee-700 text-white shadow-soft"
                    : "bg-coffee-50 text-coffee-600 hover:bg-coffee-100"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs",
                    activeStatus === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-white text-coffee-500"
                  )}
                >
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredRequests.length > 0 ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {filteredRequests.map((req, i) => renderRequestCard(req, i))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl shadow-soft p-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-coffee-50 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-coffee-300" />
            </div>
            <p className="text-coffee-600 font-medium mb-1">暂无相关申请</p>
            <p className="text-coffee-400 text-sm">
              {activeStatus === "all"
                ? "还没有任何补货申请"
                : activeStatus === "pending"
                ? "当前没有待审批的申请"
                : activeStatus === "approved"
                ? "还没有已通过的申请"
                : "还没有被拒绝的申请"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={detailModalOpen && selectedRequest !== null}
        onClose={() => setDetailModalOpen(false)}
        title="申请详情"
        className="max-w-lg"
      >
        {selectedRequest && (() => {
          const material = materials.find((m) => m.id === selectedRequest.materialId);
          const applicant = getUserById(selectedRequest.applicantId);
          const approver = selectedRequest.approverId
            ? getUserById(selectedRequest.approverId)
            : null;
          const status = statusConfig[selectedRequest.status];

          return (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-coffee-50 rounded-xl">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: (material?.color || "#ddd") + "30" }}
                >
                  {material?.icon || "📦"}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-coffee-800">
                    {material?.name || "未知物料"}
                  </h4>
                  <p className="text-sm text-coffee-500">
                    {material ? categoryLabels[material.category] : "未知分类"}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                      status.className
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", status.dotClass)} />
                    {status.label}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-matcha-50 rounded-xl">
                  <p className="text-xs text-matcha-600 mb-1">补货数量</p>
                  <p className="text-xl font-bold text-matcha-700">
                    +{selectedRequest.quantity}
                    <span className="text-sm font-normal ml-1">
                      {material?.unit || "件"}
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-coffee-50 rounded-xl">
                  <p className="text-xs text-coffee-500 mb-1">预估费用</p>
                  <p className="text-xl font-bold text-coffee-700">
                    {formatCurrency(selectedRequest.estimatedCost)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-coffee-400 mb-1">申请人</p>
                  <p className="text-sm font-medium text-coffee-700">
                    {applicant?.name || "未知"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-coffee-400 mb-1">申请时间</p>
                  <p className="text-sm font-medium text-coffee-700">
                    {new Date(selectedRequest.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-coffee-400 mb-1">申请理由</p>
                  <p className="text-sm text-coffee-700 bg-coffee-50 rounded-lg p-3">
                    {selectedRequest.reason || "未填写"}
                  </p>
                </div>

                {selectedRequest.status === "approved" && (
                  <>
                    <div>
                      <p className="text-xs text-coffee-400 mb-1">审批人</p>
                      <p className="text-sm font-medium text-coffee-700">
                        {approver?.name || "未知"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-coffee-400 mb-1">通过时间</p>
                      <p className="text-sm font-medium text-coffee-700">
                        {selectedRequest.approvedAt &&
                          new Date(selectedRequest.approvedAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </>
                )}

                {selectedRequest.status === "rejected" && (
                  <>
                    <div>
                      <p className="text-xs text-coffee-400 mb-1">审批人</p>
                      <p className="text-sm font-medium text-coffee-700">
                        {approver?.name || "未知"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-coffee-400 mb-1">拒绝原因</p>
                      <p className="text-sm text-danger-700 bg-danger-50 border border-danger-100 rounded-lg p-3">
                        {selectedRequest.rejectReason || "未填写"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-coffee-400 mb-1">拒绝时间</p>
                      <p className="text-sm font-medium text-coffee-700">
                        {selectedRequest.rejectedAt &&
                          new Date(selectedRequest.rejectedAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {isAdmin && selectedRequest.status === "pending" && (
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setDetailModalOpen(false);
                      openRejectModal(selectedRequest);
                    }}
                    className="flex-1 py-2.5 bg-danger-50 text-danger-600 font-medium rounded-xl hover:bg-danger-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    拒绝申请
                  </button>
                  <button
                    onClick={() => {
                      handleApprove(selectedRequest);
                      setDetailModalOpen(false);
                    }}
                    className="flex-1 py-2.5 bg-matcha-500 text-white font-medium rounded-xl hover:bg-matcha-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    通过申请
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      <Modal
        isOpen={rejectModalOpen && selectedRequest !== null}
        onClose={() => setRejectModalOpen(false)}
        title="拒绝补货申请"
      >
        {selectedRequest && (() => {
          const material = materials.find((m) => m.id === selectedRequest.materialId);
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-danger-50 border border-danger-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-danger-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-danger-700">
                    拒绝 {material?.name || "物料"} 的补货申请
                  </p>
                  <p className="text-xs text-danger-600">
                    补货数量：+{selectedRequest.quantity}
                    {material?.unit || "件"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-coffee-700 mb-2">
                  拒绝原因 <span className="text-danger-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="请说明拒绝该申请的原因，方便申请人了解情况"
                  rows={4}
                  className="w-full px-4 py-3 bg-cream-50 border border-coffee-200 rounded-xl text-coffee-800 placeholder-coffee-300 focus:outline-none focus:ring-2 focus:ring-coffee-400 focus:border-transparent resize-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="flex-1 py-2.5 bg-coffee-50 text-coffee-600 font-medium rounded-xl hover:bg-coffee-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 py-2.5 bg-danger-500 text-white font-medium rounded-xl hover:bg-danger-600 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  确认拒绝
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
