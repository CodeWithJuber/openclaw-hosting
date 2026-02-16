import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { motion } from "framer-motion";

const messageData = [
  { name: "Mon", messages: 120, users: 45 },
  { name: "Tue", messages: 150, users: 52 },
  { name: "Wed", messages: 180, users: 61 },
  { name: "Thu", messages: 140, users: 48 },
  { name: "Fri", messages: 200, users: 72 },
  { name: "Sat", messages: 160, users: 58 },
  { name: "Sun", messages: 130, users: 50 },
];

const responseTimeData = [
  { name: "00:00", time: 1.2 },
  { name: "04:00", time: 0.8 },
  { name: "08:00", time: 1.5 },
  { name: "12:00", time: 2.1 },
  { name: "16:00", time: 1.8 },
  { name: "20:00", time: 1.4 },
  { name: "23:59", time: 1.1 },
];

const channelData = [
  { name: "Telegram", value: 45, color: "#3b82f6" },
  { name: "Discord", value: 30, color: "#6366f1" },
  { name: "WhatsApp", value: 15, color: "#22c55e" },
  { name: "Slack", value: 10, color: "#a855f7" },
];

export function Analytics() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    {
      title: "Total Messages",
      value: "12,456",
      change: "+12%",
      trend: "up",
      icon: MessageSquare,
    },
    {
      title: "Active Users",
      value: "1,234",
      change: "+8%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Avg Response Time",
      value: "1.4s",
      change: "-5%",
      trend: "down",
      icon: Clock,
    },
    {
      title: "Uptime",
      value: "99.9%",
      change: "+0.1%",
      trend: "up",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Monitor your AI performance and usage
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview" isActive={activeTab === "overview"}>
            Overview
          </TabsTrigger>
          <TabsTrigger value="messages" isActive={activeTab === "messages"}>
            Messages
          </TabsTrigger>
          <TabsTrigger value="performance" isActive={activeTab === "performance"}>
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" isActive={activeTab === "overview"}>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Messages & Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={messageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="messages" fill="#3b82f6" />
                      <Bar dataKey="users" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {channelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {channelData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">
                        {item.name} ({item.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" isActive={activeTab === "messages"}>
          <Card>
            <CardHeader>
              <CardTitle>Message Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={messageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="messages" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" isActive={activeTab === "performance"}>
          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="time"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={`text-xs flex items-center ${
            trend === "up" ? "text-green-500" : "text-red-500"
          }`}
        >
          {trend === "up" ? (
            <TrendingUp className="w-3 h-3 mr-1" />
          ) : (
            <TrendingDown className="w-3 h-3 mr-1" />
          )}
          {change} from last week
        </p>
      </CardContent>
    </Card>
  );
}