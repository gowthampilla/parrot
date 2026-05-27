"use client";

import { useState, useEffect, useRef, use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Loader2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ChatRoom({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params for Next.js 15 compatibility
  const resolvedParams = use(params);
  const receiverId = resolvedParams.id;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const setupChat = async () => {
      // 1. Get the currently authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // 2. Fetch historical messages between these two users
      const { data: history } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (history) setMessages(history);
      setIsLoading(false);

      // 3. Subscribe to real-time WebSockets for new incoming messages
      const subscription = supabase
        .channel(`chat_${receiverId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`, // Listen for messages sent to ME
          },
          (payload) => {
            // Add incoming message to the UI instantly
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    };

    setupChat();
  }, [receiverId, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUserId) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Optimistic UI clear

    // Optimistically add to UI for instant feedback
    const optimisticMsg = {
      id: Math.random().toString(),
      sender_id: currentUserId,
      receiver_id: receiverId,
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Send to Supabase
    await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: receiverId,
      content: messageText,
    });
  };

  return (
    <main className="flex flex-col h-screen bg-background">
      
      {/* 1. Sticky Header */}
      <header className="fixed top-0 left-0 w-full glass-panel !rounded-none !border-t-0 !border-x-0 z-40 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chats" className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-indigo flex items-center justify-center font-bold text-white shadow-glow-indigo">
              B
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Builder</h2>
              <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
              </p>
            </div>
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-muted">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* 2. Message History Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-24 pb-28 no-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-accent-indigo" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg, index) => {
              const isMe = msg.sender_id === currentUserId;
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe 
                        ? "bg-accent-indigo text-white rounded-br-sm shadow-glow-indigo" 
                        : "bg-surface-raised border border-white/5 text-foreground rounded-bl-sm shadow-cinematic"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 3. Message Input Area */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-background/80 backdrop-blur-xl border-t border-white/5 z-40">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full h-12 pl-4 pr-12 rounded-2xl bg-surface border border-white/10 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent-indigo/50 focus:ring-1 focus:ring-accent-indigo/50 transition-all shadow-cinematic"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 w-8 h-8 rounded-xl bg-accent-indigo flex items-center justify-center text-white disabled:opacity-50 disabled:bg-surface-raised hover:scale-105 transition-all"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

    </main>
  );
}