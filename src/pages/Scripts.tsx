import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Sparkles, 
  Copy, 
  RefreshCw, 
  Check,
  AlertCircle,
  Mic,
  Clock,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
}

interface GeneratedScript {
  id: string;
  content: string;
  word_count: number;
  hook_text: string | null;
  status: string;
  created_at: string;
}

const Scripts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ScriptTemplate[]>([]);
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("hook_fact");
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('script_templates')
        .select('id, name, description');

      if (templatesError) throw templatesError;
      setTemplates(templatesData || []);

      // Fetch user's scripts
      if (user) {
        const { data: scriptsData, error: scriptsError } = await supabase
          .from('scripts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (scriptsError) throw scriptsError;
        setScripts(scriptsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        variant: "destructive",
        title: "Topic required",
        description: "Please enter a topic or fact for the script.",
      });
      return;
    }

    setGenerating(true);
    try {
      // Call edge function
      const { data, error } = await supabase.functions.invoke('generate-script', {
        body: { topic, template: selectedTemplate },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Save to database
      const { data: savedScript, error: saveError } = await supabase
        .from('scripts')
        .insert({
          user_id: user?.id,
          content: data.content,
          word_count: data.wordCount,
          hook_text: data.hookText,
          status: 'draft',
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setScripts([savedScript, ...scripts]);
      setTopic("");
      
      toast({
        title: "Script generated!",
        description: `${data.wordCount} words, ready for review.`,
      });
    } catch (error: any) {
      console.error('Error generating script:', error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.name)}
                  className={cn(
                    "p-3 rounded-lg text-left transition-all border",
                    selectedTemplate === template.name
                      ? "bg-primary/10 border-primary/50"
                      : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
                  )}
                >
                  <p className="font-medium text-sm">{template.description}</p>
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

          <Button 
            variant="gradient" 
            className="w-full" 
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "Generating..." : "Generate Script"}
          </Button>
        </div>

        {/* Generated scripts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Generated Scripts</h2>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin">
            {scripts.map((script) => (
              <div key={script.id} className="card-elevated p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Script</Badge>
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
                      {script.word_count} words
                    </span>
                    <span className="flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      ~{Math.round(script.word_count / 2.5)}s read
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
                  </div>
                </div>
              </div>
            ))}
            {scripts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No scripts yet. Generate your first one!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scripts;
