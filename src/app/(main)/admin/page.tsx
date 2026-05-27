"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PlusCircle, Calendar, MapPin, AlignLeft, ShieldAlert, Loader2, CheckCircle2, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createEvent } from "@/app/actions/admin";

export default function AdminDashboard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  // --- FORM STATE ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  
  // --- IMAGE STATE (BASE64) ---
  const [imageBase64, setImageBase64] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  // --- SECURITY AUTH CHECK ---
  useEffect(() => {
    async function verifyAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (profile?.is_admin) {
        setIsAdmin(true);
      }
      setCheckingAuth(false);
    }
    verifyAdmin();
  }, [supabase, router]);

  // --- IMAGE CONVERSION HANDLER ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Enforce a 2MB limit so the database doesn't get overwhelmed
      if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 2MB.");
        return;
      }

      // 2. Convert to Base64 Text
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String); // Show the preview instantly
        setImageBase64(base64String);  // Save the raw string for the database
      };
      reader.readAsDataURL(file);
    }
  };

  // --- SUBMIT COMPONENT ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !location || !startTime) {
      alert("Please fill out all required fields!");
      return;
    }

    startTransition(async () => {
      setStatus("idle");
      
      // Build a clean payload. Notice we just pass the Base64 string directly!
      const eventPayload = {
        title: String(title).trim(),
        description: String(description).trim(),
        location: String(location).trim(),
        start_time: String(startTime),
        image_url: imageBase64, // Directly saves the image text
      };

      const result = await createEvent(eventPayload);

      if (result.success) {
        setStatus("success");
        // Clear Form fields
        setTitle("");
        setDescription("");
        setLocation("");
        setStartTime("");
        setImageBase64("");
        setImagePreview(null);
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        alert(`Error: ${result.error}`);
      }
    });
  };

  // --- LOADING / ERROR STATES ---
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent-indigo" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-400 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Restricted</h1>
        <p className="text-sm text-muted max-w-sm leading-relaxed">
          Your profile account does not possess explicit Admin tokens required to manipulate network mixers.
        </p>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <main className="flex flex-col min-h-screen px-6 pt-12 pb-32 overflow-y-auto bg-background selection:bg-accent-indigo/30">
      
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-accent-indigo/20 text-accent-indigo border border-accent-indigo/30 uppercase tracking-widest">
            Control Panel
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Create New Mixer</h1>
        <p className="text-sm text-muted mt-1">Deploy high-signal tech gatherings directly to the global network feed.</p>
      </header>

      <motion.form 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-5 max-w-xl"
      >
        {/* INPUT: IMAGE UPLOAD */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <ImagePlus className="w-3.5 h-3.5 text-accent-indigo" /> Cover Image (Optional)
          </label>
          <div className="relative w-full h-40 rounded-xl bg-surface border-2 border-dashed border-white/10 hover:border-accent-indigo/50 transition-colors flex flex-col items-center justify-center overflow-hidden group cursor-pointer">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
              <div className="flex flex-col items-center text-muted">
                <ImagePlus className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Click to upload cover image (Max 2MB)</span>
              </div>
            )}
          </div>
        </div>

        {/* INPUT: TITLE */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <PlusCircle className="w-3.5 h-3.5 text-accent-indigo" /> Event Title
          </label>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., GenAI Builders Mixer"
            className="w-full h-12 px-4 rounded-xl bg-surface border border-white/5 text-white text-sm focus:border-accent-indigo/50 focus:outline-none transition-colors shadow-inner"
          />
        </div>

        {/* INPUT: LOCATION */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent-indigo" /> Location Venue
          </label>
          <input 
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., HSR Layout, Bangalore"
            className="w-full h-12 px-4 rounded-xl bg-surface border border-white/5 text-white text-sm focus:border-accent-indigo/50 focus:outline-none transition-colors"
          />
        </div>

        {/* INPUT: START TIME */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-accent-indigo" /> Date & Time
          </label>
          <input 
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-surface border border-white/5 text-white text-sm focus:border-accent-indigo/50 focus:outline-none transition-colors color-scheme-dark"
          />
        </div>

        {/* INPUT: DESCRIPTION */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <AlignLeft className="w-3.5 h-3.5 text-accent-indigo" /> Description & Intent
          </label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Outline who should attend, core topics, and networking scopes..."
            rows={5}
            className="w-full p-4 rounded-xl bg-surface border border-white/5 text-white text-sm focus:border-accent-indigo/50 focus:outline-none transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isPending || status === "success"}
            className={`w-full h-12 rounded-xl font-semibold text-sm shadow-cinematic flex items-center justify-center gap-2 transition-all ${
              status === "success"
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-white text-black hover:bg-gray-200 active:scale-[0.99]"
            }`}
          >
            {isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Pushing to DB...</>
            ) : status === "success" ? (
              <><CheckCircle2 className="w-5 h-5" /> Mixer Live on Feed!</>
            ) : (
              "Deploy Event"
            )}
          </button>
        </div>
      </motion.form>
    </main>
  );
}