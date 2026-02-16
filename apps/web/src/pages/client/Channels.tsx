import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Bot,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const channels = [
  {
    id: "telegram",
    name: "Telegram",
    icon: Send,
    description: "Connect your Telegram bot",
    color: "bg-blue-500",
  },
  {
    id: "discord",
    name: "Discord",
    icon: Bot,
    description: "Add to your Discord server",
    color: "bg-indigo-500",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageSquare,
    description: "WhatsApp Business API",
    color: "bg-green-500",
  },
  {
    id: "slack",
    name: "Slack",
    icon: MessageSquare,
    description: "Slack workspace integration",
    color: "bg-purple-500",
  },
];

export function Channels() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState<Record<string, boolean>>({});

  const handleConnect = async (channelId: string) => {
    setConnecting(channelId);
    await new Promise((r) => setTimeout(r, 1500));
    setConnected((prev) => ({ ...prev, [channelId]: true }));
    setActive((prev) => ({ ...prev, [channelId]: true }));
    setConnecting(null);
  };

  const handleDisconnect = (channelId: string) => {
    setConnected((prev) => ({ ...prev, [channelId]: false }));
    setActive((prev) => ({ ...prev, [channelId]: false }));
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Channel Manager</h1>
        <p className="text-muted-foreground">
          Connect messaging platforms to your OpenClaw instance
        </p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        {channels.map((channel, index) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={
                connected[channel.id]
                  ? "border-green-500/50 shadow-green-500/10"
                  : ""
              }
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 ${channel.color} rounded-lg text-white`}
                    >
                      <channel.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{channel.name}</CardTitle>
                      <CardDescription>{channel.description}</CardDescription>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {connected[channel.id] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Badge
                          variant="default"
                          className="bg-green-500 text-white"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                          <label className="text-sm font-medium">
                            Bot Token
                          </label>
                          <Input placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz" />
                        </div>
                      )}

                      {channel.id === "discord" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Bot Token
                          </label>
                          <Input placeholder="MTAxMD..." />
                        </div>
                      )}

                      {channel.id === "whatsapp" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Phone Number ID
                          </label>
                          <Input placeholder="1234567890" />
                        </div>
                      )}

                      {channel.id === "slack" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            Slack Token
                          </label>
                          <Input placeholder="xoxb-..." />
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
                        <Switch
                          checked={active[channel.id]}
                          onChange={(e) =>
                            setActive((prev) => ({
                              ...prev,
                              [channel.id]: (e.target as HTMLInputElement).checked,
                            }))
                          }
                        />
                      </div>

                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium">Webhook URL</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          https://api.openclaw.com/webhooks/{channel.id}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleDisconnect(channel.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Disconnect
                        </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}