"use client";

import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import type { AuthContextValue, AppUserProfile } from "@/types/crm";
import { DEMO_TENANT_ID } from "@/lib/demo-data";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase-client";

const DEMO_PROFILE: AppUserProfile = {
  id: "60000000-0000-4000-8000-000000000001",
  tenant_id: DEMO_TENANT_ID,
  full_name: "Bruno Ravaglia",
  role: "admin",
  email: "bruno@vcdigital.com.br",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [profile, setProfile] = useState<AuthContextValue["profile"]>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshProfile() {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setProfile(DEMO_PROFILE);
      setTenantId(DEMO_PROFILE.tenant_id);
      setIsDemo(true);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();

      if (!sessionUser) {
        setUser(null);
        setProfile(null);
        setTenantId(null);
        setIsDemo(false);
        setIsLoading(false);
        return;
      }

      const { data: userProfile, error } = await supabase
        .from("users")
        .select("id, tenant_id, full_name, role")
        .eq("id", sessionUser.id)
        .single();

      if (error) {
        throw error;
      }

      setUser(sessionUser);
      setProfile({
        ...userProfile,
        email: sessionUser.email,
      });
      setTenantId(userProfile.tenant_id);
      setIsDemo(false);
    } catch (error) {
      console.error("Falha ao carregar perfil do CRM:", error);
      setUser(null);
      setProfile(null);
      setTenantId(null);
      setIsDemo(false);
    } finally {
      setIsLoading(false);
    }
  }

  const refreshProfileEvent = useEffectEvent(async () => {
    await refreshProfile();
  });

  useEffect(() => {
    void refreshProfileEvent();

    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refreshProfileEvent();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        tenantId,
        isDemo,
        isLoading,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  }

  return context;
}
