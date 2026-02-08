"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Icon } from "@iconify/react";

const navItems = [
  { label: "Map", icon: "map", href: "/" },
  { label: "Post", icon: "add", href: "/takePhoto", primary: true },
  { label: "Profile", icon: "user-4", href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isHiddenPath = pathname === "/takePhoto" || pathname.startsWith("/sign/");

  return (
    <AnimatePresence>
      {!isHiddenPath && (
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="z-9999 fixed bottom-0 left-0 right-0 border-t border-white/10 bg-slate-900/80 px-6 pb-1 pt-1 backdrop-blur-xl"
        >
          <div className="max-w-75 mx-auto flex items-center justify-between px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              if (item.primary) {
                return (
                  <Link key={item.label} href={item.href} className="group relative -top-4 flex flex-col items-center">
                    <div className="rounded-full border-4 border-slate-900 bg-blue-500 p-4 shadow-lg shadow-blue-500/20 transition-transform group-active:scale-95">
                      <Icon icon={`mingcute:${item.icon}-fill`} className="h-7 w-7 text-white" />
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-colors duration-200",
                    isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300",
                  )}
                >
                  <Icon icon={`mingcute:${item.icon}-${isActive ? "fill" : "line"}`} className="h-6 w-6" />
                  <span className="text-[10px] font-medium uppercase tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
