"use server";

import { createClient } from "@/lib/supabase/server";
import { syncProfileToPinecone } from "./match";

export async function updateProfile(formData: {
  name: string;
  role: string;
  company: string;
  building: string;
  looking_for: string;
  skills: string[];
  avatar_url?: string;
}) {
  try {
    console.log("1. Starting Profile Update...");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Not authenticated" };

    const updateData = {
      name: formData.name,
      role: formData.role,
      company: formData.company,
      building: formData.building,
      looking_for: formData.looking_for,
      skills: formData.skills,
      ...(formData.avatar_url && { avatar_url: formData.avatar_url })
    };

    console.log("2. Saving to Supabase Database...");
    const { error: dbError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id);

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return { success: false, error: `Database Error: ${dbError.message}` };
    }

    console.log("3. Syncing to Pinecone AI...");
    try {
      await syncProfileToPinecone({
        userId: user.id,
        name: formData.name,
        role: formData.role,
        company: formData.company,
        building: formData.building,
        lookingFor: formData.looking_for,
        skills: formData.skills,
      });
      console.log("4. Pinecone Sync Complete!");
    } catch (pineconeError: any) {
      console.error("Pinecone Error:", pineconeError);
      return { success: false, error: `Database saved, but AI sync failed: ${pineconeError.message}` };
    }

    return { success: true };
  } catch (e: any) {
    console.error("FATAL ERROR:", e);
    return { success: false, error: `Fatal Error: ${e.message}` };
  }
}