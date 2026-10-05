import { supabase } from "../supabase";

const HISTORY_LIMIT = 100;

/**
 * Loads the signed-in user's conversation, oldest first.
 * RLS guarantees a user only ever sees their own rows.
 */
export async function getChatHistory() {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .order("created_at", { ascending: true })
    .limit(HISTORY_LIMIT);

  if (error) throw error;
  return data || [];
}

/**
 * Sends one message to the ai-chat Edge Function and returns
 * the assistant's reply. The function owns the OpenAI key and
 * persists the exchange server-side.
 */
export async function sendChatMessage(content) {
  const { data, error } = await supabase.functions.invoke("ai-chat", {
    body: { content },
  });

  if (error) {
    // Edge Function error responses carry the server's JSON body
    // in `context`; fall back to the raw message.
    const detail =
      error?.context?.error ?? error?.context ?? error?.message;
    throw new Error(
      typeof detail === "string" && detail
        ? detail
        : "Could not reach the assistant.",
    );
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

/** Deletes the caller's own conversation. */
export async function clearChatHistory() {
  const { error } = await supabase.from("chat_messages").delete();
  if (error) throw error;
  return true;
}