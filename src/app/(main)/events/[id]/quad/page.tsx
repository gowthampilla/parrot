"use client";

import { use, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Sparkles, Send, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
// FIX 1: Import the dedicated AI matching function instead of the basic roster function
import { runQuadMatchmaker } from "@/app/actions/events";

export default function QuadAgentChat({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [messages, setMessages] = useState([
    { role: "user", content: "Whom should I meet at this event?" }
  ]);
  const [isTyping, setIsTyping] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    async function runAgentLogic() {
      // FIX 2: Call the heavy Pinecone AI function here
      const result = await runQuadMatchmaker(eventId);
      
      // Simulate AI "thinking" time for UX
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: "agent", 
          content: "I've scanned the guest list against your intent vector. Based on what you're building, I found some highly compatible founders you need to speak with today." 
        }]);
        // result.recommendedAttendees will now actually contain the AI matches!
        setRecommendations(result.success ? (result.recommendedAttendees || []) : []);
        setIsTyping(false);
      }, 2000);
    }
    
    runAgentLogic();
  }, [eventId]);

  return (
    <main className="flex flex-col h-screen bg-background">
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/5 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
        <Link href={`/events/${eventId}`} className="p-2 -ml-2 rounded-full hover:bg-white/5 text-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent-indigo" />
          <span className="text-sm font-semibold text-foreground">Quad Agent</span>
        </div>
        <div className="w-9 h-9" /> {/* Spacer */}
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-surface-raised text-foreground rounded-tr-sm shadow-cinematic" 
                  : "bg-accent-indigo/10 border border-accent-indigo/20 text-indigo-50 rounded-tl-sm shadow-cinematic"
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-accent-indigo/10 border border-accent-indigo/20 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center shadow-cinematic">
                <span className="w-2 h-2 rounded-full bg-accent-indigo animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-accent-indigo animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-accent-indigo animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}

          {/* AI Recommendation Cards rendered inside the chat */}
          {!isTyping && recommendations.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3 mt-4">
              {recommendations.map((person) => (
                <div key={person.id} className="glass-panel p-4 border-accent-indigo/30 bg-surface shadow-cinematic hover:border-accent-indigo/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-base">{person.name}</h3>
                      <p className="text-xs text-accent-indigo font-medium">{person.role} @ {person.company}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-surface-raised border border-white/5 flex items-center justify-center font-bold text-white">
                      {String(person.name || "?").substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2 mb-4 bg-black/20 p-2.5 rounded-lg italic border border-white/5">
                    <span className="font-semibold text-white not-italic">Why match: </span> 
                    {person.mutual || `Their goals align with your current intent.`}
                  </p>
                  <Link href={`/chats/${person.id}`} className="w-full h-10 rounded-xl bg-accent-indigo text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-colors shadow-glow-indigo">
                    <UserPlus className="w-4 h-4" /> Message {String(person.name).split(" ")[0]}
                  </Link>
                </div>
              ))}
            </motion.div>
          )}

          {!isTyping && recommendations.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted text-center p-4 bg-surface rounded-2xl border border-white/5 italic">
              I couldn't find any high-priority matches for your specific intent at this event. Check out the general mingling area!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area (Mocked for now) */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-background/80 backdrop-blur-xl border-t border-white/5 z-40">
        <div className="relative flex items-center">
          <input disabled type="text" placeholder="Ask Quad a follow-up..." className="w-full h-12 pl-4 pr-12 rounded-2xl bg-surface border border-white/10 text-sm text-foreground placeholder:text-muted/50 cursor-not-allowed opacity-50" />
          <button disabled className="absolute right-2 w-8 h-8 rounded-xl bg-surface-raised flex items-center justify-center text-muted opacity-50">
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

    </main>
  );
}