import { supabase } from "../supabase";

const EVENT_TYPE_META = {
  college_fest: { label: "College Fest", icon: "🎉", color: "#7c3aed" },
  hackathon:   { label: "Hackathon",   icon: "💻", color: "#2563eb" },
  workshop:    { label: "Workshop",    icon: "🛠️", color: "#059669" },
  seminar:     { label: "Seminar",     icon: "🎤", color: "#d97706" },
  sports:      { label: "Sports",      icon: "⚽", color: "#dc2626" },
  cultural:    { label: "Cultural",    icon: "🎭", color: "#db2777" },
  exam:        { label: "Exam",        icon: "📝", color: "#475569" },
  other:       { label: "Other",       icon: "📌", color: "#64748b" },
};

export function getEventMeta(type) {
  return EVENT_TYPE_META[type] || EVENT_TYPE_META.other;
}

export async function getEvents({ status, upcoming = true, today = false, past = false } = {}) {
  let query = supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  } else if (upcoming && !today && !past) {
    query = query.in("status", ["upcoming", "today"]);
  } else if (past) {
    query = query.eq("status", "past");
  }

  const { data, error } = await query;
  if (error) {
    console.warn("Events fetch error:", error.message);
    return [];
  }
  return data ?? [];
}

export async function getEventById(id) {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.warn("Event fetch error:", error.message);
    return null;
  }
  return data;
}

export async function createEvent(event) {
  const { data, error } = await supabase
    .from("events")
    .insert(event)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export function formatEventTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatEventDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
