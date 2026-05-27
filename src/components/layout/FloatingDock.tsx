"use client";

import { motion } from "framer-motion";
import { Home, Compass, Calendar, MessageSquare, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },

  { icon: Calendar, label: "Events", href: "/my-events" },
 
  { icon: User, label: "Profile", href: "/profile" },
];

export function FloatingDock() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="floating-dock px-6 py-4 flex items-center gap-8"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.label} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex flex-col items-center group"
              >
                <Icon 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`w-6 h-6 transition-colors duration-300 ${
                    isActive ? "text-foreground" : "text-muted hover:text-foreground"
                  }`} 
                />
                
                {/* Active Indicator Glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-3 w-1 h-1 rounded-full bg-accent-indigo shadow-glow-indigo"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}