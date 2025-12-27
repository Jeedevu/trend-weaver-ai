import { cn } from "@/lib/utils";
import { Play, Pause, MoreVertical, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type VideoStatus = "queued" | "processing" | "ready" | "scheduled" | "published" | "failed";

interface VideoQueueItemProps {
  title: string;
  thumbnail?: string;
  status: VideoStatus;
  scheduledTime?: string;
  duration?: string;
  trend?: string;
}

const statusConfig: Record<VideoStatus, { label: string; color: string; icon: any }> = {
  queued: { label: "Queued", color: "bg-muted text-muted-foreground", icon: Clock },
  processing: { label: "Processing", color: "bg-primary/20 text-primary", icon: Loader2 },
  ready: { label: "Ready", color: "bg-success/20 text-success", icon: CheckCircle },
  scheduled: { label: "Scheduled", color: "bg-info/20 text-info", icon: Clock },
  published: { label: "Published", color: "bg-success/20 text-success", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-destructive/20 text-destructive", icon: AlertCircle },
};

export function VideoQueueItem({
  title,
  thumbnail,
  status,
  scheduledTime,
  duration,
  trend,
}: VideoQueueItemProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-border transition-all group">
      {/* Thumbnail */}
      <div className="relative w-24 h-14 rounded-md bg-muted overflow-hidden shrink-0">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
            <Play className="h-5 w-5 text-primary" />
          </div>
        )}
        {duration && (
          <span className="absolute bottom-1 right-1 text-[10px] bg-background/80 px-1 rounded">
            {duration}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate group-hover:text-primary transition-colors">
          {title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className="text-xs text-muted-foreground truncate">
              {trend}
            </span>
          )}
          {scheduledTime && (
            <span className="text-xs text-muted-foreground">
              • {scheduledTime}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <Badge className={cn("shrink-0", config.color)}>
        <StatusIcon className={cn("h-3 w-3 mr-1", status === "processing" && "animate-spin")} />
        {config.label}
      </Badge>

      {/* Actions */}
      <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </div>
  );
}
