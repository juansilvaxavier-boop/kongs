export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      card_events: {
        Row: {
          card_type: string
          championship_id: string
          created_at: string
          game_id: string
          id: string
          minute: number | null
          player_id: string
        }
        Insert: {
          card_type: string
          championship_id: string
          created_at?: string
          game_id: string
          id?: string
          minute?: number | null
          player_id: string
        }
        Update: {
          card_type?: string
          championship_id?: string
          created_at?: string
          game_id?: string
          id?: string
          minute?: number | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_events_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_admins: {
        Row: {
          championship_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          championship_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          championship_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "championship_admins_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
        ]
      }
      championship_comments: {
        Row: {
          body: string
          championship_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          championship_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          championship_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "championship_comments_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
        ]
      }
      championships: {
        Row: {
          created_at: string
          format: string
          group_count: number | null
          has_knockout_stage: boolean
          id: string
          name: string
          owner_id: string
          team_count: number | null
          yellow_cards_for_suspension: number
        }
        Insert: {
          created_at?: string
          format?: string
          group_count?: number | null
          has_knockout_stage?: boolean
          id?: string
          name: string
          owner_id: string
          team_count?: number | null
          yellow_cards_for_suspension?: number
        }
        Update: {
          created_at?: string
          format?: string
          group_count?: number | null
          has_knockout_stage?: boolean
          id?: string
          name?: string
          owner_id?: string
          team_count?: number | null
          yellow_cards_for_suspension?: number
        }
        Relationships: []
      }
      coaches: {
        Row: {
          championship_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          championship_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          championship_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaches_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          championship_id: string
          created_at: string
          date: string | null
          id: string
          mvp_player_id: string | null
          ovr_processed_at: string | null
          played: boolean
          round: string
          score_a: number | null
          score_b: number | null
          team_a_id: string
          team_b_id: string
        }
        Insert: {
          championship_id: string
          created_at?: string
          date?: string | null
          id?: string
          mvp_player_id?: string | null
          ovr_processed_at?: string | null
          played?: boolean
          round: string
          score_a?: number | null
          score_b?: number | null
          team_a_id: string
          team_b_id: string
        }
        Update: {
          championship_id?: string
          created_at?: string
          date?: string | null
          id?: string
          mvp_player_id?: string | null
          ovr_processed_at?: string | null
          played?: boolean
          round?: string
          score_a?: number | null
          score_b?: number | null
          team_a_id?: string
          team_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "games_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_events: {
        Row: {
          championship_id: string
          created_at: string
          game_id: string
          id: string
          minute: number | null
          player_id: string
        }
        Insert: {
          championship_id: string
          created_at?: string
          game_id: string
          id?: string
          minute?: number | null
          player_id: string
        }
        Update: {
          championship_id?: string
          created_at?: string
          game_id?: string
          id?: string
          minute?: number | null
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_events_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_events_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      ovr_history: {
        Row: {
          championship_id: string
          created_at: string
          delta: number
          game_id: string | null
          id: string
          player_id: string
          reason: string
          round: string | null
        }
        Insert: {
          championship_id: string
          created_at?: string
          delta: number
          game_id?: string | null
          id?: string
          player_id: string
          reason: string
          round?: string | null
        }
        Update: {
          championship_id?: string
          created_at?: string
          delta?: number
          game_id?: string | null
          id?: string
          player_id?: string
          reason?: string
          round?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ovr_history_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ovr_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ovr_history_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_attributes: {
        Row: {
          defesa: number
          drible: number
          finalizacao: number
          fisico: number
          ovr: number
          passe: number
          player_id: string
          ritmo: number
          updated_at: string
        }
        Insert: {
          defesa?: number
          drible?: number
          finalizacao?: number
          fisico?: number
          ovr?: number
          passe?: number
          player_id: string
          ritmo?: number
          updated_at?: string
        }
        Update: {
          defesa?: number
          drible?: number
          finalizacao?: number
          fisico?: number
          ovr?: number
          passe?: number
          player_id?: string
          ritmo?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_attributes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          championship_id: string
          created_at: string
          id: string
          name: string
          number: number | null
          photo_url: string | null
          position: string | null
          team_id: string | null
        }
        Insert: {
          championship_id: string
          created_at?: string
          id?: string
          name: string
          number?: number | null
          photo_url?: string | null
          position?: string | null
          team_id?: string | null
        }
        Update: {
          championship_id?: string
          created_at?: string
          id?: string
          name?: string
          number?: number | null
          photo_url?: string | null
          position?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          last_name: string | null
          persona: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          persona?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          persona?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          championship_id: string
          created_at: string
          email: string
          id: string
          team_id: string
        }
        Insert: {
          accepted_at?: string | null
          championship_id: string
          created_at?: string
          email: string
          id?: string
          team_id: string
        }
        Update: {
          accepted_at?: string | null
          championship_id?: string
          created_at?: string
          email?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          championship_id: string
          coach_id: string | null
          created_at: string
          crest_url: string | null
          group_name: string | null
          id: string
          name: string
          owner_user_id: string | null
        }
        Insert: {
          championship_id: string
          coach_id?: string | null
          created_at?: string
          crest_url?: string | null
          group_name?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
        }
        Update: {
          championship_id?: string
          coach_id?: string | null
          created_at?: string
          crest_url?: string | null
          group_name?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invite: { Args: { p_invite_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_championship_admin: {
        Args: { p_championship_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
