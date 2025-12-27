import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main content */}
      <div className="pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
