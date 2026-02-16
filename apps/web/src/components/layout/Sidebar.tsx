import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  MessageSquare,
  Brain,
  Puzzle,
  BarChart3,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const clientNav = [
  { to: "/", icon: LayoutDashboard, label: "Overview" },
  { to: "/instance", icon: Server, label: "Instance" },
  { to: "/channels", icon: MessageSquare, label: "Channels" },
  { to: "/ai-settings", icon: Brain, label: "AI Settings" },
  { to: "/skills", icon: Puzzle, label: "Skills" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

const adminNav = [{ to: "/admin", icon: Shield, label: "Admin" }];

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 font-bold text-xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"
          >
            <span className="text-primary-foreground font-bold">O</span>
          </motion.div>
          OpenClaw
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-3 mb-2">
            CLIENT
          </p>
          {clientNav.map((item, index) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            </motion.div>
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-3 mb-2">
            ADMIN
          </p>
          {adminNav.map((item, index) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (clientNav.length + index) * 0.05 }}
            >
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            </motion.div>
          ))}
        </div>
      </nav>
    </aside>
  );
}