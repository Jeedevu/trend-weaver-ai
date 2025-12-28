import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  TrendingUp,
  Video,
  FileText,
  Upload,
  Settings,
  BarChart3,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Trends", href: "/dashboard/trends", icon: TrendingUp },
  { name: "Scripts", href: "/dashboard/scripts", icon: FileText },
  { name: "Series", href: "/dashboard/series", icon: Layers },
  { name: "Videos", href: "/dashboard/videos", icon: Video },
  { name: "Queue", href: "/dashboard/queue", icon: Upload },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold gradient-text">TrendForge</span>
          )}
        </NavLink>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-4 left-3 right-3 space-y-3">
        {/* Logout button */}
        <Button
          variant="ghost"
          className={cn("w-full justify-start text-muted-foreground hover:text-destructive", collapsed && "justify-center")}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Log Out</span>}
        </Button>

        {/* Upgrade CTA */}
        {!collapsed && (
          <div className="rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Create 3 videos/day with priority processing
            </p>
            <Button variant="gradient" size="sm" className="w-full">
              Upgrade Now
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
