import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// Reads the logged-in user's row from the "profiles" table (has the role)
async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("Could not load profile:", error);
    return null;
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Supabase Auth user
  const [profile, setProfile] = useState(null); // row from profiles table
  const [loading, setLoading] = useState(true);
  const currentUserId = useRef(null);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ?? null;

      if (!authUser) {
        currentUserId.current = null;
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Same user (e.g. token refresh): nothing to reload
      if (currentUserId.current === authUser.id) return;
      currentUserId.current = authUser.id;

      setUser(authUser);
      setLoading(true);
      // setTimeout avoids calling Supabase inside its own auth callback
      setTimeout(async () => {
        setProfile(await fetchProfile(authUser.id));
        setLoading(false);
      }, 0);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  // role: "student" | "faculty"; extra: role specific fields
  // The database trigger creates the profile row automatically.
  async function signup({ name, email, password, role, extra }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, ...extra } },
    });
    if (error) throw error;

    // Supabase returns an empty identities list when the email already exists
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw { code: "user_already_exists" };
    }
    // No session means email confirmation is turned on in Supabase
    return { needsConfirmation: !data.session };
  }

  async function login(email, password) {
    // Quick local demo credential check for offline or demo testing
    if (email === "admin@campusguide.com" && password === "admin123") {
      const demoAdmin = { id: "demo-admin-id", email: "admin@campusguide.com" };
      setUser(demoAdmin);
      setProfile({ id: "demo-admin-id", name: "Admin", email: "admin@campusguide.com", role: "admin" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  function loginAsDemo(role = "admin") {
    const demoProfiles = {
      student: { id: "demo-student-id", name: "Manya M", email: "manya@kvgce.edu", role: "student", usn: "4KV24CS083", year: "3rd Year", section: "B" },
      faculty: { id: "demo-faculty-id", name: "Dr. Sneha", email: "sneha@kvgce.edu", role: "faculty", employee_id: "FAC-104", department: "Computer Science" },
      admin: { id: "demo-admin-id", name: "Campus Admin", email: "admin@campusguide.com", role: "admin" },
    };

    const selected = demoProfiles[role] || demoProfiles.admin;
    const demoUser = { id: selected.id, email: selected.email };
    setUser(demoUser);
    setProfile(selected);
    setLoading(false);
  }

  const logout = () => {
    setUser(null);
    setProfile(null);
    supabase.auth.signOut().catch(() => {});
  };

  async function updateProfile(updates) {
    if (user?.id?.startsWith("demo-")) {
      setProfile((prev) => ({ ...prev, ...updates }));
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    if (error) throw error;
    setProfile((prev) => ({ ...prev, ...updates }));
  }

  const value = { user, profile, loading, signup, login, loginAsDemo, logout, updateProfile };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
