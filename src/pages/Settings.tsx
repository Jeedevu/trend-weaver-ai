import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon, 
  Youtube, 
  Mic, 
  Shield, 
  Bell,
  CreditCard,
  Link,
  AlertTriangle,
  Check
} from "lucide-react";

const Settings = () => {
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
              <p className="text-sm text-muted-foreground">Connect your channel for publishing</p>
            </div>
          </div>
          <Badge variant="outline" className="text-success border-success/30">
            <Check className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        </div>
        
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent" />
            <div>
              <p className="font-medium">@FactsDaily</p>
              <p className="text-sm text-muted-foreground">2.4K subscribers</p>
            </div>
          </div>
        </div>

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
          {["Professional Male", "Professional Female", "Casual Male", "Casual Female"].map((voice, i) => (
            <button
              key={voice}
              className={`p-3 rounded-lg border text-left transition-all ${
                i === 0 
                  ? "bg-primary/10 border-primary/50" 
                  : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
              }`}
            >
              <p className="font-medium text-sm">{voice}</p>
              <p className="text-xs text-muted-foreground">English (US)</p>
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
            <Switch defaultChecked />
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
          <Badge>Starter</Badge>
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
