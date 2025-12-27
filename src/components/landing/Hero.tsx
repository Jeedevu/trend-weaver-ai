import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Zap, TrendingUp, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
          <span className="status-dot-success" />
          <span className="text-sm font-medium text-primary">
            Production-Ready SaaS
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
          Automate{" "}
          <span className="gradient-text">Short-Form</span>
          <br />
          Video Creation
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Detect emerging trends, generate AI-powered scripts, and safely publish 
          to YouTube Shorts. Built for reliability, not hype.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button 
            variant="hero" 
            size="xl" 
            onClick={() => navigate("/dashboard")}
          >
            Start Creating
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="xl">
            <Play className="h-5 w-5" />
            Watch Demo
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Template-Driven</span>
          </div>
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50">
            <TrendingUp className="h-5 w-5 text-success" />
            <span className="text-sm font-medium">Real-Time Trends</span>
          </div>
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50">
            <Shield className="h-5 w-5 text-warning" />
            <span className="text-sm font-medium">Platform Safe</span>
          </div>
        </div>
      </div>
    </section>
  );
}
