"use client";

import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function Layout() {
  // Start closed on mobile, open on desktop (detected via media query)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const listener = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(e.matches);
      if (e.matches) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Initial check
    listener(mql);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* ── Main content area ──────────────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          // On desktop, account for the fixed sidebar width
          isDesktop && "lg:ml-64",
        )}
      >
        <Header onMenuClick={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


