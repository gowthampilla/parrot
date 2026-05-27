"use server";

import { createClient } from "@/lib/supabase/server";

// --- CREATE EVENT ACTION ---
export async function createEvent(formData: {
  title: string;
  description: string;
  location: string;
  start_time: string;
  image_url: string; // <--- 1. Tell the backend to expect the Base64 image string
}) {
  const supabase = await createClient();

  // 1. Verify Authentication & Admin Status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { success: false, error: "Access Restricted" };

  try {
    // 2. Clean the inputs
    const cleanTitle = String(formData.title || "").trim();
    const cleanDescription = String(formData.description || "").trim();
    const cleanLocation = String(formData.location || "").trim();
    const cleanImageUrl = String(formData.image_url || "").trim(); // <--- 2. Clean the image string
    const ISOFormattedDate = new Date(formData.start_time).toISOString();

    // 3. Save to Database
    const { error } = await supabase
      .from("events")
      .insert({
        title: cleanTitle,
        description: cleanDescription,
        location: cleanLocation,
        start_time: ISOFormattedDate, 
        date: ISOFormattedDate,
        image_url: cleanImageUrl, // <--- 3. INSERT IT INTO SUPABASE!
      });

    if (error) {
      console.error("Database Insert Error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Server Action Error:", err.message);
    return { success: false, error: err.message };
  }
}