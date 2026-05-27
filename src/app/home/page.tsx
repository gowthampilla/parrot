"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, MapPin, ChevronDown, Sparkles, ArrowRight, Calendar, Ticket, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]); 
  const supabase = createClient();

  useEffect(() => {
    async function fetchHomeData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("name")
          .eq("id", user.id)
          .single();
        if (userProfile) setProfile(userProfile);
      }

      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });
        
      if (eventData) setEvents(eventData);
    }
    fetchHomeData();
  }, [supabase]);

  // --- LOGOUT FUNCTION ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/"; // Forces a hard reload back to the root gate
  };

  const firstName = profile?.name ? profile.name.split(" ")[0] : "Builder";

  return (
    <main className="flex flex-col min-h-screen px-6 pt-12 pb-32 bg-background selection:bg-accent-indigo/30">
      
      {/* 1. Top Navigation */}
      <header className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-surface-raised to-surface flex items-center justify-center border border-white/5 shadow-cinematic shrink-0">
            <div className="w-3 h-3 rounded-full bg-accent-indigo shadow-glow-indigo" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-medium text-muted uppercase tracking-widest">Location</span>
            <button className="flex items-center gap-1 text-sm font-semibold text-foreground">
              <span className="truncate">Bangalore</span> <ChevronDown className="w-4 h-4 shrink-0 text-muted" />
            </button>
          </div>
        </div>

        {/* TICKET, NOTIFICATIONS, AND LOGOUT */}
        <div className="flex items-center gap-3 shrink-0">
          <Link 
            href="/my-events" 
            className="w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center text-foreground hover:bg-surface-raised hover:text-accent-indigo transition-all shadow-cinematic"
            title="My Tickets"
          >
            <Ticket className="w-5 h-5 transform -rotate-45" />
          </Link>

          <button className="relative w-10 h-10 rounded-full bg-surface border border-white/5 flex items-center justify-center text-foreground hover:bg-surface-raised transition-colors">
            <Bell className="w-5 h-5 shrink-0" />
            <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-accent-purple border-2 border-background" />
          </button>

          {/* THE NEW LOGOUT BUTTON */}
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors shadow-cinematic"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </header>

      {/* 2. Live Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-10"
      >
        <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-3">
          Good evening, {firstName} <span className="inline-block origin-bottom-right hover:animate-pulse">👋</span>
        </h1>
        <p className="text-lg text-muted max-w-xs leading-relaxed">
          Discover builders, opportunities, and startup events around you.
        </p>
      </motion.section>

      {/* 3. MULTIPLE EVENTS FEED */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 shrink-0 text-accent-indigo" /> Upcoming Mixers
          </h2>
        </div>

        {events.length > 0 ? (
          <div className="flex flex-col gap-5">
            {events.map((event) => (
              <Link href={`/events/${event.id}`} key={event.id} className="block">
                
                <div className="glass-panel rounded-3xl border border-white/10 hover:border-accent-indigo/50 transition-all cursor-pointer group relative overflow-hidden flex flex-col bg-surface shadow-cinematic">
                  
                  <div className="w-full h-48 bg-surface-raised relative overflow-hidden shrink-0 border-b border-white/5">
                    {event.image_url ? (
                      <img 
                        src={event.image_url} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-surface to-accent-indigo/20 flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-white/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent opacity-90" />
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-indigo transition-colors line-clamp-1">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-6">
                      {event.description}
                    </p>
                    
                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex flex-col gap-2.5 overflow-hidden pr-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted">
                          <Calendar className="w-4 h-4 shrink-0 text-accent-indigo" />
                          <span className="truncate">
                            {new Date(event.start_time).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-muted">
                          <MapPin className="w-4 h-4 shrink-0 text-accent-indigo" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                      
                      <div className="w-10 h-10 shrink-0 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-accent-indigo group-hover:text-white text-muted transition-colors border border-white/5">
                        <ArrowRight className="w-5 h-5 shrink-0" />
                      </div>
                    </div>

                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-panel h-48 flex flex-col items-center justify-center text-muted text-sm rounded-3xl border border-white/10 shadow-cinematic">
            <Calendar className="w-10 h-10 mb-3 opacity-50" />
            No upcoming events right now. Check back later!
          </div>
        )}
      </motion.section>
    </main>
  );
}