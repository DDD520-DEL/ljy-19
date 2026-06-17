import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout/Layout";
import Home from "@/pages/Home";
import Inventory from "@/pages/Inventory";
import Vote from "@/pages/Vote";
import Stats from "@/pages/Stats";
import Duty from "@/pages/Duty";
import Profile from "@/pages/Profile";
import RestockApproval from "@/pages/RestockApproval";
import GroupPurchase from "@/pages/GroupPurchase";
import Register from "@/pages/Register";
import InvitationManagement from "@/pages/InvitationManagement";
import UserManagement from "@/pages/UserManagement";
import AnnouncementManagement from "@/pages/AnnouncementManagement";
import Wishlist from "@/pages/Wishlist";
import CheckIn from "@/pages/CheckIn";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="checkin" element={<CheckIn />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="restock-approval" element={<RestockApproval />} />
          <Route path="vote" element={<Vote />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="group-purchase" element={<GroupPurchase />} />
          <Route path="stats" element={<Stats />} />
          <Route path="duty" element={<Duty />} />
          <Route path="profile" element={<Profile />} />
          <Route path="invitations" element={<InvitationManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="announcements" element={<AnnouncementManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}
