import { MetricCard } from "@/components/dashboard/MetricCard";
import { TrendCard } from "@/components/dashboard/TrendCard";
import { VideoQueueItem } from "@/components/dashboard/VideoQueueItem";
import { Button } from "@/components/ui/button";
import { 
  Video, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Plus,
  Filter,
  RefreshCw
} from "lucide-react";

// Mock data
const trends = [
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
];

const queueItems = [
  {
    title: "5 Facts About Black Holes You Never Knew",
    status: "processing" as const,
    duration: "0:12",
    trend: "Fast Facts Dark Mode",
  },
  {
    title: "This Country Has More Lakes Than...",
    status: "ready" as const,
    scheduledTime: "Today, 3:00 PM",
    duration: "0:09",
    trend: "POV Shocking Stats",
  },
  {
    title: "iPhone vs Android: The Real Winner",
    status: "scheduled" as const,
    scheduledTime: "Tomorrow, 10:00 AM",
    duration: "0:14",
    trend: "This vs That",
  },
  {
    title: "What Happened 100 Years Ago Today",
    status: "queued" as const,
    duration: "0:11",
    trend: "Historical Events",
  },
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor trends and manage your video pipeline
          </p>
        </div>
        <Button variant="gradient">
          <Plus className="h-4 w-4" />
          Create Video
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Videos Created"
          value="24"
          change={12}
          changeLabel="vs last week"
          icon={Video}
        />
        <MetricCard
          title="Active Trends"
          value="8"
          change={-2}
          changeLabel="vs yesterday"
          icon={TrendingUp}
        />
        <MetricCard
          title="Queue Status"
          value="4"
          icon={Clock}
        />
        <MetricCard
          title="Published Today"
          value="1/1"
          icon={CheckCircle}
          iconColor="text-success"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Hot Trends
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.map((trend) => (
              <TrendCard key={trend.name} {...trend} />
            ))}
          </div>
        </div>

        {/* Queue section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Video Queue
            </h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {queueItems.map((item, index) => (
              <VideoQueueItem key={index} {...item} />
            ))}
          </div>

          {/* Daily limit indicator */}
          <div className="card-elevated p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Daily Limit</span>
              <span className="text-sm text-muted-foreground">1/1 videos</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Upgrade to Pro for 3 videos/day
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
