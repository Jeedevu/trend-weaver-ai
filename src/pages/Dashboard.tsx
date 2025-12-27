import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TrendCard } from "@/components/dashboard/TrendCard";
import { VideoQueueItem } from "@/components/dashboard/VideoQueueItem";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Plus,
  Filter,
  RefreshCw,
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

interface VideoItem {
  id: string;
  title: string;
  status: "queued" | "generating" | "processing" | "ready" | "scheduled" | "publishing" | "published" | "failed";
  duration_seconds: number | null;
  scheduled_at: string | null;
  trend_id: string | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [videosToday, setVideosToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(1);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch trends
      const { data: trendsData, error: trendsError } = await supabase
        .from('trends')
        .select('*')
        .eq('status', 'active')
        .order('velocity_score', { ascending: false })
        .limit(4);

      if (trendsError) throw trendsError;
      setTrends(trendsData || []);

      // Fetch user's videos
      if (user) {
        const { data: videosData, error: videosError } = await supabase
          .from('videos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(4);

        if (videosError) throw videosError;
        setVideos(videosData || []);

        // Check limits
        const { data: limitsData } = await supabase.functions.invoke('check-limits');
        if (limitsData) {
          setVideosToday(limitsData.videosCreatedToday || 0);
          setDailyLimit(limitsData.dailyLimit || 1);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor trends and manage your video pipeline
          </p>
        </div>
        <Button variant="gradient">
          <Plus className="h-4 w-4" />
          Create Video
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Videos Created"
          value={videos.length}
          icon={Video}
        />
        <MetricCard
          title="Active Trends"
          value={trends.length}
          icon={TrendingUp}
        />
        <MetricCard
          title="Queue Status"
          value={videos.filter(v => v.status === 'queued' || v.status === 'scheduled').length}
          icon={Clock}
        />
        <MetricCard
          title="Published Today"
          value={`${videosToday}/${dailyLimit}`}
          icon={CheckCircle}
          iconColor="text-success"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Hot Trends
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="ghost" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trends.map((trend) => (
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
            {trends.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                No active trends found. Check back later.
              </div>
            )}
          </div>
        </div>

        {/* Queue section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Video Queue
            </h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {videos.map((video) => (
              <VideoQueueItem 
                key={video.id}
                title={video.title}
                status={video.status as any}
                duration={formatDuration(video.duration_seconds)}
                scheduledTime={video.scheduled_at ? new Date(video.scheduled_at).toLocaleString() : undefined}
              />
            ))}
            {videos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No videos yet. Create your first video!
              </div>
            )}
          </div>

          {/* Daily limit indicator */}
          <div className="card-elevated p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Daily Limit</span>
              <span className="text-sm text-muted-foreground">{videosToday}/{dailyLimit} videos</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all" 
                style={{ width: `${Math.min(100, (videosToday / dailyLimit) * 100)}%` }} 
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {dailyLimit === 1 ? "Upgrade to Pro for 3 videos/day" : `${dailyLimit - videosToday} videos remaining`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
