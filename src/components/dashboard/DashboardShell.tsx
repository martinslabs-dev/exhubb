"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export interface DashboardUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isBuyer: boolean;
  isSeller: boolean;
  isFreelancer: boolean;
}

export default function DashboardShell({
  user,
  unreadMessages,
  unreadNotifications,
  children,
}: {
  user: DashboardUser;
  unreadMessages: number;
  unreadNotifications: number;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar user={user} unreadMessages={unreadMessages} unreadNotifications={unreadNotifications} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
