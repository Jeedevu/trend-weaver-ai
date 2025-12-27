import { useState } from "react";
import { TrendCard } from "@/components/dashboard/TrendCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  TrendingUp,
  Sparkles,
  Clock,
  AlertTriangle
} from "lucide-react";

const allTrends = [
  {
    name: "Fast Facts Dark Mode",
    description: "Quick facts with AI voice over dark minimalist backgrounds. High engagement, easy to produce.",
    velocityScore: 92,
    shelfLife: "2-3 weeks",
    aiSuitability: 95,
    category: "Educational",
    isHot: true,
  },
  {
    name: "POV Shocking Stats",
    description: "First-person view revealing surprising statistics in under 10 seconds with dramatic reveal.",
    velocityScore: 87,
    shelfLife: "1-2 weeks",
    aiSuitability: 88,
    category: "Statistics",
    isHot: true,
  },
  {
    name: "This vs That Comparisons",
    description: "Side-by-side visual comparisons with quick transitions and bold text overlays.",
    velocityScore: 78,
    shelfLife: "3-4 weeks",
    aiSuitability: 82,
    category: "Comparison",
    isHot: false,
  },
  {
    name: "Historical Events Today",
    description: "On this day in history format with archival imagery and dramatic narration.",
    velocityScore: 71,
    shelfLife: "Evergreen",
    aiSuitability: 79,
    category: "History",
    isHot: false,
  },
  {
    name: "Mind-Blowing Science",
    description: "Scientific phenomena explained with stunning visuals and dramatic reveals.",
    velocityScore: 84,
    shelfLife: "2-3 weeks",
    aiSuitability: 91,
    category: "Science",
    isHot: true,
  },
  {
    name: "Life Hacks Quick Tips",
    description: "Practical life hacks demonstrated quickly with satisfying outcomes.",
    velocityScore: 69,
    shelfLife: "1-2 weeks",
    aiSuitability: 75,
    category: "Lifestyle",
    isHot: false,
  },
];

const categories = ["All", "Educational", "Statistics", "Comparison", "History", "Science", "Lifestyle"];

const Trends = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTrends = allTrends.filter((trend) => {
    const matchesCategory = selectedCategory === "All" || trend.category === selectedCategory;
    const matchesSearch = trend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trend.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Trend Intelligence
        </h1>
        <p className="text-muted-foreground">
          Discover FORMAT-LEVEL trends optimized for AI video generation
        </p>
      </div>

      {/* Trend stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Hot Trends</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <TrendingUp className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">6</p>
            <p className="text-sm text-muted-foreground">Active Trends</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">2h ago</p>
            <p className="text-sm text-muted-foreground">Last Updated</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Rejected formats warning */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Filtered Out</p>
          <p className="text-sm text-muted-foreground">
            Overused trends, copyright-risky formats, and human-acting-heavy content are automatically excluded.
          </p>
        </div>
      </div>

      {/* Trend grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrends.map((trend) => (
          <TrendCard key={trend.name} {...trend} />
        ))}
      </div>

      {filteredTrends.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No trends match your filters</p>
        </div>
      )}
    </div>
  );
};

export default Trends;
