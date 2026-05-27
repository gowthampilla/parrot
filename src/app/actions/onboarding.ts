"use server";

import { createClient } from "@/lib/supabase/server";
import { syncProfileToPinecone } from "./match";

interface OnboardingData {
  role: string;
  company: string;
  building: string;
  lookingFor: string;
  skills: string[];
}

export async function completeOnboarding(data: OnboardingData) {
  try {
    const supabase = await createClient();
    
    // 1. Get the currently authenticated Google user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Not authenticated" };
    }

    // Google stores the user's name in the metadata
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "Ambitious Builder";

    // 2. Save the relational data to Supabase
    const { error: dbError } = await supabase.from("users").upsert({
      id: user.id,
      name: fullName,
      role: data.role,
      company: data.company || "Stealth",
      building: data.building,
      looking_for: data.lookingFor,
      skills: data.skills,
    });

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return { success: false, error: "Failed to save profile to database." };
    }

    // 3. Generate the vector embedding and push to Pinecone
    await syncProfileToPinecone({
      userId: user.id,
      name: fullName,
      role: data.role,
      company: data.company,
      building: data.building,
      lookingFor: data.lookingFor,
      skills: data.skills,
    });

    return { success: true };
  } catch (error) {
    console.error("Onboarding failed:", error);
    return { success: false, error: "System failure during onboarding." };
  }
}