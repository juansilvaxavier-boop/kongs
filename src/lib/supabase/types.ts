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
      bolao_predictions: {
        Row: {
          championship_id: string
          created_at: string
          game_id: string
          id: string
          predicted_score_a: number
          predicted_score_b: number
          updated_at: string
          user_id: string
        }
        Insert: {
          championship_id: string
          created_at?: string
          game_id: string
          id?: string
          predicted_score_a: number
          predicted_score_b: number
          updated_at?: string
          user_id: string
        }
        Update: {
          championship_id?: string
          created_at?: string
          game_id?: string
          id?: string
          predicted_score_a?: number
          predicted_score_b?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bolao_predictions_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bolao_predictions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
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
      championship_sumula_tokens: {
        Row: {
          championship_id: string
          token: string
        }
        Insert: {
          championship_id: string
          token?: string
        }
        Update: {
          championship_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "championship_sumula_tokens_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: true
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
          rules_text: string | null
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
          rules_text?: string | null
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
          rules_text?: string | null
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
          venue_id: string | null
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
          venue_id?: string | null
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
          venue_id?: string | null
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
            foreignKeyName: "games_mvp_player_id_fkey"
            columns: ["mvp_player_id"]
            isOneToOne: false
            referencedRelation: "players"
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
          {
            foreignKeyName: "games_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      game_captain_signatures: {
        Row: {
          captain_name: string
          championship_id: string
          game_id: string
          id: string
          signature_data_url: string
          signed_at: string
          team_id: string
        }
        Insert: {
          captain_name: string
          championship_id: string
          game_id: string
          id?: string
          signature_data_url: string
          signed_at?: string
          team_id: string
        }
        Update: {
          captain_name?: string
          championship_id?: string
          game_id?: string
          id?: string
          signature_data_url?: string
          signed_at?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_captain_signatures_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_captain_signatures_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_captain_signatures_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_lineups: {
        Row: {
          championship_id: string
          created_at: string
          game_id: string
          id: string
          player_id: string
        }
        Insert: {
          championship_id: string
          created_at?: string
          game_id: string
          id?: string
          player_id: string
        }
        Update: {
          championship_id?: string
          created_at?: string
          game_id?: string
          id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_lineups_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_lineups_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_lineups_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
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
          birth_date: string | null
          championship_id: string
          created_at: string
          document_number: string | null
          document_type: string | null
          id: string
          name: string
          number: number | null
          photo_url: string | null
          position: string | null
          team_id: string | null
        }
        Insert: {
          birth_date?: string | null
          championship_id: string
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          id?: string
          name: string
          number?: number | null
          photo_url?: string | null
          position?: string | null
          team_id?: string | null
        }
        Update: {
          birth_date?: string | null
          championship_id?: string
          created_at?: string
          document_number?: string | null
          document_type?: string | null
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
      team_roster_tokens: {
        Row: {
          championship_id: string
          created_at: string
          submitted_at: string | null
          team_id: string
          token: string
        }
        Insert: {
          championship_id: string
          created_at?: string
          submitted_at?: string | null
          team_id: string
          token?: string
        }
        Update: {
          championship_id?: string
          created_at?: string
          submitted_at?: string | null
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_roster_tokens_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_roster_tokens_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
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
      venues: {
        Row: {
          address: string | null
          championship_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          championship_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          championship_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_championship_id_fkey"
            columns: ["championship_id"]
            isOneToOne: false
            referencedRelation: "championships"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invite: { Args: { p_invite_id: string }; Returns: undefined }
      admin_process_game_ovr: { Args: { p_game_id: string }; Returns: undefined }
      base_attributes_for_position: {
        Args: { p_position: string }
        Returns: {
          defesa: number
          drible: number
          finalizacao: number
          fisico: number
          ovr: number
          passe: number
          ritmo: number
        }[]
      }
      get_or_create_championship_sumula_token: {
        Args: { p_championship_id: string }
        Returns: string
      }
      get_or_create_team_roster_token: {
        Args: { p_team_id: string }
        Returns: string
      }
      is_admin: { Args: never; Returns: boolean }
      is_championship_admin: {
        Args: { p_championship_id: string }
        Returns: boolean
      }
      regenerate_championship_sumula_token: {
        Args: { p_championship_id: string }
        Returns: string
      }
      regenerate_team_roster_token: {
        Args: { p_team_id: string }
        Returns: string
      }
      roster_add_player: {
        Args: {
          p_birth_date: string
          p_document_number: string
          p_document_type: string
          p_name: string
          p_number: number
          p_position: string
          p_token: string
        }
        Returns: string
      }
      roster_can_upload_player_photo: {
        Args: { p_player_id: string; p_token: string }
        Returns: boolean
      }
      roster_delete_player: {
        Args: { p_player_id: string; p_token: string }
        Returns: undefined
      }
      roster_get_team: {
        Args: { p_token: string }
        Returns: {
          championship_name: string
          coach_id: string
          coach_name: string
          crest_url: string
          player_count: number
          submitted_at: string
          team_id: string
          team_name: string
        }[]
      }
      roster_list_players: {
        Args: { p_token: string }
        Returns: {
          birth_date: string
          document_number: string
          document_type: string
          id: string
          name: string
          number: number
          photo_url: string
          position: string
        }[]
      }
      roster_set_coach: {
        Args: { p_coach_name: string; p_token: string }
        Returns: undefined
      }
      roster_set_player_photo: {
        Args: { p_photo_url: string; p_player_id: string; p_token: string }
        Returns: undefined
      }
      roster_submit: { Args: { p_token: string }; Returns: undefined }
      roster_update_player: {
        Args: {
          p_birth_date: string
          p_document_number: string
          p_document_type: string
          p_name: string
          p_number: number
          p_player_id: string
          p_position: string
          p_token: string
        }
        Returns: undefined
      }
      roster_validate_player: {
        Args: {
          p_birth_date: string
          p_document_number: string
          p_document_type: string
          p_name: string
          p_position: string
        }
        Returns: {
          v_document_number: string
          v_document_type: string
        }[]
      }
      round2: { Args: { x: number }; Returns: number }
      sumula_add_card: {
        Args: {
          p_card_type: string
          p_game_id: string
          p_minute: number
          p_player_id: string
          p_token: string
        }
        Returns: undefined
      }
      sumula_add_goal: {
        Args: {
          p_game_id: string
          p_minute: number
          p_player_id: string
          p_token: string
        }
        Returns: undefined
      }
      sumula_delete_card: {
        Args: { p_card_id: string; p_token: string }
        Returns: undefined
      }
      sumula_delete_goal: {
        Args: { p_goal_id: string; p_token: string }
        Returns: undefined
      }
      sumula_get_championship: {
        Args: { p_token: string }
        Returns: {
          championship_id: string
          championship_name: string
        }[]
      }
      sumula_get_game: {
        Args: { p_game_id: string; p_token: string }
        Returns: {
          championship_id: string
          game_id: string
          played: boolean
          round: string
          score_a: number
          score_b: number
          team_a_id: string
          team_a_name: string
          team_b_id: string
          team_b_name: string
        }[]
      }
      sumula_list_games: {
        Args: { p_token: string }
        Returns: {
          date: string
          game_id: string
          played: boolean
          round: string
          score_a: number
          score_b: number
          team_a_name: string
          team_b_name: string
        }[]
      }
      sumula_set_played: {
        Args: { p_game_id: string; p_played: boolean; p_token: string }
        Returns: undefined
      }
      sumula_sign_captain: {
        Args: {
          p_captain_name: string
          p_game_id: string
          p_signature_data_url: string
          p_team_id: string
          p_token: string
        }
        Returns: undefined
      }
      sumula_toggle_lineup: {
        Args: {
          p_confirmed: boolean
          p_game_id: string
          p_player_id: string
          p_token: string
        }
        Returns: undefined
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
