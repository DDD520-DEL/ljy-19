import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useUserStore } from "@/store/useUserStore";
import { useMaterialStore } from "@/store/useMaterialStore";
import { useConsumptionStore, setMaterialsCache, setUsersCache } from "@/store/useConsumptionStore";
import { useVoteStore } from "@/store/useVoteStore";
import { useDutyStore } from "@/store/useDutyStore";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { users, initUsers } = useUserStore();
  const { materials, initMaterials } = useMaterialStore();
  const { initConsumptions } = useConsumptionStore();
  const { initVote } = useVoteStore();
  const { initDuty } = useDutyStore();

  useEffect(() => {
    initUsers();
    initMaterials();
    initConsumptions();
    initVote();
    initDuty();
  }, []);

  useEffect(() => {
    if (materials.length > 0) {
      setMaterialsCache(materials);
    }
  }, [materials]);

  useEffect(() => {
    if (users.length > 0) {
      setUsersCache(users);
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
