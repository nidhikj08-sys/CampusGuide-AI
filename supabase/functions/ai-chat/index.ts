// CampusGuide AI Assistant — Supabase Edge Function
//
// Proxies chat requests to the OpenAI API. The OpenAI key lives in a
// Supabase secret (never in the browser), and every request is tied to
// the logged-in user via their JWT.
//
// Deploy:   supabase functions deploy ai-chat
// Secrets:  supabase secrets set OPENAI_API_KEY=sk-...
// Optional: supabase secrets set OPENAI_MODEL=gpt-4o-mini

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the CampusGuide AI assistant for a college campus.
Help students, faculty and staff with:
- Campus navigation and finding classrooms, labs and offices
- Understanding timetables, periods and class schedules
- General campus questions (buildings, floors, facilities)

Be concise, friendly and accurate. If a question needs specific live data
(a particular room, period or faculty) that you do not have, say so plainly
and point the user to the Timetable or Find Classroom features instead of
guessing. Never invent room numbers, times or faculty names.`;

function jsonResponse(body: unknown, status: number, headers: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // CORS preflight from the browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  const authHeader = req.headers.get("Authorization") ?? "";

  // Acts as the caller for auth + RLS-protected reads (their own profile).
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  // Full-access client for writing the conversation server-side.
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: authData, error: authError } =
    await supabase.auth.getUser();
  if (authError || !authData.user) {
    return jsonResponse({ error: "Unauthorized" }, 401, corsHeaders);
  }
  const user = authData.user;

  let body: { content?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return jsonResponse({ error: "Message content is required" }, 400, corsHeaders);
  }
  if (content.length > 4000) {
    return jsonResponse({ error: "Message is too long" }, 400, corsHeaders);
  }

  // The caller's own class context, so answers can be relevant to their
  // year / branch / section / semester. Read through RLS as the user.
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, year, branch, section, semester, department")
    .eq("id", user.id)
    .maybeSingle();

  const contextParts: string[] = [];
  if (profile) {
    if (profile.role) contextParts.push(`role: ${profile.role}`);
    if (profile.year) contextParts.push(`year: ${profile.year}`);
    if (profile.branch) contextParts.push(`branch: ${profile.branch}`);
    if (profile.section) contextParts.push(`section: ${profile.section}`);
    if (profile.semester) contextParts.push(`semester: ${profile.semester}`);
  }
  const context = contextParts.length
    ? `\n\nThe user's profile — ${contextParts.join(", ")}.`
    : "";

  // Recent conversation history (server-side, scoped to this user).
  const { data: history } = await supabaseAdmin
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(20);

  const messages = [
    { role: "system", content: SYSTEM_PROMPT + context },
    ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content },
  ];

  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    console.error("OPENAI_API_KEY is not set on the Edge Function.");
    return jsonResponse(
      { error: "The AI assistant is not configured on the server yet." },
      503,
      corsHeaders,
    );
  }

  const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      messages,
      max_tokens: 600,
      temperature: 0.4,
    }),
  });

  if (!aiRes.ok) {
    const detail = await aiRes.text();
    console.error("OpenAI error", aiRes.status, detail);
    return jsonResponse(
      { error: "The AI service returned an error. Please try again." },
      502,
      corsHeaders,
    );
  }

  const aiData = await aiRes.json();
  const reply =
    typeof aiData?.choices?.[0]?.message?.content === "string"
      ? aiData.choices[0].message.content.trim()
      : "Sorry, I could not get a response right now.";

  // Persist the exchange. Done server-side so the assistant message is
  // attributed correctly and cannot be forged by a client.
  await supabaseAdmin.from("chat_messages").insert([
    { user_id: user.id, role: "user", content },
    { user_id: user.id, role: "assistant", content: reply },
  ]);

  return jsonResponse({ reply }, 200, corsHeaders);
});