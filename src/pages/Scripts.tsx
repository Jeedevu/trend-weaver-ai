import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Check,
  AlertCircle,
  Mic,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

const scriptTemplates = [
  { id: "hook-fact", name: "Hook + Fact", description: "Start with question, deliver surprising answer" },
  { id: "pov-reveal", name: "POV Reveal", description: "First person perspective with dramatic reveal" },
  { id: "comparison", name: "This vs That", description: "Quick comparison with clear winner" },
  { id: "countdown", name: "Countdown", description: "Top 3 or 5 with quick transitions" },
];

const generatedScripts = [
  {
    id: 1,
    content: "Did you know the ocean produces more oxygen than all the rainforests combined? It's true. Phytoplankton generate over 50% of Earth's oxygen. So next time you breathe, thank the ocean.",
    wordCount: 34,
    template: "Hook + Fact",
    hookTime: "0-2s",
    status: "approved",
  },
  {
    id: 2,
    content: "POV: You just learned that honey never expires. Archaeologists found 3000-year-old honey in Egyptian tombs. Still perfectly edible. Nature's only food that lasts forever.",
    wordCount: 31,
    template: "POV Reveal",
    hookTime: "0-2s",
    status: "pending",
  },
];

const Scripts = () => {
  const [selectedTemplate, setSelectedTemplate] = useState("hook-fact");
  const [topic, setTopic] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const handleCopy = (id: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Script Engine
        </h1>
        <p className="text-muted-foreground">
          Generate constrained scripts optimized for short-form video
        </p>
      </div>

      {/* Constraints reminder */}
      <div className="card-elevated p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          Script Constraints (Enforced)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Max 40 words
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Hook in 2 seconds
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Spoken English only
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            No emojis or fluff
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Generate New Script</h2>
          
          {/* Template selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {scriptTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    "p-3 rounded-lg text-left transition-all border",
                    selectedTemplate === template.id
                      ? "bg-primary/10 border-primary/50"
                      : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
                  )}
                >
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Topic input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic or Fact</label>
            <Textarea
              placeholder="e.g., The largest living organism on Earth is a fungus"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <Button variant="gradient" className="w-full">
            <Sparkles className="h-4 w-4" />
            Generate Script
          </Button>
        </div>

        {/* Generated scripts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Generated Scripts</h2>
          
          <div className="space-y-4">
            {generatedScripts.map((script) => (
              <div key={script.id} className="card-elevated p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{script.template}</Badge>
                  <Badge 
                    variant={script.status === "approved" ? "default" : "outline"}
                    className={script.status === "approved" ? "bg-success/20 text-success" : ""}
                  >
                    {script.status}
                  </Badge>
                </div>
                
                <p className="text-sm leading-relaxed">{script.content}</p>
                
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {script.wordCount} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Hook: {script.hookTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      ~{Math.round(script.wordCount / 2.5)}s read
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleCopy(script.id, script.content)}
                    >
                      {copied === script.id ? (
                        <Check className="h-4 w-4 text-success" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scripts;
