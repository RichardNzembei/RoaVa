export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      availability_slots: {
        Row: {
          booked_count: number
          capacity: number
          created_at: string
          experience_id: string
          id: string
          price_override: number | null
          start_at: string
          status: Database["public"]["Enums"]["slot_status"]
          updated_at: string
        }
        Insert: {
          booked_count?: number
          capacity: number
          created_at?: string
          experience_id: string
          id?: string
          price_override?: number | null
          start_at: string
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string
        }
        Update: {
          booked_count?: number
          capacity?: number
          created_at?: string
          experience_id?: string
          id?: string
          price_override?: number | null
          start_at?: string
          status?: Database["public"]["Enums"]["slot_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          amount_kes: number
          commission_kes: number
          consumer_profile_id: string
          created_at: string
          experience_id: string
          id: string
          party_size: number
          payout_status: Database["public"]["Enums"]["payout_status"]
          slot_id: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          amount_kes: number
          commission_kes?: number
          consumer_profile_id: string
          created_at?: string
          experience_id: string
          id?: string
          party_size: number
          payout_status?: Database["public"]["Enums"]["payout_status"]
          slot_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          amount_kes?: number
          commission_kes?: number
          consumer_profile_id?: string
          created_at?: string
          experience_id?: string
          id?: string
          party_size?: number
          payout_status?: Database["public"]["Enums"]["payout_status"]
          slot_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_consumer_profile_id_fkey"
            columns: ["consumer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "availability_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          area: string | null
          base_price_kes: number
          cancellation_policy: string | null
          category: string | null
          county: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          images: string[]
          lat: number | null
          lng: number | null
          max_party_size: number
          meeting_point: string | null
          operator_id: string
          status: Database["public"]["Enums"]["experience_status"]
          title: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          base_price_kes: number
          cancellation_policy?: string | null
          category?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[]
          lat?: number | null
          lng?: number | null
          max_party_size?: number
          meeting_point?: string | null
          operator_id: string
          status?: Database["public"]["Enums"]["experience_status"]
          title: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          base_price_kes?: number
          cancellation_policy?: string | null
          category?: string | null
          county?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[]
          lat?: number | null
          lng?: number | null
          max_party_size?: number
          meeting_point?: string | null
          operator_id?: string
          status?: Database["public"]["Enums"]["experience_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_payouts: {
        Row: {
          operator_id: string
          payout_msisdn: string | null
          updated_at: string
        }
        Insert: {
          operator_id: string
          payout_msisdn?: string | null
          updated_at?: string
        }
        Update: {
          operator_id?: string
          payout_msisdn?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_payouts_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: true
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          bio: string | null
          business_name: string
          created_at: string
          id: string
          owner_profile_id: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          bio?: string | null
          business_name: string
          created_at?: string
          id?: string
          owner_profile_id: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          bio?: string | null
          business_name?: string
          created_at?: string
          id?: string
          owner_profile_id?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "operators_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_kes: number
          booking_id: string
          created_at: string
          failure_reason: string | null
          id: string
          provider: string
          provider_ref: string | null
          raw_callback: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_kes: number
          booking_id: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          provider?: string
          provider_ref?: string | null
          raw_callback?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_kes?: number
          booking_id?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          provider?: string
          provider_ref?: string | null
          raw_callback?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          phone: string | null
          preferred_language: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          phone?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          phone?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          booking_id: string
          consumer_profile_id: string
          created_at: string
          experience_id: string
          id: string
          photos: string[]
          rating: number
          updated_at: string
        }
        Insert: {
          body?: string | null
          booking_id: string
          consumer_profile_id: string
          created_at?: string
          experience_id: string
          id?: string
          photos?: string[]
          rating: number
          updated_at?: string
        }
        Update: {
          body?: string | null
          booking_id?: string
          consumer_profile_id?: string
          created_at?: string
          experience_id?: string
          id?: string
          photos?: string[]
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_consumer_profile_id_fkey"
            columns: ["consumer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          booking_id: string
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          id: string
          nonce: string
          qr_payload: string
          status: Database["public"]["Enums"]["ticket_status"]
          updated_at: string
        }
        Insert: {
          booking_id: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          id?: string
          nonce: string
          qr_payload: string
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string
        }
        Update: {
          booking_id?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          id?: string
          nonce?: string
          qr_payload?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          created_at: string
          experience_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      experience_reviews: {
        Row: {
          body: string | null
          created_at: string | null
          experience_id: string | null
          id: string | null
          rating: number | null
          reviewer_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_review_booking: {
        Args: { p_booking_id: string; p_experience_id: string }
        Returns: boolean
      }
      can_view_booking: { Args: { p_booking_id: string }; Returns: boolean }
      check_in_ticket: {
        Args: {
          p_booking_id: string
          p_nonce: string
          p_operator_profile: string
        }
        Returns: string
      }
      check_rate_limit: {
        Args: { p_key: string; p_max: number; p_window_seconds: number }
        Returns: boolean
      }
      confirm_booking_payment: {
        Args: { p_provider_ref: string; p_raw?: Json }
        Returns: string
      }
      consumer_owns_booking: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
      experience_is_published: {
        Args: { p_experience_id: string }
        Returns: boolean
      }
      expire_pending_booking: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
      fail_booking_payment: {
        Args: { p_provider_ref: string; p_raw?: Json; p_reason: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      owns_experience: { Args: { p_experience_id: string }; Returns: boolean }
      owns_operator: { Args: { p_operator_id: string }; Returns: boolean }
      prune_rate_limits: { Args: never; Returns: undefined }
      release_slot: {
        Args: { p_qty: number; p_slot_id: string }
        Returns: undefined
      }
      reserve_slot: {
        Args: { p_qty: number; p_slot_id: string }
        Returns: boolean
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      experience_status: "draft" | "published" | "archived"
      payment_status: "pending" | "success" | "failed"
      payout_status: "not_applicable" | "pending" | "paid" | "failed"
      slot_status: "open" | "closed" | "cancelled"
      ticket_status: "valid" | "used" | "void"
      user_role: "consumer" | "operator" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      experience_status: ["draft", "published", "archived"],
      payment_status: ["pending", "success", "failed"],
      payout_status: ["not_applicable", "pending", "paid", "failed"],
      slot_status: ["open", "closed", "cancelled"],
      ticket_status: ["valid", "used", "void"],
      user_role: ["consumer", "operator", "admin"],
    },
  },
} as const

