import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Video,
  Calendar,
  Loader2,
  Layers,
} from "lucide-react";

interface Series {
  id: string;
  name: string;
  description: string | null;
  topic: string;
  prompt_template: string | null;
  visual_style: string;
  voice_persona: string;
  posting_frequency: string;
  posting_time: string;
  platforms: string[];
  status: "active" | "paused" | "completed";
  videos_created: number;
  next_video_at: string | null;
  created_at: string;
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

const POSTING_FREQUENCIES = [
  { id: "hourly", name: "Every Hour" },
  { id: "daily", name: "Daily" },
  { id: "twice_daily", name: "Twice Daily" },
  { id: "weekly", name: "Weekly" },
];

const PLATFORMS = [
  { id: "youtube", name: "YouTube Shorts", icon: "📺" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "instagram", name: "Instagram Reels", icon: "📷" },
];

export default function Series() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    topic: "",
    prompt_template: "",
    visual_style: "dark_minimal",
    voice_persona: "professional_male",
    posting_frequency: "daily",
    posting_time: "12:00",
    platforms: ["youtube"] as string[],
  });

  useEffect(() => {
    if (user) {
      fetchSeries();
    }
  }, [user]);

  const fetchSeries = async () => {
    try {
      const { data, error } = await supabase
        .from("series")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSeries((data as Series[]) || []);
    } catch (error) {
      console.error("Error fetching series:", error);
      toast({
        title: "Error",
        description: "Failed to load series",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      topic: "",
      prompt_template: "",
      visual_style: "dark_minimal",
      voice_persona: "professional_male",
      posting_frequency: "daily",
      posting_time: "12:00",
      platforms: ["youtube"],
    });
    setEditingSeries(null);
  };

  const openEditDialog = (s: Series) => {
    setEditingSeries(s);
    setFormData({
      name: s.name,
      description: s.description || "",
      topic: s.topic,
      prompt_template: s.prompt_template || "",
      visual_style: s.visual_style,
      voice_persona: s.voice_persona,
      posting_frequency: s.posting_frequency,
      posting_time: s.posting_time.slice(0, 5),
      platforms: s.platforms,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.topic.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and topic are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        topic: formData.topic.trim(),
        prompt_template: formData.prompt_template.trim() || null,
        visual_style: formData.visual_style,
        voice_persona: formData.voice_persona,
        posting_frequency: formData.posting_frequency,
        posting_time: formData.posting_time + ":00",
        platforms: formData.platforms,
        user_id: user!.id,
      };

      if (editingSeries) {
        const { error } = await supabase
          .from("series")
          .update(payload)
          .eq("id", editingSeries.id);
        if (error) throw error;
        toast({ title: "Series updated successfully" });
      } else {
        const { error } = await supabase.from("series").insert(payload);
        if (error) throw error;
        toast({ title: "Series created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchSeries();
    } catch (error) {
      console.error("Error saving series:", error);
      toast({
        title: "Error",
        description: "Failed to save series",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (s: Series) => {
    const newStatus = s.status === "active" ? "paused" : "active";
    try {
      const { error } = await supabase
        .from("series")
        .update({ status: newStatus })
        .eq("id", s.id);
      if (error) throw error;
      toast({
        title: `Series ${newStatus === "active" ? "activated" : "paused"}`,
      });
      fetchSeries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update series",
        variant: "destructive",
      });
    }
  };

  const deleteSeries = async (id: string) => {
    if (!confirm("Are you sure you want to delete this series?")) return;
    try {
      const { error } = await supabase.from("series").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Series deleted" });
      fetchSeries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete series",
        variant: "destructive",
      });
    }
  };

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Series</h1>
          <p className="text-muted-foreground">
            Create automated video series that post on schedule
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="h-4 w-4 mr-2" />
              New Series
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSeries ? "Edit Series" : "Create New Series"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Series Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Daily Tech Facts"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of your series"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic/Niche *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., AI, Psychology, History"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt">Custom Prompt Template</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Optional: Custom instructions for generating scripts"
                    value={formData.prompt_template}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prompt_template: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>

              {/* Visual Style */}
              <div className="space-y-3">
                <Label>Visual Style</Label>
                <div className="grid grid-cols-5 gap-2">
                  {VISUAL_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, visual_style: style.id })
                      }
                      className={`p-3 rounded-lg border text-center transition-all ${
                        formData.visual_style === style.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-2xl mb-1">{style.preview}</div>
                      <div className="text-xs">{style.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice & Schedule */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Voice Persona</Label>
                  <Select
                    value={formData.voice_persona}
                    onValueChange={(v) =>
                      setFormData({ ...formData, voice_persona: v })
                    }
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
                <div className="space-y-2">
                  <Label>Posting Frequency</Label>
                  <Select
                    value={formData.posting_frequency}
                    onValueChange={(v) =>
                      setFormData({ ...formData, posting_frequency: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POSTING_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.id} value={freq.id}>
                          {freq.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="posting_time">Posting Time</Label>
                <Input
                  id="posting_time"
                  type="time"
                  value={formData.posting_time}
                  onChange={(e) =>
                    setFormData({ ...formData, posting_time: e.target.value })
                  }
                />
              </div>

              {/* Platforms */}
              <div className="space-y-3">
                <Label>Posting Platforms</Label>
                <div className="flex gap-3">
                  {PLATFORMS.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        formData.platforms.includes(platform.id)
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span>{platform.icon}</span>
                      <span className="text-sm">{platform.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full"
                variant="gradient"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSeries ? "Update Series" : "Create Series"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Series Grid */}
      {series.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No series yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first automated video series to start generating
              content
            </p>
            <Button variant="gradient" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Series
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => (
            <Card key={s.id} className="relative group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{s.topic}</p>
                  </div>
                  <Badge
                    variant={s.status === "active" ? "default" : "secondary"}
                    className={
                      s.status === "active"
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : ""
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {s.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {s.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    <span>{s.videos_created} videos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{s.posting_frequency}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {VISUAL_STYLES.find((st) => st.id === s.visual_style)
                      ?.preview || "🎬"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {VISUAL_STYLES.find((st) => st.id === s.visual_style)
                      ?.name || s.visual_style}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {s.platforms.map((p) => (
                    <span key={p} className="text-sm">
                      {PLATFORMS.find((pl) => pl.id === p)?.icon}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStatus(s)}
                  >
                    {s.status === "active" ? (
                      <>
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(s)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteSeries(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
