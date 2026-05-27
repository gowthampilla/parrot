"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Users, Sparkles, Loader2, CheckCircle2, ChevronRight, CalendarPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getEventWithSmartRoster, runQuadMatchmaker } from "@/app/actions/events";
import { generateGoogleCalendarUrl, generateIcsBlobUrl } from "@/lib/utils/calendar";

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const supabase = createClient();

  // --- STATE ---
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Guest List Data (Removed recommendedAttendees state since it's fetched on-demand now)
  const [generalAttendees, setGeneralAttendees] = useState<any[]>([]);
  
  // Quad Agent UI State
  const [chatLog, setChatLog] = useState<{role: "user" | "agent", content: string | React.ReactNode}[]>([]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [showButtonText, setShowButtonText] = useState(true);
  
  // Dropdown UI State
  const [showCalDropdown, setShowCalDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- CLOSE DROPDOWN ON CLICK OUTSIDE ---
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCalDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 2.5-SECOND BUTTON ANIMATION TIMEOUT ---
  useEffect(() => {
    if (isRegistered && chatLog.length === 0) {
      const timer = setTimeout(() => {
        setShowButtonText(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isRegistered, chatLog.length]);

  // --- LOAD INITIAL DATA ---
  const loadEvent = async () => {
    setIsLoading(true);
    const result = await getEventWithSmartRoster(eventId);
    
    if (result.success) {
      setEvent(result.event);
      setIsRegistered(result.isRegistered || false);
      setGeneralAttendees(result.generalAttendees || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (eventId) loadEvent();
  }, [eventId]);

  // --- HANDLERS ---
  const handleRegister = async () => {
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Please log in first!");

      const { error } = await supabase.from("event_attendees").insert({ event_id: eventId, user_id: user.id });
      if (error && error.code !== '23505') return alert("Failed to RSVP: " + error.message);

      setIsRegistered(true);
      setShowButtonText(true);
      loadEvent(); 
    });
  };

  const downloadIcsFile = () => {
    if (!event) return;
    const calendarData = {
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: event.start_time || new Date().toISOString()
    };
    const url = generateIcsBlobUrl(calendarData);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${event.title.toLowerCase().replace(/\s+/g, "-")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAskQuad = async () => {
    if (!isRegistered) return alert("You must RSVP first!");

    // 1. Show the user their message instantly and start the loading spinner
    setChatLog([{ role: "user", content: "Whom should I meet at this event?" }]);
    setIsAgentThinking(true);

    // 2. ACTUALLY tell the backend to run the heavy AI search now!
    const result = await runQuadMatchmaker(eventId);
    
    // 3. Search is done, stop the spinner
    setIsAgentThinking(false);

    if (result.success && result.recommendedAttendees && result.recommendedAttendees.length > 0) {
      const matches = result.recommendedAttendees;

      // 4. Remove the recommended people from the "General Guest List" so they don't show up twice
      const matchIds = matches.map((m: any) => m.id);
      setGeneralAttendees(prev => prev.filter(a => !matchIds.includes(a.id)));

      // 5. Draw the premium match cards
      setChatLog(prev => [
        ...prev, 
        { role: "agent", content: "I've scanned the room against your intent vector. Here are your highest-priority matches." },
        { 
          role: "agent", 
          content: (
            <div className="flex flex-col gap-3 mt-2 w-full">
              {matches.map((match: any) => (
                <div key={match.id} className="p-4 rounded-2xl bg-gradient-to-br from-surface to-background border border-white/10 shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-indigo/10 blur-3xl rounded-full group-hover:bg-accent-indigo/20 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center text-white font-bold shrink-0 border border-white/5">
                        {String(match.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-base">{String(match.name)}</h4>
                        <p className="text-xs text-muted">{String(match.role)}</p>
                      </div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      {match.score}% Match
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-300 bg-surface/50 border border-white/5 p-3 rounded-xl italic relative z-10">
                    "{match.mutual}"
                  </p>
                  
                  <button className="w-full mt-3 h-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 relative z-10">
                    Message {String(match.name).split(" ")[0]} <ChevronRight className="w-4 h-4 text-muted" />
                  </button>
                </div>
              ))}
            </div>
          )
        }
      ]);
    } else {
      setChatLog(prev => [
        ...prev,
        { role: "agent", content: "I couldn't find any high-priority matches for your exact needs today. Check out the general mingling area below!" }
      ]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent-indigo" />
      </div>
    );
  }

  if (!event) return <div className="min-h-screen flex items-center justify-center text-white">Event not found.</div>;

  const googleCalUrl = generateGoogleCalendarUrl({
    title: event.title,
    description: event.description,
    location: event.location,
    startTime: event.start_time || new Date().toISOString()
  });

  return (
    <main className="flex flex-col min-h-screen px-6 pt-6 pb-32 overflow-y-auto bg-background selection:bg-accent-indigo/30">
      
      {/* PREMIUM HERO SECTION WITH IMAGE BANNER */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 relative">
        
        {/* DYNAMIC IMAGE BANNER */}
        <div className="w-full h-56 sm:h-80 rounded-3xl overflow-hidden mb-8 relative border border-white/10 shadow-cinematic bg-surface flex items-center justify-center">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-surface to-accent-indigo/20 flex items-center justify-center">
              <Calendar className="w-16 h-16 text-white/20" />
            </div>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
          {event.title}
        </h1>
        <p className="text-muted text-base leading-relaxed mb-6 max-w-2xl whitespace-pre-wrap">
          {event.description}
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-300 bg-surface/50 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
            <MapPin className="w-4 h-4 text-muted" /> {event.location}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300 bg-surface/50 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
            {/* Updated Attendee count logic */}
            <Users className="w-4 h-4 text-muted" /> {(generalAttendees?.length || 0) + (isRegistered ? 1 : 0)} Attending
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300 bg-surface/50 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
            <Calendar className="w-4 h-4 text-muted" /> 
            {new Date(event.start_time).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>

        {/* ACTIONS ROW (RSVP + CALENDAR BUTTONS) */}
        <div className="flex items-center flex-wrap gap-3">
          {!isRegistered ? (
            <button 
              onClick={handleRegister}
              disabled={isPending}
              className="w-full sm:w-auto px-8 h-12 rounded-full bg-white text-black font-semibold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Register for Event"}
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="h-12 px-6 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Registered
              </div>

              {/* DYNAMIC DROP-DOWN SELECT CALENDAR ACTION */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowCalDropdown(!showCalDropdown)}
                  className="h-12 w-12 rounded-full bg-surface hover:bg-surface-raised border border-white/10 text-white flex items-center justify-center transition-colors shadow-cinematic"
                  title="Add to Calendar"
                >
                  <CalendarPlus className="w-5 h-5 text-gray-300" />
                </button>

                <AnimatePresence>
                  {showCalDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 rounded-2xl bg-surface-raised border border-white/10 p-1.5 shadow-2xl z-50 backdrop-blur-xl"
                    >
                      <a
                        href={googleCalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowCalDropdown(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        Google Calendar
                      </a>
                      <button
                        onClick={() => {
                          downloadIcsFile();
                          setShowCalDropdown(false);
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-xl transition-colors"
                      >
                        Apple / Outlook (.ics)
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </motion.section>

      {/* QUAD AGENT MATCHMAKER UI */}
      {isRegistered && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-12">
          
          {chatLog.length === 0 ? (
            <div className="flex justify-start">
              <motion.button 
                layout
                onClick={handleAskQuad}
                onMouseEnter={() => setShowButtonText(true)}
                onMouseLeave={() => setShowButtonText(false)}
                className="flex items-center justify-center bg-accent-indigo text-white rounded-full p-3 shadow-glow-indigo overflow-hidden hover:bg-indigo-500 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {showButtonText && (
                    <motion.span
                      initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                      animate={{ opacity: 1, width: "auto", marginLeft: 8 }}
                      exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                      className="whitespace-nowrap font-medium text-sm pr-2 overflow-hidden"
                    >
                      Whom should I meet?
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {chatLog.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[90%] sm:max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-white text-black rounded-tr-sm" 
                      : "bg-surface border border-white/10 text-gray-200 rounded-tl-sm shadow-cinematic"
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              
              {isAgentThinking && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="bg-surface border border-white/10 p-4 rounded-3xl rounded-tl-sm flex items-center gap-3 shadow-cinematic">
                    <Loader2 className="w-4 h-4 animate-spin text-accent-indigo" />
                    <span className="text-sm text-muted font-medium">Scanning intent vectors...</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.section>
      )}

      {/* CLASSIC GUEST LIST UI */}
      <div className="mt-8 mb-12">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-6 flex items-center gap-2">
          General Guest List <span className="h-px bg-white/10 flex-grow ml-2"></span>
        </h3>
        
        {(!generalAttendees || generalAttendees.length === 0) ? (
          <p className="text-sm text-muted italic">No general attendees to display yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {generalAttendees?.map((guest: any) => (
              <div key={guest.id} className="p-4 rounded-2xl bg-surface/30 border border-white/5 flex items-center gap-4 hover:bg-surface/60 hover:border-white/10 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                  {guest.avatar_url ? (
                    <img src={String(guest.avatar_url)} alt={String(guest.name || "Guest")} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {String(guest.name || "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">
                    {String(guest.name || "Unknown Builder")}
                  </h4>
                  <p className="text-xs text-muted mt-0.5 truncate">
                    {String(guest.role || "Role")} @ {String(guest.company || "Stealth")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}