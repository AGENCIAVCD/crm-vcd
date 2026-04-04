export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          full_name: string;
          role: "admin" | "user";
        };
        Insert: {
          id: string;
          tenant_id: string;
          full_name: string;
          role?: "admin" | "user";
        };
        Update: {
          id?: string;
          tenant_id?: string;
          full_name?: string;
          role?: "admin" | "user";
        };
        Relationships: [];
      };
      pipelines: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
        };
        Relationships: [];
      };
      stages: {
        Row: {
          id: string;
          pipeline_id: string | null;
          tenant_id: string;
          name: string;
          position: number;
          description: string | null;
          integration_enabled: boolean;
          integration_label: string | null;
          integration_webhook_url: string | null;
        };
        Insert: {
          id?: string;
          pipeline_id?: string | null;
          tenant_id: string;
          name: string;
          position: number;
          description?: string | null;
          integration_enabled?: boolean;
          integration_label?: string | null;
          integration_webhook_url?: string | null;
        };
        Update: {
          id?: string;
          pipeline_id?: string | null;
          tenant_id?: string;
          name?: string;
          position?: number;
          description?: string | null;
          integration_enabled?: boolean;
          integration_label?: string | null;
          integration_webhook_url?: string | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          tenant_id: string;
          stage_id: string | null;
          name: string;
          phone: string | null;
          email: string | null;
          value: number | null;
          assigned_to: string | null;
          last_interaction_at: string | null;
          created_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          stage_id?: string | null;
          name: string;
          phone?: string | null;
          email?: string | null;
          value?: number | null;
          assigned_to?: string | null;
          last_interaction_at?: string | null;
          created_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          stage_id?: string | null;
          name?: string;
          phone?: string | null;
          email?: string | null;
          value?: number | null;
          assigned_to?: string | null;
          last_interaction_at?: string | null;
          created_at?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          tenant_id: string;
          lead_id: string | null;
          direction: "inbound" | "outbound" | null;
          content: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          lead_id?: string | null;
          direction?: "inbound" | "outbound" | null;
          content?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          lead_id?: string | null;
          direction?: "inbound" | "outbound" | null;
          content?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
