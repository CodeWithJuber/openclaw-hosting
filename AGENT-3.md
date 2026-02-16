# Agent 3 — Dashboard Frontend Developer

> **Framework:** React 18 + Vite + TypeScript  
> **UI:** shadcn/ui + Tailwind CSS 4  
> **State:** Zustand + TanStack Query  
> **Branch Prefix:** `feature/dashboard-*`  
> **Location:** `apps/web/`  
> **Depends On:** Agent 2 (API endpoints)  
> **Can Start:** Week 2 (UI components), Week 3 (API integration) ✅

---

## Setup Commands

```bash
# Initialize dashboard app
cd apps/web
pnpm create vite . --template react-ts

# Install dependencies
pnpm add @tanstack/react-query zustand react-router-dom recharts
pnpm add -D @types/node tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Add shadcn/ui
npx shadcn@latest init --yes --template vite --base-color slate

# Install shadcn components
npx shadcn add button card input select tabs dialog dropdown-menu
npx shadcn add table badge avatar separator skeleton
npx shadcn add switch textarea toast sonner

# Install icons
pnpm add lucide-react

# Install animation library
pnpm add framer-motion
```

---

## Task List

### Phase 1: Week 1-2 — UI Foundation

#### Task 3.1: Project Setup + Theme

**Branch:** `feature/dashboard-setup`

```typescript
// apps/web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { router } from "./router";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 2,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>
);
```

```typescript
// apps/web/src/router.tsx
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Overview } from "./pages/client/Overview";
import { Instance } from "./pages/client/Instance";
import { Channels } from "./pages/client/Channels";
import { AISettings } from "./pages/client/AISettings";
import { Skills } from "./pages/client/Skills";
import { Analytics } from "./pages/client/Analytics";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminInstances } from "./pages/admin/Instances";
import { SSOCallback } from "./pages/auth/SSOCallback";

export const router = createBrowserRouter([
  {
    path: "/auth/sso",
    element: <SSOCallback />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      // Client routes
      { index: true, element: <Overview /> },
      { path: "instance", element: <Instance /> },
      { path: "channels", element: <Channels /> },
      { path: "ai-settings", element: <AISettings /> },
      { path: "skills", element: <Skills /> },
      { path: "analytics", element: <Analytics /> },
      
      // Admin routes
      { path: "admin", element: <AdminDashboard /> },
      { path: "admin/instances", element: <AdminInstances /> },
    ],
  },
]);
```

```typescript
// apps/web/src/stores/theme.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
    }),
    { name: "theme-storage" }
  )
);

function applyTheme(theme: "light" | "dark" | "system") {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  
  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}
```

---

#### Task 3.2: Layout Components

**Branch:** `feature/dashboard-layout`

```typescript
// apps/web/src/components/layout/Layout.tsx
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

```typescript
// apps/web/src/components/layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, Server, MessageSquare, Brain, 
  Puzzle, BarChart3, Settings, Shield 
} from "lucide-react";
import { cn } from "@/lib/utils";

const clientNav = [
  { to: "/", icon: LayoutDashboard, label: "Overview" },
  { to: "/instance", icon: Server, label: "Instance" },
  { to: "/channels", icon: MessageSquare, label: "Channels" },
  { to: "/ai-settings", icon: Brain, label: "AI Settings" },
  { to: "/skills", icon: Puzzle, label: "Skills" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
];

const adminNav = [
  { to: "/admin", icon: Shield, label: "Admin" },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground">O</span>
          </div>
          OpenClaw
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-3 mb-2">CLIENT</p>
          {clientNav.map((item) => (
            <NavLink
              key={item.to}
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
          ))}
        </div>
        
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-3 mb-2">ADMIN</p>
          {adminNav.map((item) => (
            <NavLink
              key={item.to}
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
          ))}
        </div>
      </nav>
    </aside>
  );
}
```

---

### Phase 2: Week 3-4 — Client Pages

#### Task 3.3: Overview Page

**Branch:** `feature/dashboard-overview`

```typescript
// apps/web/src/pages/client/Overview.tsx
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusCard } from "@/components/instance/StatusCard";
import { ResourceGauges } from "@/components/instance/ResourceGauges";
import { QuickActions } from "@/components/instance/QuickActions";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export function Overview() {
  const { data: instance, isLoading } = useQuery({
    queryKey: ["instance"],
    queryFn: () => api.getInstance(),
  });

  if (isLoading) return <OverviewSkeleton />;
  if (!instance) return <div>No instance found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your OpenClaw instance
          </p>
        </div>
        <Badge 
          variant={instance.status === "active" ? "default" : "secondary"}
          className="text-sm"
        >
          {instance.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard 
          status={instance.status}
          uptime={instance.health?.uptime_percent}
          lastCheck={instance.health?.last_check}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{instance.plan}</div>
            <p className="text-xs text-muted-foreground">{instance.region}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">IP Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{instance.ip_address}</div>
            <p className="text-xs text-muted-foreground">{instance.subdomain}.yourdomain.com</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDistanceToNow(new Date(instance.created_at), { addSuffix: true })}
            </div>
            <p className="text-xs text-muted-foreground">
              v{instance.openclaw_version}
            </p>
          </CardContent>
        </Card>
      </div>

      <ResourceGauges instanceId={instance.id} />
      
      <QuickActions instanceId={instance.id} status={instance.status} />
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
```

---

#### Task 3.4: Instance Management Page

**Branch:** `feature/dashboard-instance`

```typescript
// apps/web/src/pages/client/Instance.tsx
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Power, RotateCcw, Terminal } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function Instance() {
  const [showRebootDialog, setShowRebootDialog] = useState(false);
  
  const { data: instance } = useQuery({
    queryKey: ["instance"],
    queryFn: () => api.getInstance(),
  });

  const rebootMutation = useMutation({
    mutationFn: () => api.rebootInstance(instance!.id),
    onSuccess: () => {
      toast.success("Instance rebooting...");
      setShowRebootDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  if (!instance) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Instance Management</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="w-5 h-5" />
              Power Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              variant="outline" 
              onClick={() => setShowRebootDialog(true)}
              disabled={instance.status !== "active"}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reboot Instance
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Rebooting takes approximately 60 seconds.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              SSH Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-muted rounded-md font-mono text-sm">
              ssh openclaw@{instance.ip_address}
            </div>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(`ssh openclaw@${instance.ip_address}`)}>
              Copy Command
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRebootDialog} onOpenChange={setShowRebootDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Reboot
            </DialogTitle>
            <DialogDescription>
              This will restart your OpenClaw instance. All active conversations will be interrupted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowRebootDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => rebootMutation.mutate()}
              disabled={rebootMutation.isPending}
            >
              {rebootMutation.isPending ? "Rebooting..." : "Reboot"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

#### Task 3.5: Channels Page

**Branch:** `feature/dashboard-channels`

```typescript
// apps/web/src/pages/client/Channels.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const channels = [
  { id: "telegram", name: "Telegram", icon: Send, description: "Connect your Telegram bot" },
  { id: "discord", name: "Discord", icon: Bot, description: "Add to your Discord server" },
  { id: "whatsapp", name: "WhatsApp", icon: MessageSquare, description: "WhatsApp Business API" },
  { id: "slack", name: "Slack", icon: MessageSquare, description: "Slack workspace integration" },
];

export function Channels() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const handleConnect = async (channelId: string) => {
    setConnecting(channelId);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setConnected(prev => ({ ...prev, [channelId]: true }));
    setConnecting(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Channel Manager</h1>
        <p className="text-muted-foreground">
          Connect messaging platforms to your OpenClaw instance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((channel) => (
          <Card key={channel.id} className={connected[channel.id] ? "border-green-500" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <channel.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{channel.name}</CardTitle>
                    <CardDescription>{channel.description}</CardDescription>
                  </div>
                </div>
                
                {connected[channel.id] && (
                  <Badge variant="default" className="bg-green-500">Connected</Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <AnimatePresence mode="wait">
                {!connected[channel.id] ? (
                  <motion.div
                    key="connect"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {channel.id === "telegram" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Bot Token</label>
                        <Input placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" />
                      </div>
                    )}
                    
                    <Button 
                      className="w-full"
                      onClick={() => handleConnect(channel.id)}
                      disabled={connecting === channel.id}
                    >
                      {connecting === channel.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="connected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active</span>
                      <Switch defaultChecked />
                    </div>
                    
                    <Button variant="outline" className="w-full" onClick={() => setConnected(p => ({ ...p, [channel.id]: false }))}>
                      Disconnect
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

### Phase 3: Week 5-6 — Admin Pages

#### Task 3.6: Admin Dashboard

**Branch:** `feature/dashboard-admin`

```typescript
// apps/web/src/pages/admin/Dashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { 
  Server, Users, Activity, DollarSign,
  TrendingUp, TrendingDown 
} from "lucide-react";

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.getAdminStats(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Instances"
          value={stats?.total_instances || 0}
          icon={Server}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Active Users"
          value={stats?.total_users || 0}
          icon={Users}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats?.mrr || 0}`}
          icon={DollarSign}
          trend={{ value: 23, positive: true }}
        />
        <StatCard
          title="Uptime"
          value={`${stats?.uptime_percent || 99.9}%`}
          icon={Activity}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Provisions</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Table of recent instances */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Health status of services */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs flex items-center ${trend.positive ? "text-green-500" : "text-red-500"}`}>
            {trend.positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Phase 4: Week 7-8 — Polish + API Integration

#### Task 3.7: API Client

**Branch:** `feature/dashboard-api-client`

```typescript
// apps/web/src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || "https://api.yourdomain.com";

class APIClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  getToken() {
    return this.token || localStorage.getItem("token");
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Request failed");
    }

    return res.json();
  }

  // Instance endpoints
  getInstance() {
    return this.request("/api/instances/me");
  }

  rebootInstance(id: string) {
    return this.request(`/api/instances/${id}/reboot`, { method: "POST" });
  }

  getMetrics(id: string, period: string) {
    return this.request(`/api/instances/${id}/metrics?period=${period}`);
  }

  updateConfig(id: string, config: any) {
    return this.request(`/api/instances/${id}/config`, {
      method: "POST",
      body: JSON.stringify(config),
    });
  }

  // Admin endpoints
  getAdminStats() {
    return this.request("/api/admin/stats");
  }

  getAdminInstances(params?: { status?: string; page?: number }) {
    const qs = new URLSearchParams(params as any).toString();
    return this.request(`/api/admin/instances?${qs}`);
  }
}

export const api = new APIClient();
```

---

## Deliverables Checklist

- [ ] React + Vite + TypeScript setup
- [ ] Tailwind CSS + shadcn/ui theme
- [ ] Zustand stores (theme, auth, instance)
- [ ] TanStack Query setup
- [ ] React Router configuration
- [ ] Layout components (Sidebar, Header)
- [ ] Overview page with status cards
- [ ] Instance management page
- [ ] Channels page with connection wizard
- [ ] AI Settings page
- [ ] Skills marketplace page
- [ ] Analytics page with charts
- [ ] Admin dashboard
- [ ] Admin instances list
- [ ] Dark mode toggle
- [ ] Mobile responsive design
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] API client with auth
