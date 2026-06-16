import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Vote, Clock, Check, BarChart2, Users, Sparkles } from "lucide-react";
import Toast, { ToastType } from "@/components/Toast/Toast";
import { useVoteStore } from "@/store/useVoteStore";
import { useUserStore } from "@/store/useUserStore";
import { useVoteSuggestionStore } from "@/store/useVoteSuggestionStore";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date";

export default function VotePage() {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [timeLeft, setTimeLeft] = useState("");

  const { vote, options, hasUserVoted, getUserVote, submitVote, getTotalVotes, getVotePercentage, checkVoteExpiry, getWinningOption } =
    useVoteStore();
  const { currentUser } = useUserStore();
  const { hasSuggestionForVote } = useVoteSuggestionStore();

  const userVoted = currentUser ? hasUserVoted(currentUser.id) : false;
  const userVoteRecord = currentUser ? getUserVote(currentUser.id) : undefined;
  const totalVotes = getTotalVotes();
  const winningOption = getWinningOption();
  const hasSuggestion = vote ? hasSuggestionForVote(vote.id) : false;

  useEffect(() => {
    if (userVoteRecord) {
      setSelectedOptions(userVoteRecord.optionIds);
    }
  }, [userVoteRecord]);

  useEffect(() => {
    if (!vote?.endTime) return;

    const updateTimeLeft = () => {
      const end = new Date(vote.endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("投票已结束");
        checkVoteExpiry();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`剩余 ${days} 天 ${hours} 小时`);
      } else if (hours > 0) {
        setTimeLeft(`剩余 ${hours} 小时 ${minutes} 分钟`);
      } else {
        setTimeLeft(`剩余 ${minutes} 分钟`);
      }
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [vote?.endTime, checkVoteExpiry]);

  const showToast = (message: string, type: ToastType = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const toggleOption = (optionId: string) => {
    if (!vote?.isActive) return;

    setSelectedOptions((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      return [...prev, optionId];
    });
  };

  const handleSubmit = () => {
    if (!currentUser) {
      showToast("请先选择用户身份", "warning");
      return;
    }

    if (selectedOptions.length === 0) {
      showToast("请至少选择一个选项", "warning");
      return;
    }

    submitVote(currentUser.id, selectedOptions);
    showToast(userVoted ? "投票已更新！" : "投票成功！感谢参与 🎉", "success");
  };

  const sortedOptions = [...options].sort((a, b) => b.votes - a.votes);

  return (
    <div>
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-coffee-800">我想喝什么</h1>
        <p className="text-coffee-500 text-sm mt-1">投票选择你最想补货的饮品</p>
      </div>

      {vote && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-coffee-700 to-coffee-900 rounded-2xl p-6 mb-6 text-white shadow-medium"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold mb-2">{vote.title}</h2>
              <p className="text-white/70 text-sm">{vote.description}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Vote className="w-6 h-6" />
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/70" />
              <span className="text-white/80">{timeLeft}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white/70" />
              <span className="text-white/80">{totalVotes} 票</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-white/70" />
              <span className="text-white/80">{options.length} 个选项</span>
            </div>
          </div>

          {userVoted && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-2 text-matcha-300">
                <Check className="w-4 h-4" />
                <span className="text-sm">你已投票，可以修改你的选择</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!vote?.isActive && winningOption && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-vote-500 to-vote-700 rounded-2xl p-6 mb-6 text-white shadow-medium"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">🎉 投票结果已出！</h3>
              <p className="text-white/80 text-sm mb-3">
                「{winningOption.icon} {winningOption.name}」以 {winningOption.votes} 票胜出！
              </p>
              {hasSuggestion ? (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4" />
                  <span>已自动生成补货建议，本周值班人员可在库存页查看</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Clock className="w-4 h-4" />
                  <span>正在生成补货建议...</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-3 mb-6">
        <AnimatePresence>
          {sortedOptions.map((option, index) => {
            const isSelected = selectedOptions.includes(option.id);
            const percentage = getVotePercentage(option.id);
            const rank = index + 1;

            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleOption(option.id)}
                disabled={!vote?.isActive}
                className={cn(
                  "relative w-full p-4 rounded-2xl text-left overflow-hidden transition-all duration-300",
                  isSelected
                    ? "bg-coffee-700 text-white shadow-medium"
                    : "bg-white text-coffee-800 shadow-soft hover:shadow-medium",
                  !vote?.isActive && "opacity-80 cursor-not-allowed"
                )}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn(
                    "absolute inset-y-0 left-0 opacity-20",
                    isSelected ? "bg-white" : "bg-coffee-200"
                  )}
                />

                <div className="relative flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
                      isSelected ? "bg-white/20" : "bg-coffee-50"
                    )}
                  >
                    {option.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold truncate">{option.name}</h3>
                      {rank <= 3 && (
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            rank === 1 && (isSelected ? "bg-yellow-400 text-yellow-900" : "bg-yellow-100 text-yellow-700"),
                            rank === 2 && (isSelected ? "bg-gray-300 text-gray-800" : "bg-gray-100 text-gray-600"),
                            rank === 3 && (isSelected ? "bg-orange-300 text-orange-900" : "bg-orange-100 text-orange-700"),
                          )}
                        >
                          #{rank}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected ? "text-white/80" : "text-coffee-500"
                      )}>
                        {option.votes} 票
                      </span>
                      <span className={cn(
                        "text-sm",
                        isSelected ? "text-white/60" : "text-coffee-400"
                      )}>
                        ({percentage}%)
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
                      isSelected
                        ? "bg-white border-white"
                        : "border-coffee-300"
                    )}
                  >
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Check className="w-4 h-4 text-coffee-700" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 pb-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-medium border border-coffee-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-coffee-500">
                已选择 <span className="font-bold text-coffee-700">{selectedOptions.length}</span> 项
              </p>
              <p className="text-xs text-coffee-400">可多选，投票后可修改</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!vote?.isActive || selectedOptions.length === 0}
              className={cn(
                "px-8 py-3 rounded-full font-medium transition-all duration-300",
                vote?.isActive && selectedOptions.length > 0
                  ? "bg-coffee-700 text-white hover:bg-coffee-800 shadow-soft active:scale-95"
                  : "bg-coffee-100 text-coffee-300 cursor-not-allowed"
              )}
            >
              {userVoted ? "更新投票" : "提交投票"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
