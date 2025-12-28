import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Video,
  Play,
  Download,
  MoreVertical,
  Eye,
  Clock,
  Filter,
  Plus,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  Youtube,
} from "lucide-react";
import { cn } from "@/lib/utils";

type VideoStatus = "queued" | "generating" | "ready" | "publishing" | "published" | "failed";

interface GeneratedVideo {
  id: string;
  title: string;
  status: VideoStatus;
  duration_seconds: number | null;
  created_at: string;
  video_url: string | null;
  thumbnail_url: string | null;
  visual_style: string;
  error_message: string | null;
  youtube_video_id: string | null;
}

const VISUAL_STYLES = [
  { id: "dark_minimal", name: "Dark Minimal", preview: "🌑" },
  { id: "minecraft", name: "Minecraft", preview: "⛏️" },
  { id: "disney_toon", name: "Disney Toon", preview: "🏰" },
  { id: "gtav", name: "GTA V", preview: "🚗" },
  { id: "comic_book", name: "Comic Book", preview: "💥" },
  { id: "anime", name: "Anime", preview: "🎌" },
  { id: "realistic", name: "Realistic", preview: "📸" },
  { id: "retro_game", name: "Retro Game", preview: "👾" },
  { id: "watercolor", name: "Watercolor", preview: "🎨" },
  { id: "neon_cyber", name: "Neon Cyber", preview: "🌆" },
];

const VOICE_PERSONAS = [
  { id: "professional_male", name: "Professional Male" },
  { id: "professional_female", name: "Professional Female" },
  { id: "energetic_male", name: "Energetic Male" },
  { id: "energetic_female", name: "Energetic Female" },
  { id: "calm_narrator", name: "Calm Narrator" },
  { id: "dramatic", name: "Dramatic" },
];

const statusColors: Record<VideoStatus, string> = {
  queued: "bg-muted text-muted-foreground",
  generating: "bg-primary/20 text-primary",
  ready: "bg-green-500/20 text-green-400",
  publishing: "bg-yellow-500/20 text-yellow-400",
  published: "bg-blue-500/20 text-blue-400",
  failed: "bg-destructive/20 text-destructive",
};

const Videos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pollingIds, setPollingIds] = useState<Map<string, string>>(new Map());

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    script: "",
    visual_style: "dark_minimal",
    voice_persona: "professional_male",
  });

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  // Poll for generating videos
  useEffect(() => {
    const generatingVideos = videos.filter(v => v.status === "generating");
    if (generatingVideos.length === 0) return;

    const interval = setInterval(() => {
      generatingVideos.forEach(video => {
        const projectId = pollingIds.get(video.id);
        if (projectId) {
          checkVideoStatus(video.id, projectId);
        }
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [videos, pollingIds]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos((data as GeneratedVideo[]) || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkVideoStatus = async (videoId: string, projectId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("check-video-status", {
        body: { video_id: videoId, project_id: projectId },
      });

      if (error) throw error;

      if (data.status === "ready" || data.status === "failed") {
        // Remove from polling
        setPollingIds(prev => {
          const next = new Map(prev);
          next.delete(videoId);
          return next;
        });
        // Refresh videos list
        fetchVideos();
        
        if (data.status === "ready") {
          toast({ title: "Video ready!", description: "Your video has finished rendering" });
        }
      }
    } catch (error) {
      console.error("Error checking video status:", error);
    }
  };

  const handleGenerate = async () => {
    if (!formData.title.trim() || !formData.script.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and script are required",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: {
          title: formData.title.trim(),
          script: formData.script.trim(),
          visual_style: formData.visual_style,
          voice_persona: formData.voice_persona,
        },
      });

      if (error) throw error;

      if (data.success) {
        // Add to polling map
        setPollingIds(prev => new Map(prev).set(data.video_id, data.project_id));
        
        toast({ title: "Video generation started!" });
        setDialogOpen(false);
        setFormData({
          title: "",
          script: "",
          visual_style: "dark_minimal",
          voice_persona: "professional_male",
        });
        fetchVideos();
      } else {
        throw new Error(data.error || "Failed to generate video");
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate video",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Video deleted" });
      fetchVideos();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const publishToYouTube = async (video: GeneratedVideo) => {
    // Check if YouTube is connected
    const accessToken = localStorage.getItem("youtube_access_token");
    const refreshToken = localStorage.getItem("youtube_refresh_token");

    if (!accessToken) {
      toast({
        title: "YouTube Not Connected",
        description: "Please connect your YouTube account in Settings first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update UI optimistically
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, status: "publishing" as VideoStatus } : v
      ));

      const { data, error } = await supabase.functions.invoke("youtube-upload", {
        body: {
          video_id: video.id,
          access_token: accessToken,
          refresh_token: refreshToken,
          title: video.title,
          description: `Generated with AI • ${video.visual_style} style`,
          tags: ["shorts", "ai", "generated"],
          privacy_status: "public",
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({ 
          title: "Published to YouTube!", 
          description: `Watch at youtube.com/shorts/${data.youtube_video_id}` 
        });
        fetchVideos();
      } else {
        throw new Error(data.error || "Failed to publish");
      }
    } catch (error) {
      console.error("Error publishing to YouTube:", error);
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Failed to publish to YouTube",
        variant: "destructive",
      });
      fetchVideos(); // Refresh to get actual status
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) return "Just now";
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchVideos}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Generate Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Generate New Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Video Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter video title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="script">Script *</Label>
                  <Textarea
                    id="script"
                    placeholder="Enter your video script (max 40 words recommended)"
                    value={formData.script}
                    onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.script.split(/\s+/).filter(w => w).length} / 40 words
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Visual Style</Label>
                    <Select
                      value={formData.visual_style}
                      onValueChange={(v) => setFormData({ ...formData, visual_style: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VISUAL_STYLES.map((style) => (
                          <SelectItem key={style.id} value={style.id}>
                            {style.preview} {style.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select
                      value={formData.voice_persona}
                      onValueChange={(v) => setFormData({ ...formData, voice_persona: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICE_PERSONAS.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full"
                  variant="gradient"
                >
                  {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate Video
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Video style info */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold mb-3">Available Visual Styles</h3>
        <div className="flex flex-wrap gap-2">
          {VISUAL_STYLES.map((style) => (
            <Badge key={style.id} variant="secondary">
              {style.preview} {style.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Video grid */}
      {videos.length === 0 ? (
        <div className="card-elevated p-16 text-center">
          <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No videos yet</h3>
          <p className="text-muted-foreground mb-4">
            Generate your first video to get started
          </p>
          <Button variant="gradient" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Video
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="card-elevated overflow-hidden group">
              {/* Thumbnail */}
              <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/20 to-accent/20">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {video.status === "generating" || video.status === "queued" ? (
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {video.status === "queued" ? "Queued..." : "Generating..."}
                        </p>
                      </div>
                    ) : video.status === "failed" ? (
                      <div className="text-center p-4">
                        <p className="text-sm text-destructive mb-2">Generation failed</p>
                        {video.error_message && (
                          <p className="text-xs text-muted-foreground">{video.error_message}</p>
                        )}
                      </div>
                    ) : (
                      <Video className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                )}

                {video.video_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => window.open(video.video_url!, "_blank")}
                  >
                    <Play className="h-8 w-8" />
                  </Button>
                )}

                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-background/80 text-xs">
                  {formatDuration(video.duration_seconds)}
                </div>

                {/* Style badge */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-background/80">
                    {VISUAL_STYLES.find((s) => s.id === video.visual_style)?.name || video.visual_style}
                  </Badge>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteVideo(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(video.created_at)}
                    </span>
                  </div>
                  <Badge className={cn("text-xs", statusColors[video.status])}>
                    {video.status}
                  </Badge>
                </div>

                {video.status === "ready" && video.video_url && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="gradient" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => publishToYouTube(video)}
                    >
                      Publish to YouTube
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(video.video_url!, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {video.status === "publishing" && (
                  <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing to YouTube...
                  </div>
                )}
                {video.status === "published" && video.youtube_video_id && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => window.open(`https://youtube.com/shorts/${video.youtube_video_id}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on YouTube
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Videos;
