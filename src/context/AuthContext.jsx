import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

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
  if (!data) return null;
  try {
    const extra = JSON.parse(localStorage.getItem(`campusguide_extra_${userId}`) || "{}");
    return { ...extra, ...data };
  } catch (e) {
    return data;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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

      if (currentUserId.current === authUser.id) return;
      currentUserId.current = authUser.id;

      setUser(authUser);
      setLoading(true);
      setTimeout(async () => {
        setProfile(await fetchProfile(authUser.id));
        setLoading(false);
      }, 0);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function signup({ name, email, password, role, extra }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, ...extra } },
    });
    if (error) throw error;

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw { code: "user_already_exists" };
    }
    return { needsConfirmation: !data.session };
  }

  async function login(email, password, rememberMe = false) {
    if (email === "admin@campusguide.com" && password === "admin123") {
      const demoAdmin = { id: "demo-admin-id", email: "admin@campusguide.com" };
      setUser(demoAdmin);
      setProfile({ id: "demo-admin-id", name: "Campus Admin", email: "admin@campusguide.com", role: "admin", department: "Administration" });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: { persistSession: rememberMe }
    });
    if (error) throw error;
  }

  async function loginWithProvider(provider) {
    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl }
    });
    if (error) throw error;
  }

  function loginAsDemo(role = "student") {
    let savedExtra = {};
    const demoId = role === "faculty" ? "demo-faculty-id" : role === "admin" ? "demo-admin-id" : "demo-student-id";
    try {
      savedExtra = JSON.parse(localStorage.getItem(`campusguide_extra_${demoId}`) || "{}");
    } catch (e) {}

    const demoProfiles = {
      student: { 
        id: "demo-student-id", 
        name: "Manya M", 
        email: "manya@kvgce.edu", 
        role: "student", 
        usn: "4KV24CS083", 
        year: "3rd Year", 
        section: "B",
        department: "B.E. Computer Science & Engineering",
        classroom: "Room 204 - CS Block",
        classroom_id: "r_204",
        blood_group: "O+",
        emergency_contact: "+91 9876543210",
        semester: "5th",
        cgpa: "9.15",
        credits: "120/180",
        valid_thru: "July 2026",
        ...savedExtra
      },
      faculty: { 
        id: "demo-faculty-id", 
        name: "Dr. Sneha", 
        email: "sneha@kvgce.edu", 
        role: "faculty", 
        employee_id: "FAC-104", 
        department: "Computer Science & Engineering",
        designation: "Associate Professor",
        cabin: "Cabin F-12 (2nd Floor)",
        cabin_id: "r_204",
        office_hours: "Mon & Wed: 2:30 PM - 4:00 PM",
        intercom: "Ext: 402",
        blood_group: "B+",
        emergency_contact: "+91 9845012345",
        ...savedExtra
      },
      admin: { 
        id: "demo-admin-id", 
        name: "Campus Admin", 
        email: "admin@campusguide.com", 
        role: "admin",
        department: "Campus Administration & Infrastructure",
        ...savedExtra
      },
    };

    const selected = demoProfiles[role] || demoProfiles.admin;
    const demoUser = { id: selected.id, email: selected.email };
    setUser(demoUser);
    setProfile(selected);
    setLoading(false);
  }

  async function forgotPassword(email) {
    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    if (error) throw error;
  }

  async function resetPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  const logout = () => {
    setUser(null);
    setProfile(null);
    supabase.auth.signOut().catch(() => {});
  };

  async function updateProfile(updates) {
    if (user?.id) {
      try {
        const existing = JSON.parse(localStorage.getItem(`campusguide_extra_${user.id}`) || "{}");
        localStorage.setItem(`campusguide_extra_${user.id}`, JSON.stringify({ ...existing, ...updates }));
      } catch (e) {}
    }

    if (user?.id?.startsWith("demo-")) {
      setProfile((prev) => ({ ...prev, ...updates }));
      return;
    }

    const DB_COLUMNS = ["name", "usn", "year", "section", "employee_id", "department"];
    const dbUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (DB_COLUMNS.includes(key)) {
        dbUpdates[key] = updates[key];
      }
    });

    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase
        .from("profiles")
        .update(dbUpdates)
        .eq("id", user.id);
      if (error) throw error;
    }

    setProfile((prev) => ({ ...prev, ...updates }));
  }

  const value = { 
    user, 
    profile, 
    loading, 
    signup, 
    login, 
    loginWithProvider,
    loginAsDemo, 
    forgotPassword,
    resetPassword,
    logout, 
    updateProfile 
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}