export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_video_date: string | null
          manual_approval_required: boolean
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          videos_created_today: number
          voice_persona: string | null
          youtube_access_token: string | null
          youtube_channel_id: string | null
          youtube_channel_name: string | null
          youtube_connected: boolean
          youtube_refresh_token: string | null
          youtube_token_expires_at: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          last_video_date?: string | null
          manual_approval_required?: boolean
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          videos_created_today?: number
          voice_persona?: string | null
          youtube_access_token?: string | null
          youtube_channel_id?: string | null
          youtube_channel_name?: string | null
          youtube_connected?: boolean
          youtube_refresh_token?: string | null
          youtube_token_expires_at?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_video_date?: string | null
          manual_approval_required?: boolean
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          videos_created_today?: number
          voice_persona?: string | null
          youtube_access_token?: string | null
          youtube_channel_id?: string | null
          youtube_channel_name?: string | null
          youtube_connected?: boolean
          youtube_refresh_token?: string | null
          youtube_token_expires_at?: string | null
        }
        Relationships: []
      }
      script_templates: {
        Row: {
          created_at: string
          description: string | null
          example: string | null
          hook_duration_seconds: number
          id: string
          max_words: number
          name: string
          structure: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          example?: string | null
          hook_duration_seconds?: number
          id?: string
          max_words?: number
          name: string
          structure: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          example?: string | null
          hook_duration_seconds?: number
          id?: string
          max_words?: number
          name?: string
          structure?: Json
        }
        Relationships: []
      }
      scripts: {
        Row: {
          content: string
          created_at: string
          hook_text: string | null
          id: string
          status: string
          template_id: string | null
          trend_id: string | null
          user_id: string
          word_count: number
        }
        Insert: {
          content: string
          created_at?: string
          hook_text?: string | null
          id?: string
          status?: string
          template_id?: string | null
          trend_id?: string | null
          user_id: string
          word_count: number
        }
        Update: {
          content?: string
          created_at?: string
          hook_text?: string | null
          id?: string
          status?: string
          template_id?: string | null
          trend_id?: string | null
          user_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "scripts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "script_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scripts_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trends"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          aspect_ratio: string | null
          created_at: string
          description: string | null
          duration_preference: string | null
          id: string
          language: string | null
          last_video_generated_at: string | null
          name: string
          next_video_at: string | null
          platforms: Json
          posting_frequency: string
          posting_time: string
          prompt_template: string | null
          series_id: string | null
          status: Database["public"]["Enums"]["series_status"]
          topic: string
          updated_at: string
          user_id: string
          videos_created: number
          visual_style: string
          voice_persona: string
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string
          description?: string | null
          duration_preference?: string | null
          id?: string
          language?: string | null
          last_video_generated_at?: string | null
          name: string
          next_video_at?: string | null
          platforms?: Json
          posting_frequency?: string
          posting_time?: string
          prompt_template?: string | null
          series_id?: string | null
          status?: Database["public"]["Enums"]["series_status"]
          topic: string
          updated_at?: string
          user_id: string
          videos_created?: number
          visual_style?: string
          voice_persona?: string
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string
          description?: string | null
          duration_preference?: string | null
          id?: string
          language?: string | null
          last_video_generated_at?: string | null
          name?: string
          next_video_at?: string | null
          platforms?: Json
          posting_frequency?: string
          posting_time?: string
          prompt_template?: string | null
          series_id?: string | null
          status?: Database["public"]["Enums"]["series_status"]
          topic?: string
          updated_at?: string
          user_id?: string
          videos_created?: number
          visual_style?: string
          voice_persona?: string
        }
        Relationships: []
      }
      trends: {
        Row: {
          ai_suitability_score: number
          category: string | null
          created_at: string
          description: string | null
          detected_at: string
          engagement_ratio: number | null
          expires_at: string | null
          format_pattern: string | null
          id: string
          is_hot: boolean
          name: string
          shelf_life: string | null
          status: Database["public"]["Enums"]["trend_status"]
          velocity_score: number
        }
        Insert: {
          ai_suitability_score?: number
          category?: string | null
          created_at?: string
          description?: string | null
          detected_at?: string
          engagement_ratio?: number | null
          expires_at?: string | null
          format_pattern?: string | null
          id?: string
          is_hot?: boolean
          name: string
          shelf_life?: string | null
          status?: Database["public"]["Enums"]["trend_status"]
          velocity_score?: number
        }
        Update: {
          ai_suitability_score?: number
          category?: string | null
          created_at?: string
          description?: string | null
          detected_at?: string
          engagement_ratio?: number | null
          expires_at?: string | null
          format_pattern?: string | null
          id?: string
          is_hot?: boolean
          name?: string
          shelf_life?: string | null
          status?: Database["public"]["Enums"]["trend_status"]
          velocity_score?: number
        }
        Relationships: []
      }
      upload_queue: {
        Row: {
          actual_post_time: string | null
          attempts: number
          created_at: string
          error_log: Json | null
          id: string
          last_attempt_at: string | null
          randomization_offset_minutes: number
          scheduled_time: string
          status: string
          user_id: string
          video_id: string
        }
        Insert: {
          actual_post_time?: string | null
          attempts?: number
          created_at?: string
          error_log?: Json | null
          id?: string
          last_attempt_at?: string | null
          randomization_offset_minutes?: number
          scheduled_time: string
          status?: string
          user_id: string
          video_id: string
        }
        Update: {
          actual_post_time?: string | null
          attempts?: number
          created_at?: string
          error_log?: Json | null
          id?: string
          last_attempt_at?: string | null
          randomization_offset_minutes?: number
          scheduled_time?: string
          status?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_queue_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          id: string
          published_at: string | null
          retry_count: number
          scheduled_at: string | null
          script_id: string | null
          series_id: string | null
          status: Database["public"]["Enums"]["video_status"]
          thumbnail_url: string | null
          title: string
          trend_id: string | null
          updated_at: string
          user_id: string
          video_url: string | null
          visual_style: string
          youtube_video_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          published_at?: string | null
          retry_count?: number
          scheduled_at?: string | null
          script_id?: string | null
          series_id?: string | null
          status?: Database["public"]["Enums"]["video_status"]
          thumbnail_url?: string | null
          title: string
          trend_id?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
          visual_style?: string
          youtube_video_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          published_at?: string | null
          retry_count?: number
          scheduled_at?: string | null
          script_id?: string | null
          series_id?: string | null
          status?: Database["public"]["Enums"]["video_status"]
          thumbnail_url?: string | null
          title?: string
          trend_id?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
          visual_style?: string
          youtube_video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trends"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_daily_limit: {
        Args: { tier: Database["public"]["Enums"]["subscription_tier"] }
        Returns: number
      }
    }
    Enums: {
      series_status: "active" | "paused" | "completed"
      subscription_tier: "starter" | "pro" | "agency"
      trend_status: "active" | "declining" | "expired"
      video_status:
        | "queued"
        | "generating"
        | "processing"
        | "ready"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      series_status: ["active", "paused", "completed"],
      subscription_tier: ["starter", "pro", "agency"],
      trend_status: ["active", "declining", "expired"],
      video_status: [
        "queued",
        "generating",
        "processing",
        "ready",
        "scheduled",
        "publishing",
        "published",
        "failed",
      ],
    },
  },
} as const
