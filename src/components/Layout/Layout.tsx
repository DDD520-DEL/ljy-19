import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DutyBanner from "@/components/DutyBanner/DutyBanner";
import { useUserStore } from "@/store/useUserStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useConsumptionStore, setMaterialsCache, setUsersCache } from "@/store/useConsumptionStore";
import { useBudgetStore, setBudgetMaterialsCache, setBudgetUsersCache } from "@/store/useBudgetStore";
import { useVoteStore } from "@/store/useVoteStore";
import { useDutyStore } from "@/store/useDutyStore";
import { useRestockRequestStore } from "@/store/useRestockRequestStore";
import { useVoteSuggestionStore } from "@/store/useVoteSuggestionStore";
import { useGroupPurchaseStore } from "@/store/useGroupPurchaseStore";
import { useReviewStore } from "@/store/useReviewStore";
import { useInvitationStore } from "@/store/useInvitationStore";
import { useAnnouncementStore } from "@/store/useAnnouncementStore";
import { useWishListStore } from "@/store/useWishListStore";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { users, initUsers } = useUserStore();
  const { materials, initMaterials } = useMaterialStore();
  const { initConsumptions } = useConsumptionStore();
  const { initBudgets } = useBudgetStore();
  const { initVote, checkVoteExpiry } = useVoteStore();
  const { initDuty, checkAndRotateDuty } = useDutyStore();
  const { initRequests } = useRestockRequestStore();
  const { initSuggestions } = useVoteSuggestionStore();
  const { initGroupPurchases, checkAndSettleExpired } = useGroupPurchaseStore();
  const { initReviews } = useReviewStore();
  const { initInvitationCodes } = useInvitationStore();
  const { initAnnouncements, checkAndUpdateExpired } = useAnnouncementStore();
  const { initWishes } = useWishListStore();

  useEffect(() => {
    initUsers();
    initMaterials();
    initConsumptions();
    initBudgets();
    initVote();
    initDuty();
    initRequests();
    initSuggestions();
    initGroupPurchases();
    initReviews();
    initInvitationCodes();
    initAnnouncements();
    initWishes();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      checkVoteExpiry();
      checkAndSettleExpired();
      checkAndRotateDuty();
      checkAndUpdateExpired();
    }, 60000);

    return () => clearInterval(timer);
  }, [checkVoteExpiry, checkAndSettleExpired, checkAndRotateDuty, checkAndUpdateExpired]);

  useEffect(() => {
    if (materials.length > 0) {
      setMaterialsCache(materials);
      setBudgetMaterialsCache(materials);
    }
  }, [materials]);

  useEffect(() => {
    if (users.length > 0) {
      setUsersCache(users);
      setBudgetUsersCache(users);
    }
  }, [users]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <DutyBanner />

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-4 lg:p-6"
            >
              <div className="container max-w-6xl">
                <Outlet />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
