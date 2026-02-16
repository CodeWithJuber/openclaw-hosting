import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Power, RotateCcw, Terminal, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export function Instance() {
  const [showRebootDialog, setShowRebootDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: instance } = useQuery({
    queryKey: ["instance"],
    queryFn: () => api.getInstance(),
  });

  const rebootMutation = useMutation({
    mutationFn: () => api.rebootInstance(instance!.id),
    onSuccess: () => {
      setShowRebootDialog(false);
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!instance) return null;

  const sshCommand = `ssh openclaw@${instance.ip_address}`;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Instance Management</h1>
        <p className="text-muted-foreground">
          Manage your OpenClaw instance settings and controls
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
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
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reboot Instance
              </Button>

              <p className="text-sm text-muted-foreground">
                Rebooting takes approximately 60 seconds. All active
                conversations will be interrupted.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                SSH Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <div className="p-3 bg-muted rounded-md font-mono text-sm pr-12">
                  {sshCommand}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => handleCopy(sshCommand)}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Connection Details</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>User: openclaw</p>
                  <p>Port: 22</p>
                  <p>Auth: SSH Key</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Instance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <DetailItem label="Instance ID" value={instance.id} />
              <DetailItem label="Status" value={instance.status} />
              <DetailItem label="Plan" value={instance.plan} />
              <DetailItem label="Region" value={instance.region} />
              <DetailItem label="IP Address" value={instance.ip_address} />
              <DetailItem label="Subdomain" value={instance.subdomain} />
              <DetailItem
                label="Created"
                value={new Date(instance.created_at).toLocaleDateString()}
              />
              <DetailItem
                label="Version"
                value={instance.openclaw_version}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showRebootDialog} onOpenChange={setShowRebootDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Reboot
            </DialogTitle>
            <DialogDescription>
              This will restart your OpenClaw instance. All active conversations
              will be interrupted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRebootDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => rebootMutation.mutate()}
              disabled={rebootMutation.isPending}
            >
              {rebootMutation.isPending ? "Rebooting..." : "Reboot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">{value}</p>
    </div>
  );
}