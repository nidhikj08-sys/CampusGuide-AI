// Where each role lands after login
export const ROLE_HOME = {
  student: "/student",
  faculty: "/faculty",
  admin: "/admin",
};

export const roleHome = (role) => ROLE_HOME[role] || "/login";

// Turn Supabase errors into friendly messages
export function friendlyError(error) {
  const code = error?.code || "";
  const text = (error?.message || "").toLowerCase();

  if (code === "invalid_credentials" || text.includes("invalid login credentials"))
    return "Incorrect email or password.";
  if (code === "email_not_confirmed" || text.includes("email not confirmed"))
    return "Please confirm your email first (check your inbox), then log in.";
  if (code === "user_already_exists" || text.includes("already registered"))
    return "This email is already registered. Try logging in.";
  if (code === "weak_password" || text.includes("at least 6"))
    return "Password must be at least 6 characters.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || error?.status === 429)
    return "Too many attempts. Please wait a minute and try again.";
  if (text.includes("failed to fetch") || text.includes("network"))
    return "Network error. Check your internet connection.";
  if (text.includes("invalid email") || code === "email_address_invalid")
    return "Please enter a valid email address.";
  return error?.message || "Something went wrong. Please try again.";
}
