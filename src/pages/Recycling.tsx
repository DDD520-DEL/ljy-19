import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Recycle,
  Leaf,
  Droplets,
  Wind,
  Zap,
  TreePine,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Edit3,
} from "lucide-react";
import StatsCard from "@/components/StatsCard/StatsCard";
import Toast from "@/components/Toast/Toast";
import Modal from "@/components/Modal/Modal";
import { useRecyclingStore } from "@/store/useRecyclingStore";
import { useUserStore } from "@/store/useUserStore";
import { RECYCLABLE_CATEGORIES, recyclableTypeLabels, recyclableTypeColors, type RecyclableType } from "@/types";
import { cn } from "@/lib/utils";
import { getStartOfWeek, getEndOfWeek, formatDate, timeAgo } from "@/utils/date";

type TabKey = "overview" | "record" | "history";

export default function Recycling() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<{ weekStart: string; weekEnd: string } | null>(null);
  const [formWeights, setFormWeights] = useState<Record<RecyclableType, string>>({
    coffee_grounds: "",
    tea_bags: "",
    packaging_box: "",
    paper_cups: "",
    plastic_bottles: "",
    others: "",
  });
  const [formNotes, setFormNotes] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const {
    records,
    upsertRecord,
    getMonthlyStats,
    getMonthlyEnvironmentalImpact,
    getTypeBreakdown,
    getCurrentWeekRecord,
    hasRecordedThisWeek,
  } = useRecyclingStore();
  const { currentUser, getUserById } = useUserStore();

  const monthlyStats = getMonthlyStats();
  const environmentalImpact = getMonthlyEnvironmentalImpact();
  const typeBreakdown = getTypeBreakdown();
  const currentWeekRecord = getCurrentWeekRecord();
  const recordedThisWeek = hasRecordedThisWeek();

  const now = new Date();
  const defaultWeekStart = formatDate(getStartOfWeek(now), "YYYY-MM-DD");
  const defaultWeekEnd = formatDate(getEndOfWeek(now), "YYYY-MM-DD");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const openRecordModal = (editWeek?: { weekStart: string; weekEnd: string }) => {
    if (editWeek) {
      setEditingRecord(editWeek);
      const existing = records.find(
        (r) => r.weekStart === editWeek.weekStart && r.weekEnd === editWeek.weekEnd
      );
      const weights = { ...formWeights };
      existing?.items.forEach((item) => {
        weights[item.type] = String(item.weight);
      });
      setFormWeights(weights);
      setFormNotes(existing?.notes || "");
    } else {
      setEditingRecord(null);
      setFormWeights({
        coffee_grounds: "",
        tea_bags: "",
        packaging_box: "",
        paper_cups: "",
        plastic_bottles: "",
        others: "",
      });
      setFormNotes("");
    }
    setShowRecordModal(true);
  };

  const handleWeightChange = (type: RecyclableType, value: string) => {
    const num = value.replace(/[^0-9.]/g, "");
    setFormWeights((prev) => ({ ...prev, [type]: num }));
  };

  const handleSubmit = () => {
    if (!currentUser) {
      showToast("请先登录", "error");
      return;
    }

    const items = (Object.keys(formWeights) as RecyclableType[])
      .map((type) => ({
        type,
        weight: parseFloat(formWeights[type]) || 0,
      }))
      .filter((item) => item.weight > 0);

    if (items.length === 0) {
      showToast("请至少填写一种回收物重量", "error");
      return;
    }

    const weekStart = editingRecord?.weekStart || defaultWeekStart;
    const weekEnd = editingRecord?.weekEnd || defaultWeekEnd;

    upsertRecord(currentUser.id, weekStart, weekEnd, items, formNotes || undefined);
    setShowRecordModal(false);
    showToast(recordedThisWeek ? "回收记录已更新" : "回收记录已保存");
  };

  const totalWeekWeight = useMemo(() => {
    return (Object.keys(formWeights) as RecyclableType[]).reduce(
      (sum, type) => sum + (parseFloat(formWeights[type]) || 0),
      0
    );
  }, [formWeights]);

  const environmentalCards = [
    {
      key: "plasticCupsSaved",
      label: "减少塑料杯",
      value: environmentalImpact.plasticCupsSaved,
      unit: "个",
      icon: <Recycle className="w-5 h-5" />,
      color: "coffee" as const,
      description: "相当于节省了这么多一次性塑料杯",
    },
    {
      key: "treesSaved",
      label: "保护树木",
      value: environmentalImpact.treesSaved,
      unit: "棵",
      icon: <TreePine className="w-5 h-5" />,
      color: "matcha" as const,
      description: "为地球留住了这些绿意",
    },
    {
      key: "waterSavedLiters",
      label: "节约水资源",
      value: environmentalImpact.waterSavedLiters,
      unit: "L",
      icon: <Droplets className="w-5 h-5" />,
      color: "coffee" as const,
      description: "回收再利用减少的清洁水消耗",
    },
    {
      key: "co2ReducedKg",
      label: "减排 CO₂",
      value: environmentalImpact.co2ReducedKg,
      unit: "kg",
      icon: <Wind className="w-5 h-5" />,
      color: "amber" as const,
      description: "减少的碳排放，为蓝天贡献一份力",
    },
    {
      key: "energySavedKwh",
      label: "节约能源",
      value: environmentalImpact.energySavedKwh,
      unit: "度",
      icon: <Zap className="w-5 h-5" />,
      color: "amber" as const,
      description: "回收节省的电能消耗",
    },
  ];

  const tabs = [
    { key: "overview" as const, label: "环保总览", icon: Leaf },
    { key: "record" as const, label: "本周记录", icon: FileText },
    { key: "history" as const, label: "历史记录", icon: FileText },
  ];

  const recentRecords = records.slice(0, 8);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-coffee-800 flex items-center gap-2">
            <Leaf className="w-7 h-7 text-matcha-500" />
            环保回收
          </h1>
          <p className="text-coffee-500 text-sm mt-1">
            记录可回收物处理量，共同守护绿色地球
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => openRecordModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-matcha-600 text-white rounded-xl text-sm font-medium hover:bg-matcha-700 transition-colors shadow-soft"
        >
          <Plus className="w-4 h-4" />
          <span>记录回收</span>
        </motion.button>
      </div>

      {!recordedThisWeek && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
              <Edit3 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="font-medium text-amber-800">本周回收记录待填写</p>
              <p className="text-sm text-amber-600">
                {defaultWeekStart} ~ {defaultWeekEnd} · 作为值班人员请记得登记本周回收物
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openRecordModal()}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl font-medium text-sm hover:bg-amber-700 transition-colors"
          >
            立即记录
          </motion.button>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="本月回收总量"
          value={`${monthlyStats.totalWeight} kg`}
          subtitle={`共 ${monthlyStats.recordsCount} 次记录`}
          icon={<Recycle className="w-5 h-5" />}
          color="matcha"
        />
        <StatsCard
          title="环保贡献指数"
          value={environmentalImpact.plasticCupsSaved * 10}
          subtitle="基于综合换算评分"
          icon={<Leaf className="w-5 h-5" />}
          color="coffee"
        />
        <StatsCard
          title="减少塑料杯"
          value={`${environmentalImpact.plasticCupsSaved} 个`}
          subtitle="本月累计节省"
          icon={<Recycle className="w-5 h-5" />}
          color="amber"
        />
        <StatsCard
          title="回收品类"
          value={typeBreakdown.length}
          subtitle="种可回收物"
          icon={<FileText className="w-5 h-5" />}
          color="coffee"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-soft p-1 mb-6 inline-flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                activeTab === tab.key
                  ? "bg-matcha-600 text-white shadow-soft"
                  : "text-coffee-600 hover:bg-coffee-50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {activeTab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-bold text-coffee-800 mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-matcha-500" />
                本月环保贡献换算
              </h3>
              <div className="space-y-4">
                {environmentalCards.map((card, index) => (
                  <motion.div
                    key={card.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-4 p-4 bg-cream-50 rounded-xl"
                  >
                    <div
                      className={cn(
                        "p-3 rounded-xl flex-shrink-0",
                        card.color === "matcha"
                          ? "bg-matcha-100 text-matcha-600"
                          : card.color === "amber"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-coffee-100 text-coffee-600"
                      )}
                    >
                      {card.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-coffee-800">
                          {card.value}
                        </span>
                        <span className="text-sm text-coffee-500">{card.unit}</span>
                        <span className="text-sm font-medium text-coffee-700 ml-auto">
                          {card.label}
                        </span>
                      </div>
                      <p className="text-xs text-coffee-400 mt-1">{card.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-6">
              <h3 className="text-lg font-bold text-coffee-800 mb-4">本月回收分类统计</h3>
              <div className="space-y-4">
                {typeBreakdown.length === 0 ? (
                  <div className="text-center py-12 text-coffee-400">暂无回收数据</div>
                ) : (
                  typeBreakdown.map((item, index) => {
                    const category = RECYCLABLE_CATEGORIES.find((c) => c.type === item.type);
                    return (
                      <motion.div
                        key={item.type}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{category?.icon}</span>
                            <span className="text-sm font-medium text-coffee-700">
                              {recyclableTypeLabels[item.type]}
                            </span>
                          </div>
                          <div className="text-sm text-coffee-500">
                            <span className="font-bold text-coffee-700">{item.weight}</span>
                            {" "}kg ({item.percentage}%)
                          </div>
                        </div>
                        <div className="h-3 bg-coffee-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 0.6, delay: index * 0.05 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: recyclableTypeColors[item.type] }}
                          />
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {currentWeekRecord && (
                <div className="mt-6 pt-6 border-t border-coffee-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-coffee-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-matcha-500" />
                      本周已记录
                    </p>
                    <button
                      onClick={() =>
                        openRecordModal({
                          weekStart: currentWeekRecord.weekStart,
                          weekEnd: currentWeekRecord.weekEnd,
                        })
                      }
                      className="text-xs text-coffee-500 hover:text-coffee-700"
                    >
                      补充修改
                    </button>
                  </div>
                  <p className="text-xs text-coffee-400">
                    {currentWeekRecord.weekStart} ~ {currentWeekRecord.weekEnd}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-matcha-50 to-cream-50 rounded-2xl p-6 border border-matcha-100">
            <h3 className="text-lg font-bold text-coffee-800 mb-3">💡 环保小知识</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-coffee-600">
              <div className="p-4 bg-white/60 rounded-xl">
                <p className="font-medium text-coffee-700 mb-1">咖啡渣再利用</p>
                <p className="text-xs leading-relaxed">
                  咖啡渣可做肥料、去味剂、磨砂膏等，堆肥还能让植物更茂盛。
                </p>
              </div>
              <div className="p-4 bg-white/60 rounded-xl">
                <p className="font-medium text-coffee-700 mb-1">正确分类纸箱</p>
                <p className="text-xs leading-relaxed">
                  拆开压扁纸箱再投放，可大大节省回收空间并提高处理效率。
                </p>
              </div>
              <div className="p-4 bg-white/60 rounded-xl">
                <p className="font-medium text-coffee-700 mb-1">减少一次性杯子</p>
                <p className="text-xs leading-relaxed">
                  自带杯每次可减少约 20g 塑料使用，一年节省上千个杯子。
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "record" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-coffee-800">本周回收登记</h3>
              <div className="text-sm text-coffee-500">
                {defaultWeekStart} ~ {defaultWeekEnd}
              </div>
            </div>

            {currentWeekRecord ? (
              <div>
                <div className="flex items-center gap-2 mb-4 p-3 bg-matcha-50 rounded-xl border border-matcha-200">
                  <CheckCircle2 className="w-5 h-5 text-matcha-600 flex-shrink-0" />
                  <p className="text-sm text-matcha-700">
                    本周已由 <span className="font-medium">{getUserById(currentWeekRecord.operatorId)?.name}</span> 登记
                    <span className="mx-1">·</span>
                    {timeAgo(currentWeekRecord.createdAt)}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {currentWeekRecord.items.map((item) => {
                    const category = RECYCLABLE_CATEGORIES.find((c) => c.type === item.type);
                    return (
                      <div
                        key={item.type}
                        className="p-4 bg-cream-50 rounded-xl border border-coffee-100"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{category?.icon}</span>
                          <span className="font-medium text-coffee-700">
                            {recyclableTypeLabels[item.type]}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-coffee-800">
                          {item.weight} <span className="text-sm font-normal">kg</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
                {currentWeekRecord.notes && (
                  <div className="p-4 bg-coffee-50 rounded-xl text-sm text-coffee-600">
                    <span className="font-medium">备注：</span>{currentWeekRecord.notes}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-coffee-100 flex justify-end">
                  <button
                    onClick={() =>
                      openRecordModal({
                        weekStart: currentWeekRecord.weekStart,
                        weekEnd: currentWeekRecord.weekEnd,
                      })
                    }
                    className="px-4 py-2 bg-coffee-100 text-coffee-700 rounded-xl text-sm font-medium hover:bg-coffee-200 transition-colors flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    修改记录
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-coffee-50 flex items-center justify-center mx-auto mb-4">
                  <Recycle className="w-10 h-10 text-coffee-300" />
                </div>
                <p className="text-coffee-600 mb-4">本周尚未登记回收记录</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openRecordModal()}
                  className="px-6 py-2.5 bg-matcha-600 text-white rounded-xl font-medium hover:bg-matcha-700 transition-colors"
                >
                  开始登记
                </motion.button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-soft p-6">
            <h3 className="text-lg font-bold text-coffee-800 mb-4">登记须知</h3>
            <div className="space-y-3 text-sm text-coffee-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-matcha-100 text-matcha-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <p>每周由当值采购负责人在 <span className="font-medium">周五下班前</span> 完成本周回收物称重和登记</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-matcha-100 text-matcha-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <p>回收物需按类别分开称量，<span className="font-medium">单位统一为千克(kg)</span>，保留一位小数即可</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-matcha-100 text-matcha-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <p>如本周有特殊情况可在备注栏说明，便于后续数据核对</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "history" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-coffee-100">
            <h3 className="text-lg font-bold text-coffee-800">历史回收记录</h3>
          </div>
          <div className="divide-y divide-coffee-50">
            {recentRecords.length === 0 ? (
              <div className="px-6 py-12 text-center text-coffee-400">暂无历史记录</div>
            ) : (
              recentRecords.map((record, index) => {
                const operator = getUserById(record.operatorId);
                const totalWeight = record.items.reduce((sum, i) => sum + i.weight, 0);
                const isExpanded = expandedRecord === record.id;
                return (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div
                      className="px-6 py-4 flex items-center gap-4 hover:bg-coffee-50/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedRecord(isExpanded ? null : record.id)}
                    >
                      <div className="w-10 h-10 rounded-full bg-matcha-100 flex items-center justify-center flex-shrink-0">
                        <Recycle className="w-5 h-5 text-matcha-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-coffee-800">
                          {record.weekStart} ~ {record.weekEnd}
                        </p>
                        <p className="text-sm text-coffee-400">
                          登记人：{operator?.name} · {timeAgo(record.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-coffee-800">{totalWeight.toFixed(1)} kg</p>
                        <p className="text-xs text-coffee-400">{record.items.length} 类物品</p>
                      </div>
                      <div className="text-coffee-400">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="px-6 pb-4"
                      >
                        <div className="p-4 bg-cream-50 rounded-xl ml-14">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                            {record.items.map((item) => {
                              const category = RECYCLABLE_CATEGORIES.find((c) => c.type === item.type);
                              return (
                                <div
                                  key={item.type}
                                  className="flex items-center gap-2 p-2 bg-white rounded-lg"
                                >
                                  <span className="text-lg">{category?.icon}</span>
                                  <div>
                                    <p className="text-xs text-coffee-500">
                                      {recyclableTypeLabels[item.type]}
                                    </p>
                                    <p className="text-sm font-bold text-coffee-700">
                                      {item.weight} kg
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {record.notes && (
                            <div className="text-xs text-coffee-500 border-t border-coffee-100 pt-3">
                              <span className="font-medium">备注：</span>{record.notes}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title={editingRecord ? "修改回收记录" : "登记本周回收"}
        className="max-w-xl"
      >
        <div className="space-y-5">
          <div className="p-3 bg-cream-50 rounded-xl flex items-center justify-between text-sm">
            <span className="text-coffee-500">登记周期</span>
            <span className="font-medium text-coffee-700">
              {editingRecord ? `${editingRecord.weekStart} ~ ${editingRecord.weekEnd}` : `${defaultWeekStart} ~ ${defaultWeekEnd}`}
            </span>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-coffee-700">回收物重量（kg）</label>
            <div className="grid grid-cols-2 gap-3">
              {RECYCLABLE_CATEGORIES.map((category) => (
                <div
                  key={category.type}
                  className="p-3 bg-coffee-50 rounded-xl border border-coffee-100 focus-within:border-coffee-300 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-sm font-medium text-coffee-700">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={formWeights[category.type]}
                      onChange={(e) => handleWeightChange(category.type, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-coffee-200 bg-white text-coffee-700 text-sm font-medium focus:outline-none focus:border-coffee-400"
                    />
                    <span className="text-sm text-coffee-400 w-8">kg</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right text-sm text-coffee-500">
              合计：<span className="font-bold text-coffee-700">{totalWeekWeight.toFixed(1)} kg</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">
              备注 <span className="text-coffee-400 font-normal">(选填)</span>
            </label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="有特殊情况可以在这里说明..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-coffee-200 text-coffee-700 text-sm focus:outline-none focus:border-coffee-400 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-coffee-100 flex gap-3">
            <button
              onClick={() => setShowRecordModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-coffee-600 bg-coffee-50 hover:bg-coffee-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white bg-matcha-600 hover:bg-matcha-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              保存记录
            </button>
          </div>
        </div>
      </Modal>

      <Toast
        isVisible={toastVisible}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}
