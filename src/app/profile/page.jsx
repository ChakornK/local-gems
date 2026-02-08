'use client';

import { useState } from 'react';

import { MapPin, Heart, Share2 } from 'lucide-react';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const router = useRouter();
    const emojiBank = ["👤", "🤖", "👻", "👾", "🐶", "🐱", "🦊", "🐼", "🐻", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐰", "🐹", "🦝", "🦫", "🦥", "🐔", "🐧", "🦉", "🦅", "🦜", "🐟", "🐙", "🦈", "🐳", "🐢", "🦎", "🐍", "🦕"]
    const [selectedEmoji, setSelectedEmoji] = useState(emojiBank[0]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    // Mock Data
    const user = {
        name: "User1",
        handle: "@User1",
        sex: "Male",
        age: 25,
        bio: "Hunting for the best hidden gems in the city! 🏙️🌲",
        stats: {
            signs: 4,
            likes: 843,
        }
    };

    const myposts = [
        { id: 1, title: "Secret Garden", image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=3432&auto=format&fit=crop", likes: 45 },
        { id: 2, title: "Best Coffee", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=3742&auto=format&fit=crop", likes: 120 },
        { id: 3, title: "Sunset Point", image: "https://images.unsplash.com/photo-1614531341773-01c51cbce8dc?q=80&w=3774&auto=format&fit=crop", likes: 89 },
        { id: 4, title: "Old Library", image: "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=3415&auto=format&fit=crop", likes: 210 },
    ];

    return (
        <div className="min-h-screen w-full bg-slate-900 pb-20">


            {/* Topic Bar */}
            <div className="w-full bg-white/5 backdrop-blur-md border-b border-white/10 py-4 flex items-center justify-center relative z-20">
                <button
                    onClick={() => router.back()}
                    className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <span className="text-white font-normal text-sm tracking-widest uppercase">
                    User Profile
                </span>
            </div>

            {/* Header / Cover Area */}
            <div className="relative h-48 bg-slate-900">
                <div className="absolute -bottom-12 left-6">
                    <div className="relative h-24 w-24 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-800 flex items-center justify-center text-4xl">
                        {selectedEmoji}
                    </div>
                </div>
            </div>

            {/* Profile Info */}
            <div className="pt-14 px-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                        <p className="text-slate-400 font-medium">{user.handle}</p>
                        <div className="flex gap-2 text-sm text-slate-500 font-medium">
                            <span>{user.sex}</span>
                            <span>•</span>
                            <span>{user.age} years old</span>
                        </div>
                    </div>
                    <button className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                        Edit Profile
                    </button>
                </div>
                {/* Avatar */}
                <div className="mt-6 relative z-30">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Choose your Avatar</p>

                    {/* Dropdown Button */}
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 bg-slate-800 text-white px-4 py-3 rounded-xl hover:bg-slate-700 transition-colors w-full sm:w-64"
                    >
                        <span className="text-2xl">{selectedEmoji}</span>
                        <span className="text-sm font-medium flex-1 text-left">Change Avatar</span>
                        <span className="text-xs text-slate-400">▼</span>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 grid grid-cols-5 gap-2">
                            {emojiBank.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => {
                                        setSelectedEmoji(emoji);
                                        setIsDropdownOpen(false);
                                    }}
                                    className={`aspect-square flex items-center justify-center rounded-lg text-2xl transition-all ${selectedEmoji === emoji
                                        ? 'bg-blue-500 text-white'
                                        : 'hover:bg-slate-700 text-slate-300'
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <p className="mt-4 text-slate-300 leading-relaxed">
                    {user.bio}
                </p>

                {/* Stats Row */}
                <div className="flex gap-6 mt-6 py-4 border-y border-slate-800">
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-white">{user.stats.signs}</span>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Signs</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-bold text-white">{user.stats.likes}</span>
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Likes</span>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="mt-6 px-6">
                <div className="flex gap-6 border-b border-slate-800 mb-6">
                    <button className="pb-3 border-b-2 border-blue-500 text-blue-400 font-medium">
                        My Signs
                    </button>
                </div>

                {/* Grid Gallery */}
                <div className="grid grid-cols-2 gap-4">
                    {myposts.map((post) => (
                        <div key={post.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-800 group">
                            <Image
                                src={post.image}
                                alt={post.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                            <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-white text-sm font-bold truncate">{post.title}</h3>
                                <div className="flex items-center gap-1 text-slate-300 text-xs mt-1">
                                    <Heart size={12} className="fill-current" />
                                    <span>{post.likes}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
