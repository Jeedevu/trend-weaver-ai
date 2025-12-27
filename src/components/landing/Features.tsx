import { 
  TrendingUp, 
  FileText, 
  Video, 
  Upload, 
  Shield, 
  BarChart3,
  Sparkles,
  Clock
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Trend Intelligence",
    description: "Detect FORMAT-LEVEL trends, not generic niches. Our engine calculates velocity, engagement ratio, and acceleration scores.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: FileText,
    title: "Constrained Scripts",
    description: "Max 40 words, spoken English, hook in 2 seconds. No motivational fluff. Just proven, repeatable formats.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Video,
    title: "AI Video Generation",
    description: "3-5 predefined visual styles. Loopable visuals. 7-15 second videos optimized for engagement.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: Upload,
    title: "Safe Automation",
    description: "Queue-based uploads with randomized timing. Daily limits enforced. No bulk patterns that trigger bans.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Shield,
    title: "Platform Compliant",
    description: "Clear TOS disclaimer. Action logs for everything. Kill-switch for policy violations.",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    icon: BarChart3,
    title: "Performance Tracking",
    description: "Monitor velocity scores, shelf-life estimates, and AI suitability. Data-driven decisions only.",
    color: "text-info",
    bgColor: "bg-info/10",
  },
];

export function Features() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Core Modules</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Built for <span className="gradient-text">Reliability</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every feature is designed for production use. No "press button go viral" claims. 
            Just repeatable, template-driven automation.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card-elevated p-6 hover:border-primary/30 transition-all duration-300 group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Process flow */}
        <div className="mt-20 p-8 rounded-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold">Detect Trend</h4>
                <p className="text-sm text-muted-foreground">AI analyzes velocity</p>
              </div>
            </div>
            <div className="hidden md:block w-16 h-px bg-border" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold">Generate Script</h4>
                <p className="text-sm text-muted-foreground">Template-constrained</p>
              </div>
            </div>
            <div className="hidden md:block w-16 h-px bg-border" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold">Create Video</h4>
                <p className="text-sm text-muted-foreground">AI visuals + voice</p>
              </div>
            </div>
            <div className="hidden md:block w-16 h-px bg-border" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold">Safe Publish</h4>
                <p className="text-sm text-muted-foreground">Queued & randomized</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
