import { cn } from "@/lib/utils";
import { TrendingUp, Clock, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrendCardProps {
  name: string;
  description: string;
  velocityScore: number;
  shelfLife: string;
  aiSuitability: number;
  category: string;
  isHot?: boolean;
  onClick?: () => void;
}

export function TrendCard({
  name,
  description,
  velocityScore,
  shelfLife,
  aiSuitability,
  category,
  isHot,
  onClick,
}: TrendCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <div
      className={cn(
        "card-elevated p-5 hover:border-primary/30 transition-all duration-200 cursor-pointer group",
        isHot && "border-primary/30 bg-gradient-to-br from-card to-primary/5"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          {isHot && (
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Hot
            </Badge>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
        {name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {description}
      </p>

      <div className="grid grid-cols-3 gap-3">
        <div className="metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Velocity</span>
          </div>
          <p className={cn("text-lg font-bold", getScoreColor(velocityScore))}>
            {velocityScore}
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Shelf Life</span>
          </div>
          <p className="text-lg font-bold">{shelfLife}</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">AI Score</span>
          </div>
          <p className={cn("text-lg font-bold", getScoreColor(aiSuitability))}>
            {aiSuitability}
          </p>
        </div>
      </div>

      <Button variant="gradient" className="w-full mt-4" size="sm">
        Generate Video
      </Button>
    </div>
  );
}
