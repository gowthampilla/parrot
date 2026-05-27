"use server";

import { createClient } from "@/lib/supabase/server";
import { findIntentMatches } from "./match";

// 1. ONLY loads the basic event data (Runs instantly when page opens)
export async function getEventWithSmartRoster(eventId: string) {
    const supabase = await createClient();
  
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
  
    // Fetch Event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();
  
    if (eventError || !event) return { success: false, error: "Event not found" };
  
    // Fetch Guest List
    const { data: attendees } = await supabase
      .from("event_attendees")
      .select("user_id, users(id, name, role, company, avatar_url)")
      .eq("event_id", eventId);
  
    const attendeeIds = attendees?.map(a => a.user_id) || [];
    const isRegistered = attendeeIds.includes(user.id);
  
    let generalAttendees = attendees?.map((a: any) => ({
      id: a.user_id,
      name: a.users?.name,
      role: a.users?.role,
      company: a.users?.company,
      avatar_url: a.users?.avatar_url
    })) || [];
  
    // Remove the current user from the general guest list view
    generalAttendees = generalAttendees.filter(a => a.id !== user.id);
  
    // Notice: We NO LONGER run the AI match here!
    return { success: true, event, generalAttendees, isRegistered };
  }
  
  
  // 2. NEW: ONLY runs the AI search when the user explicitly clicks the Quad button
  export async function runQuadMatchmaker(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };
  
    const { data: attendees } = await supabase
      .from("event_attendees")
      .select("user_id")
      .eq("event_id", eventId);
  
    const attendeeIds = attendees?.map(a => a.user_id) || [];
    let recommendedAttendees: any[] = [];
  
    const { data: currentUserProfile } = await supabase
      .from("users")
      .select("building, looking_for")
      .eq("id", user.id)
      .single();
  
    if (currentUserProfile && attendeeIds.length > 0) {
      const intentText = `Building: ${currentUserProfile.building}. Looking for: ${currentUserProfile.looking_for}.`;
      
      // THIS is where the heavy AI math happens now!
      const matchResult = await findIntentMatches(user.id, intentText, 20);
      
      if (matchResult.success && matchResult.matches) {
        recommendedAttendees = matchResult.matches.filter(match => 
          attendeeIds.includes(match.id) && match.id !== user.id
        );
      }
    }
  
    return { success: true, recommendedAttendees };
  }
export async function rsvpForEvent(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Not authenticated" };
  
    const { error } = await supabase
      .from("event_attendees")
      .insert({ event_id: eventId, user_id: user.id });
  
    if (error) {
      // If they are already registered, Postgres throws a unique constraint error, which is fine.
      if (error.code === '23505') return { success: true }; 
      console.error("RSVP Error:", error);
      return { success: false, error: "Failed to RSVP" };
    }
  
    return { success: true };
  }


  // --- FETCH USER'S REGISTERED EVENTS ---
export async function getMyEvents() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Not authenticated" };
  
    // This does a relational join: "Get all my attendances, and pull the full Event row for each"
    const { data, error } = await supabase
      .from("event_attendees")
      .select(`
        event_id,
        events (*)
      `)
      .eq("user_id", user.id);
  
    if (error) return { success: false, error: error.message };
  
    // Map the nested Supabase join into a flat array of just the Event objects
    const myEvents = data
      .map((registration: any) => registration.events)
      .filter(Boolean); // Filters out any nulls just in case an event was deleted
  
    // Sort them so the soonest events show up first
    myEvents.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  
    return { success: true, events: myEvents };
  }