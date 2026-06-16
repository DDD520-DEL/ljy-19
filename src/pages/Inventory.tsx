import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, AlertTriangle, TrendingUp, Settings } from "lucide-react";
import Modal from "@/components/Modal/Modal";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useUserStore } from "@/store/useUserStore";
import { categoryLabels, type MaterialCategory, type Material } from "@/types";
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
  const [activeCategory, setActiveCategory] = useState<MaterialCategory | "all">("all");
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [restockCost, setRestockCost] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [showHistory, setShowHistory] = useState(false);

  const { materials, restocks, restockMaterial, getLowStockMaterials, updateThreshold } =
    useMaterialStore();
  const { currentUser } = useUserStore();

  const filteredMaterials =
    activeCategory === "all"
      ? materials
      : materials.filter((m) => m.category === activeCategory);

  const lowStockMaterials = getLowStockMaterials();

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
  };

  const handleThresholdChange = (materialId: string, threshold: number) => {
    updateThreshold(materialId, threshold);
    showToast("阈值已更新", "success");
  };

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

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-coffee-800">库存管理</h1>
          <p className="text-coffee-500 text-sm mt-1">管理所有物料的库存和补货</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-soft text-coffee-600 hover:bg-coffee-50 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">补货记录</span>
        </button>
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
        {!showHistory ? (
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
                          <button
                            onClick={() => openRestockModal(material)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-matcha-400 text-white text-sm font-medium rounded-lg hover:bg-matcha-500 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            补货
                          </button>
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
    </div>
  );
}
