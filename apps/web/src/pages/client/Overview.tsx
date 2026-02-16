import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  Activity,
  Server,
  Globe,
  Clock,
  Cpu,
  HardDrive,
  Wifi,
} from "lucide-react";

export function Overview() {
  const { data: instance, isLoading } = useQuery({
    queryKey: ["instance"],
    queryFn: () => api.getInstance(),
  });

  if (isLoading) return <OverviewSkeleton />;
  if (!instance) return <div>No instance found</div>;

  const statusColors: Record<string, string> = {
    active: "bg-green-500",
    inactive: "bg-gray-500",
    provisioning: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your OpenClaw instance</p>
        </div>
        <Badge
          variant={instance.status === "active" ? "default" : "secondary"}
          className={`text-sm ${statusColors[instance.status] || ""}`}
        >
          {instance.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Status"
          value={instance.status}
          icon={Activity}
          description={`${instance.health?.uptime_percent || 99}% uptime`}
        />
        <StatusCard
          title="Plan"
          value={instance.plan}
          icon={Server}
          description={instance.region}
        />
        <StatusCard
          title="IP Address"
          value={instance.ip_address}
          icon={Globe}
          description={`${instance.subdomain}.yourdomain.com`}
        />
        <StatusCard
          title="Created"
          value={formatDistanceToNow(new Date(instance.created_at), {
            addSuffix: true,
          })}
          icon={Clock}
          description={`v${instance.openclaw_version}`}
        />
      </div>

      <ResourceGauges />

      <QuickActions />
    </div>
  );
}

function StatusCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold capitalize">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ResourceGauges() {
  const resources = [
    { label: "CPU", value: 45, icon: Cpu, color: "text-blue-500" },
    { label: "Memory", value: 62, icon: Server, color: "text-purple-500" },
    { label: "Disk", value: 28, icon: HardDrive, color: "text-orange-500" },
    { label: "Network", value: 15, icon: Wifi, color: "text-green-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Usage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-4">
          {resources.map((resource, index) => (
            <motion.div
              key={resource.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-muted"
                  />
                  <motion.path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className={resource.color}
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${resource.value}, 100` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <resource.icon className={`w-6 h-6 ${resource.color}`} />
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="font-medium">{resource.label}</p>
                <p className="text-2xl font-bold">{resource.value}%</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    { label: "View Logs", href: "/instance", color: "bg-blue-500" },
    { label: "Restart", href: "/instance", color: "bg-yellow-500" },
    { label: "Settings", href: "/ai-settings", color: "bg-purple-500" },
    { label: "Support", href: "#", color: "bg-green-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          {actions.map((action, index) => (
            <motion.a
              key={action.label}
              href={action.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`${action.color} text-white p-4 rounded-lg text-center font-medium cursor-pointer`}
            >
              {action.label}
            </motion.a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-muted rounded animate-pulse" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
      </div>
      <div className="h-64 bg-muted rounded animate-pulse" />
    </div>
  );
}