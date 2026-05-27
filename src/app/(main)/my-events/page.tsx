"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, MapPin, Loader2, ArrowRight, Ticket, CheckCircle2 } from "lucide-react";
import { getMyEvents } from "@/app/actions/events";

export default function MyEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTickets() {
      setIsLoading(true);
      const result = await getMyEvents();
      if (result.success && result.events) {
        setEvents(result.events);
      }
      setIsLoading(false);
    }
    loadTickets();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent-indigo" />
      </div>
    );
  }

  return (
    <main className="flex flex-col min-h-screen px-6 pt-12 pb-32 overflow-y-auto bg-background selection:bg-accent-indigo/30">
      
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          My RSVPs <Ticket className="w-6 h-6 text-accent-indigo" />
        </h1>
        <p className="text-sm text-muted mt-2">Your confirmed network mixers and events.</p>
      </header>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-3xl border border-white/5 text-center shadow-cinematic">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <Ticket className="w-8 h-8 text-muted opacity-50 transform -rotate-45" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Your itinerary is empty</h3>
          <p className="text-sm text-muted mb-6">You haven't RSVP'd to any upcoming mixers yet.</p>
          <Link href="/home" className="h-10 px-6 rounded-xl bg-accent-indigo text-white text-sm font-semibold flex items-center justify-center hover:bg-indigo-500 transition-colors">
            Discover Events
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {events.map((event, index) => (
            <Link href={`/events/${event.id}`} key={event.id}>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group glass-panel rounded-3xl border border-white/10 hover:border-accent-indigo/50 transition-all cursor-pointer relative overflow-hidden flex flex-col sm:flex-row h-auto sm:h-48"
              >
                
                {/* Visual "Ticket" Stub Area (Left side) */}
                <div className="w-full sm:w-48 h-48 shrink-0 relative border-b sm:border-b-0 sm:border-r border-white/10 bg-surface flex flex-col items-center justify-center">
                  {event.image_url ? (
                    <>
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-surface to-accent-indigo/10" />
                  )}
                  
                  {/* Floating Date Badge */}
                  <div className="absolute z-10 flex flex-col items-center p-3 rounded-2xl bg-background/80 backdrop-blur-md border border-white/10 shadow-xl">
                    <span className="text-xs font-bold text-accent-indigo uppercase tracking-widest">
                      {new Date(event.start_time).toLocaleDateString("en-US", { month: 'short' })}
                    </span>
                    <span className="text-2xl font-black text-white leading-none mt-1">
                      {new Date(event.start_time).toLocaleDateString("en-US", { day: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Event Details Area (Right side) */}
                <div className="p-5 sm:p-6 flex flex-col flex-grow relative">
                  <div className="absolute top-6 right-6">
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 pr-24 group-hover:text-accent-indigo transition-colors">{event.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4 max-w-lg">{event.description}</p>
                  
                  <div className="mt-auto flex items-center gap-4 text-xs font-medium text-muted">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-accent-indigo" />
                      {new Date(event.start_time).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-accent-indigo" />
                      {event.location}
                    </div>
                  </div>
                </div>

              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}