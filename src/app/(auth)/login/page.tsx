"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginScreen() {
  const [isPending, setIsPending] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Added to prevent UI flashing
  const router = useRouter(); // Added router for the redirect
  const supabase = createClient();

  // --- NEW: AUTH CHECK LOGIC ---
  useEffect(() => {
    async function checkExistingSession() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is already logged in, instantly send them to home!
        router.push("/home");
      } else {
        // User is NOT logged in, stop checking and show the login button
        setIsCheckingAuth(false);
      }
    }
    
    checkExistingSession();
  }, [router, supabase]);

  const handleGoogleLogin = async () => {
    setIsPending(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This tells Google where to send the user after they click their account
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google Auth Error:", error.message);
      setIsPending(false);
    }
  };

  // --- NEW: LOADING SCREEN ---
  // Show a cinematic spinner while we check if they are already logged in
  if (isCheckingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent-indigo" />
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 relative overflow-hidden bg-background">
      {/* Cinematic Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-indigo/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-surface-raised to-surface border border-white/10 shadow-cinematic flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
             {/* Inner glow for the logo container */}
             <div className="absolute inset-0 bg-accent-indigo/20 blur-xl rounded-full" />
             <span className="text-2xl font-bold text-white relative z-10">Q</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Quad</h1>
          <p className="text-sm text-muted mt-2">The operating system for ambitious builders.</p>
        </div>

        <div className="glass-panel p-8 text-center rounded-3xl border border-white/10 shadow-2xl">
          <p className="text-sm text-foreground font-medium mb-6">Join the ecosystem.</p>

          <button 
            onClick={handleGoogleLogin}
            disabled={isPending}
            className="w-full h-12 rounded-xl bg-surface border border-white/10 text-foreground font-medium text-sm shadow-cinematic flex items-center justify-center gap-3 hover:bg-surface-raised hover:border-white/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin text-muted" /> : (
              <>
                {/* Googl SVG Icon */}
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
      </motion.div>
    </main>
  );
}