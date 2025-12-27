import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-24 pb-12">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
          <span className="gradient-text">Faceless Videos</span> on
          <br />
          Auto-Pilot.
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Our powerful AI video creation platform allows you to fully automate a 
          faceless channel. Get views and grow while you sleep.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 mb-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <Button 
            variant="hero" 
            size="xl" 
            onClick={() => navigate("/dashboard/series")}
            className="text-lg px-10 py-6"
          >
            Try AutoShorts.ai for Free
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <p className="text-sm text-muted-foreground">
            (No credit card required)
          </p>
        </div>

        {/* Squiggle arrow pointing down */}
        <div className="flex justify-center mb-8 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <svg 
            className="w-12 h-16 text-muted-foreground/50 squiggle-arrow"
            viewBox="0 0 50 70" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M25 5C25 5 15 20 25 25C35 30 20 40 25 50C30 60 25 65 25 65M25 65L20 55M25 65L30 55" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
