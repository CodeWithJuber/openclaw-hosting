import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Brain, Save, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

const models = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-3-opus", label: "Claude 3 Opus" },
  { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
];

export function AISettings() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState({
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: `You are a helpful AI assistant. You are running on OpenClaw, a platform for deploying AI agents.`,
    streaming: true,
    memory: true,
    tools: true,
  });

  const handleSave = () => {
    // Save settings
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">AI Settings</h1>
        <p className="text-muted-foreground">
          Configure your AI model and behavior
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general" isActive={activeTab === "general"}>
            General
          </TabsTrigger>
          <TabsTrigger value="behavior" isActive={activeTab === "behavior"}>
            Behavior
          </TabsTrigger>
          <TabsTrigger value="advanced" isActive={activeTab === "advanced"}>
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" isActive={activeTab === "general"}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Model Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">AI Model</label>
                <Select
                  value={settings.model}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, model: e.target.value }))
                  }
                >
                  {models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Temperature</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={settings.temperature}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        temperature: parseFloat(e.target.value),
                      }))
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-right">{settings.temperature}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lower values make the AI more focused and deterministic.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Tokens</label>
                <Input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      maxTokens: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" isActive={activeTab === "behavior"}>
          <Card>
            <CardHeader>
              <CardTitle>Behavior Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">System Prompt</label>
                <Textarea
                  rows={6}
                  value={settings.systemPrompt}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      systemPrompt: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  This prompt defines the AI's personality and behavior.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Memory</p>
                  <p className="text-sm text-muted-foreground">
                    Allow the AI to remember conversation context
                  </p>
                </div>
                <Switch
                  checked={settings.memory}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      memory: (e.target as HTMLInputElement).checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable Tools</p>
                  <p className="text-sm text-muted-foreground">
                    Allow the AI to use tools and skills
                  </p>
                </div>
                <Switch
                  checked={settings.tools}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      tools: (e.target as HTMLInputElement).checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Streaming Response</p>
                  <p className="text-sm text-muted-foreground">
                    Stream AI responses in real-time
                  </p>
                </div>
                <Switch
                  checked={settings.streaming}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      streaming: (e.target as HTMLInputElement).checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" isActive={activeTab === "advanced"}>
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <Input type="password" placeholder="sk-..." />
                <p className="text-xs text-muted-foreground">
                  Your OpenAI API key for model access
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Timeout (seconds)</label>
                <Input type="number" defaultValue={30} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Retry Attempts</label>
                <Input type="number" defaultValue={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-end gap-3"
      >
        <Button variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </motion.div>
    </div>
  );
}