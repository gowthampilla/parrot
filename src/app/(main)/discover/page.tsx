"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Bookmark, Code2, Target, Zap, Loader2 } from "lucide-react";
import { findIntentMatches } from "@/app/actions/match";
import { createClient } from "@/lib/supabase/client";

export default function Discover() {
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadMatches() {
      try {
        // 1. Get the securely logged-in user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 2. Fetch their actual profile data from our database
        const { data: profile } = await supabase
          .from("users")
          .select("building, looking_for")
          .eq("id", user.id)
          .single();

        if (!profile) return;

        // 3. Build their specific intent string
        const userIntentText = `Building: ${profile.building}. Looking for: ${profile.looking_for}.`;

        // 4. Query Pinecone using their REAL ID and REAL Intent
        const result = await findIntentMatches(user.id, userIntentText, 5);
        
        if (result.success && result.matches) {
          setCards(result.matches.reverse());
        }
      } catch (error) {
        console.error("Failed to load matches", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadMatches();
  }, [supabase]);

  const handleSwipe = (id: string) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  };

  return (
    <main className="flex flex-col min-h-screen px-6 pt-12 pb-32 overflow-hidden">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Discover</h1>
        <p className="text-sm text-muted mt-2">Curated builders around you.</p>
      </header>

      <div className="relative flex-1 flex items-center justify-center w-full max-w-sm mx-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-muted animate-pulse">
            <Loader2 className="w-8 h-8 animate-spin text-accent-indigo mb-4" />
            <p className="text-sm font-medium">Computing intent vectors...</p>
            <p className="text-xs mt-1">Scanning local network</p>
          </div>
        ) : (
          <AnimatePresence>
            {cards.map((profile, index) => {
              const isTop = index === cards.length - 1;
              return (
                <motion.div
                  key={profile.id}
                  className="absolute w-full"
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ 
                    scale: isTop ? 1 : 0.95, 
                    opacity: 1, 
                    y: isTop ? 0 : 20,
                    zIndex: isTop ? 10 : 0
                  }}
                  exit={{ x: -300, opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  drag={isTop ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(e, { offset, velocity }) => {
                    if (Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500) {
                      handleSwipe(profile.id);
                    }
                  }}
                >
                  <div className="glass-panel p-6 flex flex-col h-[500px]">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-surface-raised to-surface border border-white/10 shadow-cinematic flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {profile.name ? profile.name.substring(0, 2).toUpperCase() : "??"}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{profile.name}</h2>
                        <p className="text-sm text-accent-indigo font-medium">
                          {profile.role} <span className="text-muted">@ {profile.company}</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-accent-indigo/10 border border-accent-indigo/20 rounded-xl p-3 mb-6 flex items-start gap-3">
                      <Zap className="w-5 h-5 text-accent-indigo shrink-0 mt-0.5" />
                      <p className="text-xs text-indigo-100/80 leading-relaxed">
                        {profile.mutual}
                      </p>
                    </div>

                    <div className="space-y-5 flex-1 overflow-y-auto no-scrollbar">
                      <div>
                        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Code2 className="w-4 h-4" /> Building
                        </h3>
                        <p className="text-sm text-foreground leading-relaxed">{profile.building}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" /> Looking For
                        </h3>
                        <p className="text-sm text-foreground leading-relaxed">{profile.lookingFor}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                      <button onClick={() => handleSwipe(profile.id)} className="w-12 h-12 rounded-full bg-surface border border-white/5 flex items-center justify-center text-muted hover:text-white hover:bg-surface-raised transition-all">
                        <X className="w-5 h-5" />
                      </button>
                      <button className="w-12 h-12 rounded-full bg-surface border border-white/5 flex items-center justify-center text-muted hover:text-white hover:bg-surface-raised transition-all">
                        <Bookmark className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleSwipe(profile.id)} className="w-12 h-12 rounded-full bg-accent-indigo text-white flex items-center justify-center shadow-glow-indigo hover:scale-105 transition-all">
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        
        {!isLoading && cards.length === 0 && (
          <div className="text-center text-muted">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface border border-white/5 flex items-center justify-center">
              <Zap className="w-6 h-6 text-muted" />
            </div>
            <p className="text-sm font-medium text-foreground">Network Exhausted</p>
            <p className="text-xs mt-1 max-w-[200px] mx-auto">You've seen all compatible builders in the area. Check back later.</p>
          </div>
        )}
      </div>
    </main>
  );
}