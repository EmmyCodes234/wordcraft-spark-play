import { supabase } from "./supabaseClient";

export async function getCardbox() {
  const { data, error } = await supabase
    .from("cardbox")
    .select("id, user_id, words"); // ✅ Removed "status"

  if (error) {
    console.error("Error fetching cardbox:", error);
    throw error;
  }
  return data;
}

export async function saveCardbox(userId: string, words: string[]) {
  const { data, error } = await supabase
    .from("cardbox")
    .insert([{ user_id: userId, words }])
    .select();

  if (error) {
    console.error("Error saving cardbox:", error);
    throw error;
  }
  return data;
}
