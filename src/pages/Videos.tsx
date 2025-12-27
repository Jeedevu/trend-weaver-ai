import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Play, 
  Download, 
  MoreVertical,
  Eye,
  Clock,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

type VideoStatus = "processing" | "ready" | "published" | "failed";

interface GeneratedVideo {
  id: number;
  title: string;
  trend: string;
  status: VideoStatus;
  duration: string;
  createdAt: string;
  views?: number;
  style: string;
}

const videos: GeneratedVideo[] = [
  {
    id: 1,
    title: "5 Facts About Black Holes You Never Knew",
    trend: "Fast Facts Dark Mode",
    status: "published",
    duration: "0:12",
    createdAt: "2 hours ago",
    views: 1234,
    style: "Dark Minimal",
  },
  {
    id: 2,
    title: "This Country Has More Lakes Than...",
    trend: "POV Shocking Stats",
    status: "ready",
    duration: "0:09",
    createdAt: "4 hours ago",
    style: "Bold Text",
  },
  {
    id: 3,
    title: "iPhone vs Android: The Real Winner",
    trend: "This vs That",
    status: "processing",
    duration: "0:14",
    createdAt: "5 hours ago",
    style: "Split Screen",
  },
  {
    id: 4,
    title: "What Happened 100 Years Ago Today",
    trend: "Historical Events",
    status: "failed",
    duration: "0:11",
    createdAt: "6 hours ago",
    style: "Archival",
  },
];

const statusColors: Record<VideoStatus, string> = {
  processing: "bg-primary/20 text-primary",
  ready: "bg-success/20 text-success",
  published: "bg-info/20 text-info",
  failed: "bg-destructive/20 text-destructive",
};

const Videos = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Generated Videos
          </h1>
          <p className="text-muted-foreground">
            Preview, download, and manage your AI-generated content
          </p>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Video style info */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold mb-3">Available Visual Styles</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Dark Minimal</Badge>
          <Badge variant="secondary">Bold Text</Badge>
          <Badge variant="secondary">Split Screen</Badge>
          <Badge variant="secondary">Archival</Badge>
          <Badge variant="secondary">Gradient Flow</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Only 5 predefined styles. No custom visuals. Optimized for AI consistency.
        </p>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="card-elevated overflow-hidden group">
            {/* Thumbnail */}
            <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20">
              <div className="absolute inset-0 flex items-center justify-center">
                {video.status === "processing" ? (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Processing...</p>
                  </div>
                ) : video.status === "failed" ? (
                  <div className="text-center p-4">
                    <p className="text-sm text-destructive">Generation failed</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Retry
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-16 h-16 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Play className="h-8 w-8" />
                  </Button>
                )}
              </div>
              
              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-background/80 text-xs">
                {video.duration}
              </div>

              {/* Style badge */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="bg-background/80">
                  {video.style}
                </Badge>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {video.title}
                </h3>
                <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground">{video.trend}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {video.createdAt}
                  </span>
                  {video.views && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {video.views.toLocaleString()}
                    </span>
                  )}
                </div>
                <Badge className={cn("text-xs", statusColors[video.status])}>
                  {video.status}
                </Badge>
              </div>

              {video.status === "ready" && (
                <div className="flex gap-2 pt-2">
                  <Button variant="gradient" size="sm" className="flex-1">
                    Schedule
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Videos;
