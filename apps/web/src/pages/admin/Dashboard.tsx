import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import {
  Server,
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

export function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => api.getAdminStats(),
  });

  const statCards = [
    {
      title: "Total Instances",
      value: stats?.total_instances || 0,
      icon: Server,
      trend: { value: 12, positive: true },
    },
    {
      title: "Active Users",
      value: stats?.total_users || 0,
      icon: Users,
      trend: { value: 8, positive: true },
    },
    {
      title: "Monthly Revenue",
      value: `$${stats?.mrr || 0}`,
      icon: DollarSign,
      trend: { value: 23, positive: true },
    },
    {
      title: "Uptime",
      value: `${stats?.uptime_percent || 99.9}%`,
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and metrics</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Provisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: "inst_123", user: "user@example.com", status: "active", time: "2 min ago" },
                  { id: "inst_124", user: "test@example.com", status: "provisioning", time: "5 min ago" },
                  { id: "inst_125", user: "demo@example.com", status: "active", time: "12 min ago" },
                ].map((instance) => (
                  <div
                    key={instance.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{instance.id}</p>
                      <p className="text-sm text-muted-foreground">{instance.user}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          instance.status === "active"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {instance.status}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">{instance.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "API Gateway", status: "healthy", latency: "45ms" },
                  { name: "Database", status: "healthy", latency: "12ms" },
                  { name: "Message Queue", status: "healthy", latency: "8ms" },
                  { name: "AI Service", status: "warning", latency: "234ms" },
                ].map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {service.status === "healthy" ? (
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      ) : service.status === "warning" ? (
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {service.status === "warning" && (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-sm text-muted-foreground">{service.latency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
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
          <p
            className={`text-xs flex items-center ${
              trend.positive ? "text-green-500" : "text-red-500"
            }`}
          >
            {trend.positive ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}