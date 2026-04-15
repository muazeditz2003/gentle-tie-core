import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { isValidMainCategory, isValidSubcategoryForMain } from "@/data/serviceCategories";

const toNumberOrNull = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureUserRecords = async (nextUser: User | null) => {
    if (!nextUser) return;

    const md = nextUser.user_metadata || {};
    const fullName = String(md.full_name || "").trim();
    const phone = String(md.phone || "").trim();
    const role = md.role === "worker" ? "worker" : "customer";
    const bloodGroup = String(md.blood_group || "").trim() || null;
    const isBloodDonor = String(md.is_blood_donor || "false") === "true";
    const rawMainCategory = String(md.main_category || "").trim();
    const rawSubCategory = String(md.sub_category || "").trim();

    const mainCategory = isValidMainCategory(rawMainCategory) ? rawMainCategory : null;
    const subCategory =
      mainCategory && isValidSubcategoryForMain(mainCategory, rawSubCategory)
        ? rawSubCategory
        : null;

    await supabase.from("profiles").upsert(
      {
        user_id: nextUser.id,
        full_name: fullName || nextUser.email?.split("@")[0] || "NearKonnect User",
        phone: phone || null,
        blood_group: bloodGroup,
        is_blood_donor: isBloodDonor,
      },
      { onConflict: "user_id" }
    );

    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", nextUser.id)
      .eq("role", role)
      .maybeSingle();

    if (!existingRole) {
      await supabase.from("user_roles").insert({ user_id: nextUser.id, role });
    }

    if (role === "worker") {
      await supabase.from("workers").upsert(
        {
          user_id: nextUser.id,
          profession: subCategory || "General Service",
          main_category: mainCategory,
          sub_category: subCategory,
          experience: Math.max(0, parseInt(String(md.experience || "0"), 10) || 0),
          available: true,
          latitude: toNumberOrNull(md.latitude),
          longitude: toNumberOrNull(md.longitude),
          service_areas: [],
          city: null,
        },
        { onConflict: "user_id" }
      );
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          void ensureUserRecords(session.user);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void ensureUserRecords(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
