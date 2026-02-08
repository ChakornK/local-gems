'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, PlusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { label: 'Map', icon: Map, href: '/' },
    { label: 'Post', icon: PlusCircle, href: '/takePhoto', primary: true },
    { label: 'Profile', icon: User, href: '/profile' },
];

export default function BottomNav() {
    const pathname = usePathname();

    const isHiddenPath = pathname === '/takePhoto';

    return (
        <AnimatePresence>
            {!isHiddenPath && (
                <motion.nav
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-900/80 backdrop-blur-xl border-t border-white/10 px-6 pb-5 pt-2"
                >
                    <div className="flex items-center justify-between max-w-sm mx-auto">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            if (item.primary) {
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="relative -top-10 flex flex-col items-center group"
                                    >
                                        <div className="bg-blue-500 p-4 rounded-full shadow-lg shadow-blue-500/20 group-active:scale-95 transition-transform border-4 border-slate-900">
                                            <Icon className="text-white w-7 h-7" />
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
                                        isActive ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                                    <span className="text-[10px] font-medium tracking-wide uppercase">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
}
