"use client";

import { useState } from "react";

import Image from "next/image";
import { Icon } from "@iconify/react";
import BottomSheet from "./BottomSheet";

const emojiBank = [
  "👤",
  "🤖",
  "👻",
  "👾",
  "🐶",
  "🐱",
  "🦊",
  "🐼",
  "🐻",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🐰",
  "🐹",
  "🦝",
  "🦫",
  "🦥",
  "🐔",
  "🐧",
  "🦉",
  "🦅",
  "🦜",
  "🐟",
  "🐙",
  "🦈",
  "🐳",
  "🐢",
  "🦎",
  "🐍",
  "🦕",
];

export default function ProfileView() {
  const [selectedEmoji, setSelectedEmoji] = useState(emojiBank[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mock Data
  const user = {
    name: "User1",
    handle: "@User1",
    bio: "Hunting for the best hidden gems in the city! 🏙️🌲",
    stats: {
      signs: 4,
      likes: 843,
    },
  };

  const myposts = [
    {
      id: 1,
      title: "Secret Garden",
      image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=3432&auto=format&fit=crop",
      likes: 45,
    },
    {
      id: 2,
      title: "Best Coffee",
      image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=3742&auto=format&fit=crop",
      likes: 120,
    },
    {
      id: 3,
      title: "Sunset Point",
      image: "https://images.unsplash.com/photo-1614531341773-01c51cbce8dc?q=80&w=3774&auto=format&fit=crop",
      likes: 89,
    },
    {
      id: 4,
      title: "Old Library",
      image: "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=3415&auto=format&fit=crop",
      likes: 210,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-900 pb-20">
      {/* Topic Bar */}
      {/* <div className="relative z-20 flex w-full items-center justify-center border-b border-white/10 bg-white/5 py-4 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="absolute left-4 rounded-full p-2 text-white transition-colors hover:bg-white/10"
        >
          <Icon icon="mingcute:arrow-left-line" fontSize={20} />
        </button>
        <span className="text-sm font-normal uppercase tracking-widest text-white">User Profile</span>
      </div> */}

      {/* Header / Cover Area */}
      <div className="relative h-48 bg-slate-900">
        <div className="absolute -bottom-12 left-6">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-900 bg-slate-800 text-4xl">
            {selectedEmoji}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-6 pt-14">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{user.name}</h1>
            <p className="font-medium text-slate-400">{user.handle}</p>
          </div>
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700">
            Edit Profile
          </button>
        </div>
        {/* Avatar */}
        <div className="relative z-30 mt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Choose your Avatar</p>

          {/* Dropdown Button */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex w-full items-center gap-3 rounded-xl bg-slate-800 px-4 py-3 text-white transition-colors hover:bg-slate-700 sm:w-64"
          >
            <span className="text-2xl">{selectedEmoji}</span>
            <span className="flex-1 text-left text-sm font-medium">Change Avatar</span>
            <span className="text-xs text-slate-400">▼</span>
          </button>
          <BottomSheet open={isDropdownOpen} onClose={() => setIsDropdownOpen(false)}>
            <div className="flex justify-end p-4">
              <button onClick={() => setIsDropdownOpen(false)} className="font-semibold">
                <Icon icon="mingcute:close-line" />
              </button>
            </div>
            <div className="grid w-full grid-cols-5 gap-2 px-3">
              {emojiBank.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setSelectedEmoji(emoji);
                    setIsDropdownOpen(false);
                  }}
                  className={`flex aspect-square items-center justify-center rounded-lg text-2xl transition-all ${
                    selectedEmoji === emoji ? "bg-blue-500 text-white" : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </BottomSheet>
        </div>

        <p className="mt-4 leading-relaxed text-slate-300">{user.bio}</p>

        {/* Stats Row */}
        <div className="mt-6 flex gap-6 border-y border-slate-800 py-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">{user.stats.signs}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400">Signs</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">{user.stats.likes}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400">Likes</span>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="mt-6 px-6">
        <div className="mb-6 flex gap-6 border-b border-slate-800">
          <button className="border-b-2 border-blue-500 pb-3 font-medium text-blue-400">My Signs</button>
        </div>

        {/* Grid Gallery */}
        <div className="grid grid-cols-2 gap-4">
          {myposts.map((post) => (
            <div key={post.id} className="aspect-3/4 group relative overflow-hidden rounded-xl bg-slate-800">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="bg-linear-to-t absolute inset-0 from-black/80 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="truncate text-sm font-bold text-white">{post.title}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-300">
                  <Icon icon="mingcute:heart-line" fontSize={14} />
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
