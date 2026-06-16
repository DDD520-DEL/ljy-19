import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import Vote from "@/pages/Vote";
import Stats from "@/pages/Stats";
import Duty from "@/pages/Duty";
import Profile from "@/pages/Profile";
import RestockApproval from "@/pages/RestockApproval";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="restock-approval" element={<RestockApproval />} />
          <Route path="vote" element={<Vote />} />
          <Route path="stats" element={<Stats />} />
          <Route path="duty" element={<Duty />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}
