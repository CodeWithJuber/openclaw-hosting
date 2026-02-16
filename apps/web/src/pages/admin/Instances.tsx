import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { Search, Filter, MoreHorizontal, Server } from "lucide-react";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  inactive: "bg-gray-500",
  provisioning: "bg-yellow-500",
  error: "bg-red-500",
};

export function AdminInstances() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: _instances } = useQuery({
    queryKey: ["admin-instances", statusFilter],
    queryFn: () => api.getAdminInstances(statusFilter ? { status: statusFilter } : undefined),
  });

  // Mock data for demo
  const mockInstances = [
    {
      id: "inst_001",
      user: "alice@example.com",
      status: "active",
      plan: "pro",
      region: "us-east-1",
      created_at: "2024-01-15T10:30:00Z",
    },
    {
      id: "inst_002",
      user: "bob@example.com",
      status: "provisioning",
      plan: "starter",
      region: "eu-west-1",
      created_at: "2024-02-16T14:20:00Z",
    },
    {
      id: "inst_003",
      user: "charlie@example.com",
      status: "active",
      plan: "enterprise",
      region: "ap-southeast-1",
      created_at: "2024-01-20T08:15:00Z",
    },
    {
      id: "inst_004",
      user: "diana@example.com",
      status: "error",
      plan: "pro",
      region: "us-west-2",
      created_at: "2024-02-10T16:45:00Z",
    },
    {
      id: "inst_005",
      user: "eve@example.com",
      status: "inactive",
      plan: "starter",
      region: "eu-central-1",
      created_at: "2024-01-05T09:00:00Z",
    },
  ];

  const filteredInstances = mockInstances.filter(
    (instance) =>
      (instance.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        instance.user.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!statusFilter || instance.status === statusFilter)
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Instances</h1>
        <p className="text-muted-foreground">Manage all platform instances</p>
      </motion.div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              All Instances
            </CardTitle>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search instances..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[250px]"
                />
              </div>

              <Button
                variant="outline"
                onClick={() => setStatusFilter(statusFilter ? null : "active")}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instance ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstances.map((instance, index) => (
                <motion.tr
                  key={instance.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell className="font-mono">{instance.id}</TableCell>
                  <TableCell>{instance.user}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          statusColors[instance.status]
                        }`}
                      />
                      <span className="capitalize">{instance.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {instance.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{instance.region}</TableCell>
                  <TableCell>
                    {new Date(instance.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {filteredInstances.length === 0 && (
            <div className="text-center py-8">
              <Server className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No instances found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}