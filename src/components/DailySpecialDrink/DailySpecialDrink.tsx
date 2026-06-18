import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpecialDrinkStore } from "@/store/useSpecialDrinkStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useUserStore } from "@/store/useUserStore";
import { useConsumptionStore } from "@/store/useConsumptionStore";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useGroupPurchaseStore } from "@/store/useGroupPurchaseStore";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { formatCurrency } from "@/utils/date";
import { type DrinkRecipe } from "@/types";

const difficultyLabels: Record<DrinkRecipe["difficulty"], string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

const difficultyColors: Record<DrinkRecipe["difficulty"], string> = {
  easy: "bg-matcha-100 text-matcha-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-danger-100 text-danger-700",
};

export default function DailySpecialDrink() {
  const { getTodaysRecipe, nextRecipe, prevRecipe, getAllRecipes, getRecipeAvailability, currentRecipeIndex } =
    useSpecialDrinkStore();
  const { materials, consumeMaterial, getUsableStock } = useMaterialStore();
  const { currentUser } = useUserStore();
  const { addConsumption } = useConsumptionStore();
  const { getUserBudgetInfo, checkCanConsume } = useBudgetStore();
  const { getLockedQuantityForMaterial } = useGroupPurchaseStore();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [showSteps, setShowSteps] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);
  const [direction, setDirection] = useState<0 | 1>(0);

  const recipe = getTodaysRecipe();
  const allRecipes = getAllRecipes();
  const availability = getRecipeAvailability(recipe.id, materials, getUsableStock);
  const userBudgetInfo = currentUser ? getUserBudgetInfo(currentUser.id) : null;

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handlePrev = () => {
    setDirection(0);
    prevRecipe();
  };

  const handleNext = () => {
    setDirection(1);
    nextRecipe();
  };

  const handleConsumeAll = async () => {
    if (!currentUser) {
      showToast("请先选择用户身份", "warning");
      return;
    }

    if (!availability.available) {
      const missingItems = availability.unavailableIngredients
        .map((i) => `${i.materialName}(缺 ${i.needed - i.available}${i.needed > 0 ? "" : ""})`)
        .join("、");
      showToast(`物料不足：${missingItems}`, "error");
      return;
    }

    let totalCost = 0;
    for (const ingredient of recipe.ingredients) {
      const budgetCheck = checkCanConsume(currentUser.id, ingredient.materialId, ingredient.quantity);
      if (!budgetCheck.canConsume) {
        showToast(
          `额度不足！${recipe.name} 需 ${formatCurrency(availability.totalCost)}，剩余 ${formatCurrency(budgetCheck.remaining)}`,
          "error"
        );
        return;
      }
      totalCost += budgetCheck.cost;

      const usableStock = getUsableStock(ingredient.materialId);
      const lockedQty = getLockedQuantityForMaterial(ingredient.materialId);
      const availableStock = usableStock - lockedQty;
      if (availableStock < ingredient.quantity) {
        const material = materials.find((m) => m.id === ingredient.materialId);
        showToast(
          `${material?.name || ingredient.materialName} 可用库存不足${lockedQty > 0 ? `（拼单锁定 ${lockedQty}）` : ""}`,
          "error"
        );
        return;
      }
    }

    setIsConsuming(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const successList: string[] = [];
    let allSuccess = true;

    for (const ingredient of recipe.ingredients) {
      const success = consumeMaterial(ingredient.materialId, ingredient.quantity);
      if (success) {
        addConsumption(currentUser.id, ingredient.materialId, ingredient.quantity);
        const material = materials.find((m) => m.id === ingredient.materialId);
        successList.push(`${material?.icon || ""}${ingredient.materialName} x${ingredient.quantity}`);
      } else {
        allSuccess = false;
        break;
      }
    }

    setIsConsuming(false);

    if (allSuccess) {
      showToast(
        `🎉 一键取用成功！\n${successList.join("\n")}\n共计消费 ${formatCurrency(totalCost)}`,
        "success"
      );
    } else {
      showToast("部分物料取用失败，请检查库存", "error");
    }
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir === 1 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir === 1 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-violet-50 via-fuchsia-50 to-pink-50 border border-violet-200 rounded-2xl p-5 mb-6 shadow-soft relative overflow-hidden"
      >
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2 opacity-30"
          style={{ backgroundColor: recipe.color }}
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full translate-y-1/2 -translate-x-1/2 opacity-20"
          style={{ backgroundColor: recipe.color }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl shadow-soft"
                style={{ backgroundColor: recipe.color }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-coffee-800 flex items-center gap-2">
                  今日特饮推荐
                  <span className="text-xs px-2 py-0.5 bg-violet-200 text-violet-700 rounded-full font-medium">
                    每日精选
                  </span>
                </h3>
                <p className="text-sm text-coffee-500">试试不一样的饮品吧~</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handlePrev}
                className="p-2 bg-white/70 hover:bg-white rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-coffee-600" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                className="p-2 bg-white/70 hover:bg-white rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-coffee-600" />
              </motion.button>
            </div>
          </div>

          <div className="overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={recipe.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-4">
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0 shadow-soft"
                      style={{ backgroundColor: recipe.color + "30" }}
                    >
                      {recipe.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="font-bold text-xl text-coffee-800">{recipe.name}</h4>
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            difficultyColors[recipe.difficulty]
                          )}
                        >
                          {difficultyLabels[recipe.difficulty]}
                        </span>
                      </div>
                      <p className="text-sm text-coffee-500 mb-2">{recipe.description}</p>
                      <div className="flex items-center gap-4 text-xs text-coffee-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>约 {recipe.prepTime} 分钟</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>{recipe.ingredients.length} 种物料</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>约 {formatCurrency(availability.totalCost)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {recipe.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2.5 py-1 bg-white/80 text-coffee-600 rounded-full border border-coffee-100"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-coffee-700 text-sm flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4" />
                        所需物料
                      </h5>
                      {availability.available ? (
                        <span className="flex items-center gap-1 text-xs text-matcha-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          物料充足
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-danger-600 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          物料不足
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {recipe.ingredients.map((ingredient) => {
                        const stock = getUsableStock(ingredient.materialId);
                        const isEnough = stock >= ingredient.quantity;
                        const material = materials.find((m) => m.id === ingredient.materialId);
                        return (
                          <div
                            key={ingredient.materialId}
                            className={cn(
                              "flex items-center justify-between p-2.5 rounded-xl border transition-colors",
                              isEnough
                                ? "bg-white/70 border-matcha-100"
                                : "bg-danger-50 border-danger-200"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{material?.icon || "📦"}</span>
                              <div>
                                <p className="text-sm font-medium text-coffee-700">
                                  {ingredient.materialName}
                                </p>
                                <p className="text-xs text-coffee-400">
                                  需要 {ingredient.quantity}
                                  {ingredient.unit}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  isEnough ? "text-matcha-600" : "text-danger-600"
                                )}
                              >
                                {stock}
                                {ingredient.unit}
                              </p>
                              <p className="text-xs text-coffee-400">
                                {material ? formatCurrency(material.unitPrice * ingredient.quantity) : "-"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {!availability.available && availability.unavailableIngredients.length > 0 && (
                    <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-danger-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-danger-700">
                        <p className="font-medium mb-1">以下物料库存不足：</p>
                        {availability.unavailableIngredients.map((item) => (
                          <p key={item.materialId}>
                            • {item.materialName}：需要 {item.needed}，现有 {item.available}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <button
                      onClick={() => setShowSteps(!showSteps)}
                      className="w-full flex items-center justify-between p-3 bg-white/70 hover:bg-white rounded-xl transition-colors mb-2"
                    >
                      <span className="text-sm font-semibold text-coffee-700 flex items-center gap-1.5">
                        <ChefHat className="w-4 h-4" />
                        制作步骤
                      </span>
                      <motion.span
                        animate={{ rotate: showSteps ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-coffee-500" />
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {showSteps && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 p-1">
                            {recipe.steps.map((step, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-start gap-3 p-2.5 bg-white/50 rounded-xl"
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                  style={{ backgroundColor: recipe.color }}
                                >
                                  {index + 1}
                                </div>
                                <p className="text-sm text-coffee-600 leading-relaxed pt-0.5">
                                  {step}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: availability.available && !isConsuming ? 0.95 : 1 }}
                    onClick={handleConsumeAll}
                    disabled={!availability.available || isConsuming}
                    className={cn(
                      "flex-1 py-3.5 rounded-xl font-semibold transition-all relative overflow-hidden flex items-center justify-center gap-2",
                      availability.available && !isConsuming
                        ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-soft hover:shadow-medium"
                        : "bg-coffee-100 text-coffee-400 cursor-not-allowed"
                    )}
                  >
                    {isConsuming ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        取用中...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        一键取用全部物料
                        <span className="text-xs opacity-80">
                          ({formatCurrency(availability.totalCost)})
                        </span>
                      </>
                    )}
                  </motion.button>
                </div>

                {userBudgetInfo && (
                  <div className="mt-3 flex items-center justify-between text-xs text-coffee-500 px-1">
                    <span>本月剩余额度：{formatCurrency(userBudgetInfo.remainingAmount)}</span>
                    <span>
                      取用后剩余：
                      <span
                        className={cn(
                          "font-medium",
                          userBudgetInfo.remainingAmount - availability.totalCost < 10
                            ? "text-danger-600"
                            : "text-coffee-700"
                        )}
                      >
                        {formatCurrency(
                          Math.max(0, userBudgetInfo.remainingAmount - availability.totalCost)
                        )}
                      </span>
                    </span>
                  </div>
                )}

                <div className="mt-3 flex justify-center gap-1.5">
                  {allRecipes.map((r, index) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setDirection(index > currentRecipeIndex ? 1 : 0);
                        useSpecialDrinkStore.getState().setRecipeIndex(index);
                      }}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        index === currentRecipeIndex
                          ? "w-6 bg-violet-500"
                          : "bg-violet-200 hover:bg-violet-300"
                      )}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
