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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ad_placement_settings: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          frequency_max: number
          frequency_min: number
          id: string
          placement_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          frequency_max?: number
          frequency_min?: number
          id?: string
          placement_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          frequency_max?: number
          frequency_min?: number
          id?: string
          placement_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      featured_services: {
        Row: {
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          owner_user_id: string | null
          priority: number
          rotation_seed: number
          service_id: string
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          owner_user_id?: string | null
          priority?: number
          rotation_seed?: number
          service_id: string
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          owner_user_id?: string | null
          priority?: number
          rotation_seed?: number
          service_id?: string
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_key: string | null
          created_at: string
          delivered_at: string | null
          id: string
          message_text: string
          receiver_id: string
          seen_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"]
          updated_at: string
        }
        Insert: {
          conversation_key?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          message_text: string
          receiver_id: string
          seen_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string
        }
        Update: {
          conversation_key?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          message_text?: string
          receiver_id?: string
          seen_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["message_status"]
          updated_at?: string
        }
        Relationships: []
      }
      native_ads: {
        Row: {
          ad_type: string
          created_at: string
          created_by: string | null
          cta_label: string
          cta_url: string
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          placement: string
          priority: number
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ad_type?: string
          created_at?: string
          created_by?: string | null
          cta_label?: string
          cta_url: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          placement?: string
          priority?: number
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ad_type?: string
          created_at?: string
          created_by?: string | null
          cta_label?: string
          cta_url?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          placement?: string
          priority?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blood_group: string | null
          city: string | null
          created_at: string
          donor_status: string
          full_name: string
          id: string
          is_blood_donor: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          blood_group?: string | null
          city?: string | null
          created_at?: string
          donor_status?: string
          full_name?: string
          id?: string
          is_blood_donor?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          blood_group?: string | null
          city?: string | null
          created_at?: string
          donor_status?: string
          full_name?: string
          id?: string
          is_blood_donor?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_analytics_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: string
          metadata: Json
          owner_user_id: string | null
          service_id: string
          source: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          metadata?: Json
          owner_user_id?: string | null
          service_id: string
          source?: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          metadata?: Json
          owner_user_id?: string | null
          service_id?: string
          source?: string
        }
        Relationships: []
      }
      service_boosts: {
        Row: {
          boost_type: Database["public"]["Enums"]["boost_type"]
          created_at: string
          ends_at: string | null
          id: string
          metadata: Json
          owner_user_id: string
          price_cents: number | null
          service_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["boost_status"]
          updated_at: string
          visibility_multiplier: number
        }
        Insert: {
          boost_type: Database["public"]["Enums"]["boost_type"]
          created_at?: string
          ends_at?: string | null
          id?: string
          metadata?: Json
          owner_user_id: string
          price_cents?: number | null
          service_id: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["boost_status"]
          updated_at?: string
          visibility_multiplier?: number
        }
        Update: {
          boost_type?: Database["public"]["Enums"]["boost_type"]
          created_at?: string
          ends_at?: string | null
          id?: string
          metadata?: Json
          owner_user_id?: string
          price_cents?: number | null
          service_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["boost_status"]
          updated_at?: string
          visibility_multiplier?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          available: boolean
          city: string | null
          cnic: string | null
          created_at: string
          description: string | null
          experience: number
          id: string
          latitude: number | null
          longitude: number | null
          main_category: string | null
          profession: string
          service_areas: string[]
          sub_category: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          available?: boolean
          city?: string | null
          cnic?: string | null
          created_at?: string
          description?: string | null
          experience?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          main_category?: string | null
          profession: string
          service_areas?: string[]
          sub_category?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          available?: boolean
          city?: string | null
          cnic?: string | null
          created_at?: string
          description?: string | null
          experience?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          main_category?: string | null
          profession?: string
          service_areas?: string[]
          sub_category?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "workers_user_id_fkey_profiles"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_service_analytics_summary: {
        Args: { _days?: number; _owner_user_id: string; _service_id: string }
        Returns: {
          contact_clicks: number
          conversion_rate: number
          conversions: number
          messages_received: number
          profile_views: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      analytics_event_type:
        | "profile_view"
        | "contact_click"
        | "message_received"
        | "conversion"
      app_role: "customer" | "worker" | "admin"
      boost_status: "pending" | "active" | "expired" | "rejected"
      boost_type: "featured_listing" | "priority_ranking" | "urgent_boost"
      message_status: "sent" | "delivered" | "seen" | "failed"
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
      analytics_event_type: [
        "profile_view",
        "contact_click",
        "message_received",
        "conversion",
      ],
      app_role: ["customer", "worker", "admin"],
      boost_status: ["pending", "active", "expired", "rejected"],
      boost_type: ["featured_listing", "priority_ranking", "urgent_boost"],
      message_status: ["sent", "delivered", "seen", "failed"],
    },
  },
} as const
