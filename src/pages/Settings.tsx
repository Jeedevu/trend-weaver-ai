import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Youtube, 
  Mic, 
  Shield, 
  Bell,
  CreditCard,
  AlertTriangle,
  Check,
  Loader2,
  ExternalLink,
  X
} from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<{
    youtube_connected: boolean;
    youtube_channel_id: string | null;
    youtube_channel_name: string | null;
    voice_persona: string | null;
    manual_approval_required: boolean;
    subscription_tier: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const state = params.get("state");

      if (code && state) {
        setConnecting(true);
        try {
          // Get current session
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error("Not authenticated");

          // Exchange code for tokens
          const { data, error } = await supabase.functions.invoke("youtube-auth", {
            body: { 
              action: "exchange-code",
              code, 
              redirect_uri: `${window.location.origin}/dashboard/settings` 
            },
          });

          // Remove code from URL
          window.history.replaceState({}, "", window.location.pathname);

          if (error) throw error;

          if (data.success) {
            // Tokens are now stored securely in the database
            toast({ 
              title: "YouTube Connected!", 
              description: `Connected to ${data.channel_name || "your channel"}` 
            });
            fetchProfile();
          } else {
            throw new Error(data.error || "Failed to connect YouTube");
          }
        } catch (error) {
          console.error("OAuth callback error:", error);
          toast({
            title: "Connection Failed",
            description: error instanceof Error ? error.message : "Failed to connect YouTube",
            variant: "destructive",
          });
        } finally {
          setConnecting(false);
        }
      }
    };

    handleCallback();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("youtube_connected, youtube_channel_id, youtube_channel_name, voice_persona, manual_approval_required, subscription_tier")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const connectYouTube = async () => {
    setConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("youtube-auth", {
        body: { 
          action: "get-auth-url",
          redirect_uri: `${window.location.origin}/dashboard/settings` 
        },
      });

      if (error) throw error;

      if (data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        throw new Error("No auth URL returned");
      }
    } catch (error) {
      console.error("Error connecting YouTube:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to start YouTube connection",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  const disconnectYouTube = async () => {
    if (!confirm("Are you sure you want to disconnect YouTube?")) return;
    
    setDisconnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { error } = await supabase.functions.invoke("youtube-auth", {
        body: { action: "disconnect" },
      });

      if (error) throw error;

      // Tokens are now cleared from the database by the edge function

      toast({ title: "YouTube Disconnected" });
      fetchProfile();
    } catch (error) {
      console.error("Error disconnecting YouTube:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect YouTube",
        variant: "destructive",
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const updateVoicePersona = async (persona: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ voice_persona: persona })
        .eq("id", user?.id);

      if (error) throw error;
      setProfile(prev => prev ? { ...prev, voice_persona: persona } : null);
      toast({ title: "Voice updated" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update voice",
        variant: "destructive",
      });
    }
  };

  const updateManualApproval = async (required: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ manual_approval_required: required })
        .eq("id", user?.id);

      if (error) throw error;
      setProfile(prev => prev ? { ...prev, manual_approval_required: required } : null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const voiceOptions = [
    { id: "professional_male", name: "Professional Male", locale: "English (US)" },
    { id: "professional_female", name: "Professional Female", locale: "English (US)" },
    { id: "energetic_male", name: "Energetic Male", locale: "English (US)" },
    { id: "energetic_female", name: "Energetic Female", locale: "English (US)" },
    { id: "calm_narrator", name: "Calm Narrator", locale: "English (US)" },
    { id: "dramatic", name: "Dramatic", locale: "English (GB)" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account, connections, and preferences
        </p>
      </div>

      {/* Connected channel */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Youtube className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">YouTube Channel</h3>
              <p className="text-sm text-muted-foreground">Connect your channel for auto-publishing</p>
            </div>
          </div>
          {profile?.youtube_connected ? (
            <Badge variant="outline" className="text-success border-success/30">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Not Connected
            </Badge>
          )}
        </div>
        
        {profile?.youtube_connected ? (
          <>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Youtube className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{profile.youtube_channel_name || "YouTube Channel"}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.youtube_channel_id ? `ID: ${profile.youtube_channel_id.slice(0, 10)}...` : "Connected"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={disconnectYouTube}
                  disabled={disconnecting}
                  className="text-destructive hover:text-destructive"
                >
                  {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Disconnect
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ✓ Ready to auto-publish videos as YouTube Shorts
            </p>
          </>
        ) : (
          <>
            <Button 
              onClick={connectYouTube} 
              disabled={connecting}
              className="w-full"
              variant="gradient"
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Youtube className="h-4 w-4 mr-2" />
              )}
              Connect YouTube Channel
            </Button>
            <p className="text-xs text-muted-foreground">
              Connect your YouTube channel to enable auto-publishing of generated videos as Shorts.
            </p>
          </>
        )}

        <p className="text-xs text-muted-foreground">
          MVP supports 1 channel. Upgrade to Agency for multiple channels.
        </p>
      </div>

      {/* Voice personas */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Voice Persona</h3>
            <p className="text-sm text-muted-foreground">Consistent AI voice for all videos</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {voiceOptions.map((voice) => (
            <button
              key={voice.id}
              onClick={() => updateVoicePersona(voice.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                profile?.voice_persona === voice.id
                  ? "bg-primary/10 border-primary/50" 
                  : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
              }`}
            >
              <p className="font-medium text-sm">{voice.name}</p>
              <p className="text-xs text-muted-foreground">{voice.locale}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Safety settings */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <Shield className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold">Safety Controls</h3>
            <p className="text-sm text-muted-foreground">Platform compliance settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Manual Approval Required</p>
              <p className="text-xs text-muted-foreground">Review videos before publishing</p>
            </div>
            <Switch 
              checked={profile?.manual_approval_required ?? true}
              onCheckedChange={updateManualApproval}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Rate Limit Protection</p>
              <p className="text-xs text-muted-foreground">Enforce randomized posting delays</p>
            </div>
            <Switch defaultChecked disabled />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Content Scanning</p>
              <p className="text-xs text-muted-foreground">Check for policy violations</p>
            </div>
            <Switch defaultChecked disabled />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Rate limiting and content scanning cannot be disabled. Platform compliance is your responsibility per our TOS.
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-info/10">
            <Bell className="h-5 w-5 text-info" />
          </div>
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-sm text-muted-foreground">Email alerts for important events</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm">Video published successfully</p>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm">Publishing failed</p>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm">New trending format detected</p>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm">Daily limit reached</p>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="card-elevated p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <CreditCard className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Subscription</h3>
              <p className="text-sm text-muted-foreground">Manage your plan</p>
            </div>
          </div>
          <Badge className="capitalize">{profile?.subscription_tier || "starter"}</Badge>
        </div>

        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">$29/month</span>
            <span className="text-sm text-muted-foreground">Next billing: Jan 15, 2025</span>
          </div>
          <p className="text-sm text-muted-foreground">1 video/day • 1 channel • Basic trends</p>
        </div>

        <Button variant="gradient" className="w-full">
          Upgrade to Pro ($79/month)
        </Button>
      </div>
    </div>
  );
};

export default Settings;
