"use client";

import { useState, useEffect, useTransition } from "react";
import { motion } from "framer-motion";
import { Settings, Edit3, Code2, Target, MapPin, Zap, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { syncProfileToPinecone } from "@/app/actions/match";
import { createClient } from "@/lib/supabase/client";

export default function Profile() {
  const [isPending, startTransition] = useTransition();
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfileData(data);
      }
      setIsLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const handleBroadcastIntent = () => {
    if (!profileData) return;
    
    startTransition(async () => {
      try {
        const result = await syncProfileToPinecone({
          userId: profileData.id,
          name: profileData.name,
          role: profileData.role,
          company: profileData.company,
          building: profileData.building,
          lookingFor: profileData.looking_for,
          skills: profileData.skills || [],
        });
        
        if (result.success) {
          setSyncStatus("success");
          setTimeout(() => setSyncStatus("idle"), 3000);
        } else {
          setSyncStatus("error");
          alert(`Pinecone AI Error: ${result.error}`); 
          setTimeout(() => setSyncStatus("idle"), 3000);
        }
      } catch (error: any) {
        setSyncStatus("error");
        alert(`System Crash: ${error.message}`);
        setTimeout(() => setSyncStatus("idle"), 3000);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent-indigo" />
      </div>
    );
  }

  if (!profileData) return null;

  return (
    <main className="flex flex-col min-h-screen px-6 pt-12 pb-32 overflow-y-auto bg-background">
      
      {/* HEADER WITH UNMISSABLE EDIT BUTTON */}
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Profile</h1>
        
        <div className="flex items-center gap-3">
          <Link 
            href="/profile/edit" 
            className="px-4 py-2 rounded-xl bg-accent-indigo text-white text-sm font-semibold shadow-glow-indigo hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Edit Profile
          </Link>
          
          <button className="w-10 h-10 rounded-xl bg-surface border border-white/5 flex items-center justify-center text-foreground hover:bg-surface-raised transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* USER IDENTITY SECTION */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 mb-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-indigo/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-surface-raised to-surface border border-white/10 shadow-cinematic flex items-center justify-center overflow-hidden">
              {profileData.avatar_url ? (
                <img src={profileData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : "U"}
                </span>
              )}
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold text-foreground mb-1">{profileData.name}</h2>
          <p className="text-sm font-medium text-accent-indigo mb-3">
            {profileData.role} <span className="text-muted">@ {profileData.company}</span>
          </p>
          
          <div className="flex items-center gap-1.5 text-xs text-muted bg-surface/50 px-3 py-1.5 rounded-full border border-white/5">
            <MapPin className="w-3.5 h-3.5" /> Bangalore, India
          </div>
        </div>
      </motion.section>

      {/* INTENT SECTION */}
      <motion.section className="space-y-4 mb-8">
        <div className="glass-panel p-5">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4" /> Currently Building
          </h3>
          <p className="text-sm text-foreground leading-relaxed">{profileData.building}</p>
        </div>

        <div className="glass-panel p-5 border-accent-indigo/20">
          <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" /> Looking For
          </h3>
          <p className="text-sm text-foreground leading-relaxed">{profileData.looking_for}</p>
        </div>
      </motion.section>

      {/* SKILLS SECTION */}
      <motion.section className="mb-8">
        <h3 className="text-sm font-semibold text-foreground mb-4">Core Arsenal</h3>
        <div className="flex flex-wrap gap-2">
          {profileData.skills?.map((skill: string) => (
            <span key={skill} className="px-3 py-1.5 rounded-lg bg-surface border border-white/5 text-xs font-medium text-gray-300 cursor-default">
              {skill}
            </span>
          ))}
        </div>
      </motion.section>

      {/* SYNC TO ENGINE BUTTON */}
      <motion.section>
        <button 
          onClick={handleBroadcastIntent}
          disabled={isPending || syncStatus === "success"}
          className={`w-full p-4 rounded-2xl border flex items-center justify-center gap-3 font-semibold text-sm transition-all shadow-cinematic ${
            syncStatus === "success" 
              ? "bg-green-500/10 border-green-500/30 text-green-400" 
              : "bg-surface hover:bg-surface-raised border-white/10 text-white"
          }`}
        >
          {isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin text-accent-indigo" /> Syncing to Engine...</>
          ) : syncStatus === "success" ? (
            <><CheckCircle2 className="w-5 h-5" /> Broadcasted Successfully</>
          ) : (
            <><Zap className="w-5 h-5 text-accent-indigo" /> Broadcast Intent to Network</>
          )}
        </button>
      </motion.section>
    </main>
  );
}