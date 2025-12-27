import { VideoQueueItem } from "@/components/dashboard/VideoQueueItem";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  RefreshCw,
  Pause,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  {
    title: "The Deepest Point on Earth",
    status: "published" as const,
    scheduledTime: "Yesterday, 2:00 PM",
    duration: "0:13",
    trend: "Mind-Blowing Science",
  },
];

const Queue = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Upload Queue
          </h1>
          <p className="text-muted-foreground">
            Safe, rate-limited publishing with randomized timing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Pause className="h-4 w-4" />
            Pause Queue
          </Button>
          <Button variant="gradient">
            <Calendar className="h-4 w-4" />
            Schedule New
          </Button>
        </div>
      </div>

      {/* Safety notice */}
      <div className="card-elevated p-4 border-warning/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold">Platform Safety Active</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Queue-based uploads with randomized posting times (±30 min). Daily limits enforced. 
              No bulk patterns. All uploads logged for compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Queued</span>
          </div>
          <p className="text-2xl font-bold">2</p>
        </div>
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Scheduled</span>
          </div>
          <p className="text-2xl font-bold">1</p>
        </div>
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-success mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Published Today</span>
          </div>
          <p className="text-2xl font-bold">1</p>
        </div>
        <div className="card-elevated p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm">Next Upload</span>
          </div>
          <p className="text-2xl font-bold">2:47 PM</p>
        </div>
      </div>

      {/* Daily limit */}
      <div className="card-elevated p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold">Daily Upload Limit</h3>
            <p className="text-sm text-muted-foreground">Starter Plan: 1 video/day</p>
          </div>
          <Badge variant="outline">1/1 used</Badge>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
            style={{ width: "100%" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Resets in 14 hours. Upgrade to Pro for 3 videos/day.
        </p>
      </div>

      {/* Queue list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Queue Items</h2>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {queueItems.map((item, index) => (
            <VideoQueueItem key={index} {...item} />
          ))}
        </div>
      </div>

      {/* Posting schedule */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold mb-3">Randomized Posting Windows</h3>
        <div className="grid grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="text-center">
              <p className="text-xs text-muted-foreground mb-2">{day}</p>
              <div className="h-16 rounded bg-primary/10 flex items-center justify-center">
                <div className="w-1 h-8 rounded bg-primary/50" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Videos are posted within ±30 minute windows to mimic human behavior.
        </p>
      </div>
    </div>
  );
};

export default Queue;
