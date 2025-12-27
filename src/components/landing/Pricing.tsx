import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const plans = [
  {
    name: "FREE",
    price: "0",
    yearlyPrice: "0",
    highlight: "Creates 1 video",
    features: [
      { name: "1 Series", included: true },
      { name: "Auto-post to channel", included: true },
      { name: "Edit & preview videos", included: true },
      { name: "HD Video Resolution", included: true },
      { name: "Background Music", included: false },
      { name: "Voice Cloning", included: false },
      { name: "No Watermark", included: false },
    ],
    cta: "Temporarily paused",
    disabled: true,
    popular: false,
  },
  {
    name: "STARTER",
    price: "19",
    yearlyPrice: "13",
    highlight: "Posts 3 times a week",
    features: [
      { name: "1 Series", included: true },
      { name: "Auto-post to channel", included: true },
      { name: "Edit & preview videos", included: true },
      { name: "HD Video Resolution", included: true },
      { name: "Background Music", included: true },
      { name: "Voice Cloning", included: true },
      { name: "No Watermark", included: true },
    ],
    cta: "Try Now!",
    disabled: false,
    popular: false,
  },
  {
    name: "DAILY",
    price: "39",
    yearlyPrice: "27",
    highlight: "Posts once a day",
    features: [
      { name: "1 Series", included: true },
      { name: "Auto-post to channel", included: true },
      { name: "Edit & preview videos", included: true },
      { name: "HD Video Resolution", included: true },
      { name: "Background Music", included: true },
      { name: "Voice Cloning", included: true },
      { name: "No Watermark", included: true },
    ],
    cta: "Try Now!",
    disabled: false,
    popular: true,
  },
  {
    name: "HARDCORE",
    price: "69",
    yearlyPrice: "48",
    highlight: "Posts twice a day",
    features: [
      { name: "1 Series", included: true },
      { name: "Auto-post to channel", included: true },
      { name: "Edit & preview videos", included: true },
      { name: "HD Video Resolution", included: true },
      { name: "Background Music", included: true },
      { name: "Voice Cloning", included: true },
      { name: "No Watermark", included: true },
    ],
    cta: "Try Now!",
    disabled: false,
    popular: false,
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-secondary/30" id="pricing">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            PRICING
          </p>
          <h2 className="text-4xl font-bold mb-8">
            PAY FOR WHAT YOU NEED
          </h2>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn(
              "font-medium transition-colors",
              !isYearly ? "text-foreground" : "text-muted-foreground"
            )}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={cn(
                "relative w-14 h-8 rounded-full transition-colors",
                isYearly ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform",
                  isYearly ? "translate-x-7" : "translate-x-1"
                )}
              />
            </button>
            <span className={cn(
              "font-medium transition-colors",
              isYearly ? "text-foreground" : "text-muted-foreground"
            )}>
              Yearly
            </span>
            {isYearly && (
              <span className="px-3 py-1 text-sm font-semibold text-primary-foreground bg-gradient-to-r from-primary to-accent rounded-full">
                5 months free!
              </span>
            )}
          </div>
        </div>

        {/* Pricing grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl p-6 bg-card border transition-all duration-300",
                plan.popular
                  ? "border-primary shadow-xl shadow-primary/10 scale-105 z-10"
                  : "border-border hover:border-primary/30"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold">
                  MOST POPULAR
                </div>
              )}

              {/* Plan name */}
              <h3 className="text-xl font-bold mb-2 text-center">{plan.name}</h3>
              
              {/* Price */}
              <div className="text-center mb-4">
                <span className="text-5xl font-bold">${isYearly ? plan.yearlyPrice : plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              {/* Highlight */}
              <p className="text-center text-sm text-muted-foreground mb-6">
                {plan.highlight.split(/(\d+)/g).map((part, i) => (
                  part.match(/\d+/) ? <strong key={i} className="text-foreground">{part}</strong> : part
                ))}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-3">
                    {feature.included ? (
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <X className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                    <span className={cn(
                      "text-sm",
                      !feature.included && "text-muted-foreground"
                    )}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                variant={plan.popular ? "hero" : plan.disabled ? "outline" : "gradient"}
                className="w-full"
                disabled={plan.disabled}
                onClick={() => !plan.disabled && navigate("/auth")}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
