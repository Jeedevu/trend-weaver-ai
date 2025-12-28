import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Loader2,
  Layers,
  Youtube,
  Mail,
  Instagram,
  Smartphone,
  Lock,
  Globe,
  Clock,
  Mic,
  Image,
  MonitorPlay,
  Square,
  CheckCircle2,
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

// Content Topics
const CONTENT_TOPICS = [
  { id: "custom_prompt", name: "Custom Prompt", isCustom: true },
  { id: "bible_stories", name: "Bible Stories", isNew: true },
  { id: "random_ai_story", name: "Random AI Story" },
  { id: "travel_destinations", name: "Travel Destinations" },
  { id: "what_if", name: "What If?" },
  { id: "scary_stories", name: "Scary Stories" },
  { id: "bedtime_stories", name: "Bedtime Stories" },
  { id: "interesting_history", name: "Interesting History" },
  { id: "urban_legends", name: "Urban Legends" },
  { id: "motivational", name: "Motivational" },
  { id: "fun_facts", name: "Fun Facts" },
  { id: "long_form_jokes", name: "Long Form Jokes" },
  { id: "life_pro_tips", name: "Life Pro Tips" },
  { id: "eli5", name: "ELI5" },
  { id: "philosophy", name: "Philosophy" },
  { id: "product_marketing", name: "Product Marketing" },
  { id: "fake_text_message", name: "Fake Text Message" },
  { id: "engagement_bait", name: "Engagement Bait" },
  { id: "web_search", name: "Web Search" },
];

// Voice options with descriptions
const VOICE_PERSONAS = [
  { id: "echo", name: "Echo", description: "Male, American, Excited" },
  { id: "alloy", name: "Alloy", description: "Female, American" },
  { id: "onyx", name: "Onyx", description: "Male, American, Slow, Deep" },
  { id: "fable", name: "Fable", description: "Female, British" },
  { id: "nova", name: "Nova", description: "Female, American, Warm" },
  { id: "shimmer", name: "Shimmer", description: "Female, Soft, Gentle" },
];

// Art styles with preview images (using placeholder colors for now)
const ART_STYLES = [
  { id: "autoshorts", name: "AutoShorts", color: "from-amber-900 to-amber-700" },
  { id: "lego", name: "Lego", color: "from-yellow-500 to-orange-500" },
  { id: "comic_book", name: "Comic Book", color: "from-blue-600 to-purple-600" },
  { id: "disney_toon", name: "Disney Toon", color: "from-sky-400 to-blue-500" },
  { id: "anime", name: "Anime", color: "from-pink-500 to-purple-500" },
  { id: "realistic", name: "Realistic", color: "from-gray-600 to-gray-800" },
  { id: "minecraft", name: "Minecraft", color: "from-green-600 to-green-800" },
  { id: "watercolor", name: "Watercolor", color: "from-rose-300 to-purple-300" },
];

// Aspect ratios
const ASPECT_RATIOS = [
  { id: "9:16", name: "Vertical (9:16)", icon: Smartphone },
  { id: "16:9", name: "Horizontal (16:9)", icon: MonitorPlay },
  { id: "1:1", name: "Square (1:1)", icon: Square },
];

// Languages
const LANGUAGES = [
  { id: "en", name: "English", flag: "🇺🇸" },
  { id: "es", name: "Spanish", flag: "🇪🇸" },
  { id: "fr", name: "French", flag: "🇫🇷" },
  { id: "de", name: "German", flag: "🇩🇪" },
  { id: "pt", name: "Portuguese", flag: "🇧🇷" },
  { id: "hi", name: "Hindi", flag: "🇮🇳" },
];

// Duration options
const DURATIONS = [
  { id: "30-60", name: "30 to 60 seconds" },
  { id: "60-90", name: "60 to 90 seconds" },
  { id: "90-120", name: "90 to 120 seconds" },
];

// Destinations
const DESTINATIONS = [
  { id: "email", name: "Email Me Instead", icon: Mail, available: true },
  { id: "youtube", name: "Link a YouTube Account +", icon: Youtube, available: false },
  { id: "tiktok", name: "Link a TikTok Account +", icon: Smartphone, available: false },
  { id: "instagram", name: "Link an Instagram Account +", icon: Instagram, available: false },
];

export default function Series() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    destination: "email",
    topic: "bedtime_stories",
    voice_persona: "echo",
    art_style: "autoshorts",
    aspect_ratio: "9:16",
    language: "en",
    duration: "60-90",
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
      destination: "email",
      topic: "bedtime_stories",
      voice_persona: "echo",
      art_style: "autoshorts",
      aspect_ratio: "9:16",
      language: "en",
      duration: "60-90",
    });
    setEditingSeries(null);
    setShowCreator(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const topicData = CONTENT_TOPICS.find(t => t.id === formData.topic);
      const payload = {
        name: topicData?.name || formData.topic,
        description: `${formData.aspect_ratio} • ${formData.duration}`,
        topic: formData.topic,
        visual_style: formData.art_style,
        voice_persona: formData.voice_persona,
        posting_frequency: "daily",
        posting_time: "12:00:00",
        platforms: [formData.destination],
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show series list or create form
  if (!showCreator && series.length > 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/90 to-primary rounded-2xl p-8 text-primary-foreground">
          <h1 className="text-2xl font-bold tracking-tight mb-2">YOUR SERIES</h1>
          <div className="w-20 h-1 bg-primary-foreground/30 rounded-full" />
        </div>

        {/* Series Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {series.map((s) => (
            <Card key={s.id} className="relative group overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">{s.topic}</p>
                  </div>
                  <Badge variant={s.status === "active" ? "default" : "secondary"}>
                    {s.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    <span>{ART_STYLES.find(a => a.id === s.visual_style)?.name || s.visual_style}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    <span>{VOICE_PERSONAS.find(v => v.id === s.voice_persona)?.name || s.voice_persona}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{s.videos_created} videos created</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={s.status === "active" ? "outline" : "default"}
                    onClick={() => toggleStatus(s)}
                    className="flex-1"
                  >
                    {s.status === "active" ? (
                      <><Pause className="h-4 w-4 mr-1" /> Pause</>
                    ) : (
                      <><Play className="h-4 w-4 mr-1" /> Activate</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteSeries(s.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Card */}
          <Card
            className="border-dashed cursor-pointer hover:border-primary transition-colors"
            onClick={() => setShowCreator(true)}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] p-6">
              <Plus className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-muted-foreground font-medium">Create New Series</span>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show empty state or creator
  return (
    <div className="space-y-0">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary/90 to-primary rounded-t-2xl p-8 text-center text-primary-foreground">
        <h1 className="text-3xl font-bold tracking-tight mb-3">CREATE A SERIES</h1>
        <p className="text-primary-foreground/80 max-w-md mx-auto">
          Schedule a series of Faceless Videos to post on auto-pilot.
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="rounded-t-none border-t-0">
        <CardContent className="p-6 md:p-8 space-y-8">
          {/* Step 1: Destination */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Step 1
              </Badge>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary mb-1">Destination</h2>
              <p className="text-sm text-muted-foreground">
                The account where your video series will be posted
              </p>
            </div>
            <Select
              value={formData.destination}
              onValueChange={(v) => setFormData({ ...formData, destination: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Destination" />
              </SelectTrigger>
              <SelectContent>
                {DESTINATIONS.map((dest) => (
                  <SelectItem
                    key={dest.id}
                    value={dest.id}
                    disabled={!dest.available}
                    className="py-3"
                  >
                    <div className="flex items-center gap-3">
                      <dest.icon className="h-5 w-5" />
                      <span>{dest.name}</span>
                      {!dest.available && <Lock className="h-4 w-4 text-muted-foreground ml-auto" />}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Content */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Step 2
              </Badge>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary mb-1">Content</h2>
              <p className="text-sm text-muted-foreground">
                What will your video series be about?
              </p>
            </div>
            <Select
              value={formData.topic}
              onValueChange={(v) => setFormData({ ...formData, topic: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose Content" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1">
                  Custom Topic ✨
                </div>
                <SelectItem value="custom_prompt">Custom Prompt</SelectItem>
                
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1 mt-2">
                  Popular Topics 🔥
                </div>
                {CONTENT_TOPICS.filter(t => !t.isCustom).map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    <div className="flex items-center gap-2">
                      {topic.name}
                      {topic.isNew && (
                        <Badge variant="secondary" className="text-xs py-0 px-1.5">
                          New!
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button className="text-sm text-primary hover:underline">
              Show Sample
            </button>
          </div>

          {/* Step 3: Series Settings */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Step 3
              </Badge>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary mb-1">Series Settings</h2>
              <p className="text-sm text-muted-foreground">
                Preferences for every video in your series
              </p>
            </div>

            {/* Narration Voice */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Narration Voice
              </Label>
              <div className="space-y-1">
                {VOICE_PERSONAS.map((voice) => (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, voice_persona: voice.id })}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      formData.voice_persona === voice.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted/50"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <Play className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{voice.name}</div>
                      <div className="text-sm text-muted-foreground">{voice.description}</div>
                    </div>
                    {formData.voice_persona === voice.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Art Style */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Art Style
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {ART_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, art_style: style.id })}
                    className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                      formData.art_style === style.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-b ${style.color}`} />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 text-center font-medium">
                      {style.name.toUpperCase()}
                    </div>
                    {formData.art_style === style.id && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MonitorPlay className="h-4 w-4" />
                Aspect Ratio
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, aspect_ratio: ratio.id })}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      formData.aspect_ratio === ratio.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <ratio.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{ratio.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Video Language */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Video Language
              </Label>
              <Select
                value={formData.language}
                onValueChange={(v) => setFormData({ ...formData, language: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      <span className="flex items-center gap-2">
                        {lang.name} {lang.flag}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Preference */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration Preference
              </Label>
              <Select
                value={formData.duration}
                onValueChange={(v) => setFormData({ ...formData, duration: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((dur) => (
                    <SelectItem key={dur.id} value={dur.id}>
                      {dur.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Step 4: Create */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Step 4
              </Badge>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary mb-1">Create</h2>
              <p className="text-sm text-muted-foreground">
                You will be able to preview your upcoming videos before posting
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full"
              variant="gradient"
              size="lg"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              CREATE SERIES +
            </Button>

            {series.length > 0 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={resetForm}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Empty state - only show if no series */}
      {series.length === 0 && !showCreator && (
        <Card className="border-dashed mt-6">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              You haven't started a Faceless Video series yet.
            </h3>
            <Button variant="gradient" onClick={() => setShowCreator(true)}>
              CREATE YOUR SERIES
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
