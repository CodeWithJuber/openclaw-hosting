import { useTheme, applyTheme } from "@/stores/theme";
import { useAuth } from "@/stores/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Monitor, LogOut, User } from "lucide-react";
import { useEffect } from "react";
import { motion } from "framer-motion";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Welcome back,</span>
        <span className="font-medium">{user?.name || "User"}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <ThemeButton
            active={theme === "light"}
            onClick={() => setTheme("light")}
            icon={Sun}
            label="Light"
          />
          <ThemeButton
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
            icon={Moon}
            label="Dark"
          />
          <ThemeButton
            active={theme === "system"}
            onClick={() => setTheme("system")}
            icon={Monitor}
            label="System"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function ThemeButton({
  active,
  onClick,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-md transition-colors ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {active && (
        <motion.div
          layoutId="activeTheme"
          className="absolute inset-0 bg-background rounded-md shadow-sm"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <Icon className="w-4 h-4 relative z-10" />
    </button>
  );
}