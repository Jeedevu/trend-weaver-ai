import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendCard } from "@/components/dashboard/TrendCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  RefreshCw, 
  TrendingUp,
  Sparkles,
  Clock,
  AlertTriangle,
  Loader2
} from "lucide-react";

interface Trend {
  id: string;
  name: string;
  description: string;
  velocity_score: number;
  shelf_life: string;
  ai_suitability_score: number;
  category: string;
  is_hot: boolean;
}

const Trends = () => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trends')
        .select('*')
        .eq('status', 'active')
        .order('velocity_score', { ascending: false });

      if (error) throw error;
      setTrends(data || []);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["All", ...new Set(trends.map(t => t.category).filter(Boolean))];

  const filteredTrends = trends.filter((trend) => {
    const matchesCategory = selectedCategory === "All" || trend.category === selectedCategory;
    const matchesSearch = trend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (trend.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const hotTrendsCount = trends.filter(t => t.is_hot).length;

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
          <TrendingUp className="h-6 w-6 text-primary" />
          Trend Intelligence
        </h1>
        <p className="text-muted-foreground">
          Discover FORMAT-LEVEL trends optimized for AI video generation
        </p>
      </div>

      {/* Trend stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{hotTrendsCount}</p>
            <p className="text-sm text-muted-foreground">Hot Trends</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <TrendingUp className="h-6 w-6 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold">{trends.length}</p>
            <p className="text-sm text-muted-foreground">Active Trends</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/10">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">Live</p>
            <p className="text-sm text-muted-foreground">Last Updated</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={fetchTrends}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Rejected formats warning */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
        <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Filtered Out</p>
          <p className="text-sm text-muted-foreground">
            Overused trends, copyright-risky formats, and human-acting-heavy content are automatically excluded.
          </p>
        </div>
      </div>

      {/* Trend grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrends.map((trend) => (
          <TrendCard 
            key={trend.id} 
            name={trend.name}
            description={trend.description || ''}
            velocityScore={trend.velocity_score}
            shelfLife={trend.shelf_life || 'Unknown'}
            aiSuitability={trend.ai_suitability_score}
            category={trend.category || 'General'}
            isHot={trend.is_hot}
          />
        ))}
      </div>

      {filteredTrends.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No trends match your filters</p>
        </div>
      )}
    </div>
  );
};

export default Trends;
