export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_rooms: {
        Row: {
          created_at: string | null
          id: string
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          compatibility_description: string | null
          created_at: string | null
          id: string
          match_score: number | null
          status: Database["public"]["Enums"]["match_status"] | null
          target_user_id: string | null
          user_id: string | null
        }
        Insert: {
          compatibility_description?: string | null
          created_at?: string | null
          id?: string
          match_score?: number | null
          status?: Database["public"]["Enums"]["match_status"] | null
          target_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          compatibility_description?: string | null
          created_at?: string | null
          id?: string
          match_score?: number | null
          status?: Database["public"]["Enums"]["match_status"] | null
          target_user_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_room_id: string | null
          content: string
          created_at: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          chat_room_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          chat_room_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          target_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_interactions_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          current_city: string | null
          current_location_lat: number | null
          current_location_lng: number | null
          date_of_birth: string
          dating_preference: Database["public"]["Enums"]["dating_preference"]
          email: string | null
          id: string
          is_onboarding_complete: boolean | null
          last_shown_at: string | null
          latitude: number | null
          longitude: number | null
          name: string
          place_of_birth: string
          profile_images: string[] | null
          sexual_orientation: Database["public"]["Enums"]["sexual_orientation"]
          time_of_birth: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          current_city?: string | null
          current_location_lat?: number | null
          current_location_lng?: number | null
          date_of_birth: string
          dating_preference: Database["public"]["Enums"]["dating_preference"]
          email?: string | null
          id: string
          is_onboarding_complete?: boolean | null
          last_shown_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          place_of_birth: string
          profile_images?: string[] | null
          sexual_orientation: Database["public"]["Enums"]["sexual_orientation"]
          time_of_birth: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          current_city?: string | null
          current_location_lat?: number | null
          current_location_lng?: number | null
          date_of_birth?: string
          dating_preference?: Database["public"]["Enums"]["dating_preference"]
          email?: string | null
          id?: string
          is_onboarding_complete?: boolean | null
          last_shown_at?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          place_of_birth?: string
          profile_images?: string[] | null
          sexual_orientation?: Database["public"]["Enums"]["sexual_orientation"]
          time_of_birth?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_unseen_profiles: {
        Args: {
          requesting_user_id: string
          city_filter?: string
          limit_count?: number
        }
        Returns: {
          id: string
          name: string
          age: number
          bio: string
          current_city: string
          sexual_orientation: string
          dating_preference: string
          profile_images: string[]
        }[]
      }
    }
    Enums: {
      dating_preference: "men" | "women" | "everyone"
      match_status: "pending" | "matched" | "rejected"
      sexual_orientation:
        | "straight"
        | "lesbian"
        | "gay"
        | "bisexual"
        | "pansexual"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dating_preference: ["men", "women", "everyone"],
      match_status: ["pending", "matched", "rejected"],
      sexual_orientation: [
        "straight",
        "lesbian",
        "gay",
        "bisexual",
        "pansexual",
        "other",
      ],
    },
  },
} as const
