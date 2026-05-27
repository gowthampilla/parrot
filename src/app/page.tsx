"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RootEntry() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      // getUser() is much stricter than getSession()
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && !error) {
        // Confirmed live user -> Home
        router.push("/home");
      } else {
        // No user or expired token -> Login
        router.push("/login");
      }
    }
    
    checkAuth();
  }, [router, supabase]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-accent-indigo" />
    </main>
  );
}