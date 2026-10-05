import { supabase } from "../supabase";

// ─── ICON / COLOR MAP ────────────────────────────────────────────────────────
export const NOTIF_ICON = {
  info:        "ℹ️",
  warning:     "⚠️",
  success:     "✅",
  error:       "🔴",
  room_change: "🏫",
};

// ─── FETCH ────────────────────────────────────────────────────────────────────

/**
 * Fetch notifications for the current user (personal + role-broadcasts).
 * Falls back to empty array if Supabase is unavailable (demo mode).
 */
export async function getNotifications(limit = 30) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("Notifications fetch error:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Count unread notifications for the current user.
 */
export async function getUnreadCount() {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) return 0;
  return count ?? 0;
}

// ─── MARK AS READ ─────────────────────────────────────────────────────────────

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) console.warn("markAsRead error:", error.message);
}

/**
 * Mark ALL notifications for the current user as read.
 */
export async function markAllAsRead() {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) console.warn("markAllAsRead error:", error.message);
}

// ─── ADMIN: POST NOTIFICATION ─────────────────────────────────────────────────

/**
 * Post a notification (admin only).
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {'info'|'warning'|'success'|'error'|'room_change'} [opts.type]
 * @param {'student'|'faculty'|'admin'|null} [opts.role] - null = all roles
 * @param {string|null} [opts.userId]  - null = broadcast to role
 */
export async function postNotification({ title, message, type = "info", role = null, userId = null }) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({ title, message, type, role, user_id: userId })
    .select();

  if (error) {
    const hint =
      error.message.includes("row-level security")
        ? "\n\nRLS blocked the insert — check: the admin user must have a row in public.profiles with role = 'admin' (my_role() must return 'admin')."
        : "";
    console.error("postNotification error:", error, hint);
    throw new Error(error.message + hint);
  }

  return data?.[0] ?? null;
}

// ─── RELATIVE TIME HELPER ─────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? "s" : ""} ago`;
}
