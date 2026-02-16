import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Puzzle,
  Plus,
  Search,
  Star,
  Download,
  Check,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  rating: number;
  downloads: number;
  installed: boolean;
  icon: string;
}

const skills: Skill[] = [
  {
    id: "web-search",
    name: "Web Search",
    description: "Search the web for real-time information",
    category: "Productivity",
    author: "OpenClaw",
    rating: 4.8,
    downloads: 12500,
    installed: true,
    icon: "🔍",
  },
  {
    id: "calendar",
    name: "Calendar",
    description: "Manage your schedule and events",
    category: "Productivity",
    author: "OpenClaw",
    rating: 4.6,
    downloads: 8900,
    installed: true,
    icon: "📅",
  },
  {
    id: "weather",
    name: "Weather",
    description: "Get weather forecasts for any location",
    category: "Utilities",
    author: "OpenClaw",
    rating: 4.5,
    downloads: 7200,
    installed: false,
    icon: "🌤️",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Interact with GitHub repositories and issues",
    category: "Developer",
    author: "DevTools",
    rating: 4.9,
    downloads: 15600,
    installed: false,
    icon: "🐙",
  },
  {
    id: "slack",
    name: "Slack Integration",
    description: "Send messages and manage channels",
    category: "Communication",
    author: "TeamFlow",
    rating: 4.4,
    downloads: 5400,
    installed: false,
    icon: "💬",
  },
  {
    id: "database",
    name: "Database Query",
    description: "Query SQL and NoSQL databases",
    category: "Developer",
    author: "DataTools",
    rating: 4.7,
    downloads: 9800,
    installed: false,
    icon: "🗄️",
  },
];

const categories = ["All", "Productivity", "Developer", "Utilities", "Communication"];

export function Skills() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [installedSkills, setInstalledSkills] = useState<Set<string>>(
    new Set(skills.filter((s) => s.installed).map((s) => s.id))
  );

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (skillId: string) => {
    setInstalledSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Skills Marketplace</h1>
        <p className="text-muted-foreground">
          Extend your AI with powerful skills and integrations
        </p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredSkills.map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <SkillCard
                skill={skill}
                isInstalled={installedSkills.has(skill.id)}
                onInstall={() => handleInstall(skill.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12">
          <Puzzle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No skills found</p>
        </div>
      )}
    </div>
  );
}

function SkillCard({
  skill,
  isInstalled,
  onInstall,
}: {
  skill: Skill;
  isInstalled: boolean;
  onInstall: () => void;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{skill.icon}</span>
            <div>
              <CardTitle className="text-lg">{skill.name}</CardTitle>
              <CardDescription>{skill.author}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">{skill.category}</Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground mb-4">
          {skill.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span>{skill.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            <span>{skill.downloads.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          <Button
            variant={isInstalled ? "outline" : "default"}
            className="flex-1"
            onClick={onInstall}
          >
            {isInstalled ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Installed
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Install
              </>
            )}
          </Button>
          <Button variant="outline" size="icon">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}