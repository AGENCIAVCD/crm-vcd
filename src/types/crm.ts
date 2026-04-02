import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];
export type UserProfileRow = Database["public"]["Tables"]["users"]["Row"];
export type PipelineRow = Database["public"]["Tables"]["pipelines"]["Row"];
export type StageRow = Database["public"]["Tables"]["stages"]["Row"];
export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export interface BoardColumn extends StageRow {
  leads: LeadRow[];
}

export type MessageWithLead = MessageRow;

export interface AppUserProfile extends UserProfileRow {
  email?: string | null;
}

export interface AuthContextValue {
  user: User | null;
  profile: AppUserProfile | null;
  tenantId: string | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}
