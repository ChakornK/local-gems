"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import BottomSheet from "./BottomSheet";
import { useRouter } from "next/navigation";

const emojis = {
  person: "👤",
  robot: "🤖",
  ghost: "👻",
  alien_monster: "👾",
  dog: "🐶",
  cat: "🐱",
  fox: "🦊",
  panda: "🐼",
  bear: "🐻",
  koala: "🐨",
  tiger: "🐯",
  lion: "🦁",
  cow: "🐮",
  pig: "🐷",
  frog: "🐸",
  monkey: "🐵",
  rabbit: "🐰",
  hamster: "🐹",
  raccoon: "🦝",
  beaver: "🦫",
  sloth: "🦥",
  chicken: "🐔",
  penguin: "🐧",
  owl: "🦉",
  eagle: "🦅",
  parrot: "🦜",
  fish: "🐟",
  octopus: "🐙",
  shark: "🦈",
  whale: "🐳",
  turtle: "🐢",
  lizard: "🦎",
  snake: "🐍",
  sauropod: "🦕",
};

const emojiColors = {
  person: "#E2E8F0", // Slate
  robot: "#CBD5E1", // Steel
  ghost: "#F8FAFC", // White/Ghost
  alien_monster: "#E9D5FF", // Purple
  dog: "#FFEDD5", // Orange
  cat: "#FEF3C7", // Amber
  fox: "#FFEDD5", // Orange
  panda: "#F1F5F9", // White/Gray
  bear: "#FDE68A", // Brown/Yellow
  koala: "#E2E8F0", // Gray
  tiger: "#FFEDD5", // Orange
  lion: "#FEF3C7", // Yellow
  cow: "#F1F5F9", // Black/White
  pig: "#FCE7F3", // Pink
  frog: "#DCFCE7", // Green
  monkey: "#FEF3C7", // Brown
  rabbit: "#F1F5F9", // White
  hamster: "#FEF3C7", // Brown
  raccoon: "#E2E8F0", // Gray
  beaver: "#FEF3C7", // Brown
  sloth: "#FEF3C7", // Brown
  chicken: "#FEF3C7", // Yellow
  penguin: "#E0F2FE", // Blue
  owl: "#FEF3C7", // Brown
  eagle: "#FEF3C7", // Brown
  parrot: "#DCFCE7", // Green
  fish: "#E0F2FE", // Blue
  octopus: "#FCE7F3", // Pink
  shark: "#E0F2FE", // Blue
  whale: "#E0F2FE", // Blue
  turtle: "#DCFCE7", // Green
  lizard: "#DCFCE7", // Green
  snake: "#DCFCE7", // Green
  sauropod: "#DCFCE7", // Green
};

export default function ProfileView({ isMine, userId }) {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedEmoji, setSelectedEmoji] = useState("person");
  const [isEmojiSelectorOpen, setIsEmojiSelectorOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");

  const fetchUser = async () => {
    try {
      setLoading(true);
      const endpoint = isMine ? "/api/users/me" : `/api/users/${userId}`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }
      const data = await res.json();
      setUserData(data);
      setBio(data.bio || "");
      setSelectedEmoji(data.pfp || "person");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [isMine, userId]);

  const saveProfile = async (updates) => {
    try {
      const res = await fetch("/api/editProfile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updatedData = await res.json();
        if (updatedData.user) {
          setUserData(updatedData.user);
        }
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="animate-pulse text-sm font-medium text-slate-400">Loading Profile...</p>
        </div>
      </div>
    );

  if (error || !userData)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <Icon icon="mingcute:error-line" className="mx-auto mb-4 text-4xl text-red-500" />
          <p className="text-lg font-medium">{error || "User not found"}</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-400 hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );

  const user = userData;

  const stats = user.stats || {
    posts: 0,
    likes: 0,
  };

  const myposts = user.posts || [];

  return (
    <div className="min-h-screen w-full bg-slate-900 pb-20">
      {/* Topic Bar */}
      {!isMine && (
        <div className="relative z-20 flex w-full items-center justify-center border-b border-white/10 bg-white/5 py-4 backdrop-blur-md">
          <button
            onClick={() => router.back()}
            className="absolute left-4 rounded-full p-2 text-white transition-colors hover:bg-white/10"
          >
            <Icon icon="mingcute:arrow-left-line" fontSize={20} />
          </button>
          <span className="text-sm font-normal uppercase tracking-widest text-white">User Profile</span>
        </div>
      )}

      {/* Header / Cover Area with Mosaic */}
      <div className="relative h-48 bg-slate-900">
        <div className="absolute inset-0 overflow-clip">
          <div
            className="grayscale-50 absolute inset-0 grid select-none grid-cols-6 items-center justify-center gap-4 pb-12 opacity-10 transition-all duration-700"
            style={{ transform: "rotate(-12deg) scale(1.5)" }}
          >
            {Array.from({ length: 48 }).map((_, i) => (
              <span key={i} className="text-4xl">
                {emojis[selectedEmoji]}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-linear-to-b absolute inset-0 from-transparent via-slate-900/50 to-slate-900" />

        <button
          className="absolute -bottom-10 left-6 z-10"
          onClick={() => isMine && setIsEmojiSelectorOpen(true)}
          disabled={!isMine}
        >
          <div
            className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-900 text-4xl shadow-xl transition-all duration-300"
            style={{ backgroundColor: emojiColors[selectedEmoji] || "#E2E8F0" }}
          >
            {emojis[selectedEmoji]}
          </div>
          {isMine && (
            <div className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 p-1.5 text-white shadow-md ring-2 ring-slate-900 transition-transform active:scale-90">
              <Icon icon="mingcute:edit-2-line" fontSize={18} />
            </div>
          )}
        </button>
      </div>
      {isMine && (
        <BottomSheet open={isEmojiSelectorOpen} onClose={() => setIsEmojiSelectorOpen(false)}>
          <div className="flex justify-end p-4">
            <button onClick={() => setIsEmojiSelectorOpen(false)} className="font-semibold">
              <Icon icon="mingcute:close-line" />
            </button>
          </div>
          <div className="grid w-full grid-cols-5 gap-2 px-3 pb-8">
            {Object.entries(emojis).map(([name, emoji]) => (
              <button
                key={emoji}
                onClick={async () => {
                  setSelectedEmoji(name);
                  setIsEmojiSelectorOpen(false);
                  await saveProfile({ pfp: name });
                }}
                className={`flex aspect-square items-center justify-center rounded-lg text-2xl transition-all ${
                  selectedEmoji === name ? "bg-blue-500 text-white" : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      {/* Profile Info */}
      <div className="px-6 pt-14">
        <div>
          <h1 className="text-2xl font-bold text-white">{user.name}</h1>
        </div>

        <div className="mt-4 text-slate-300">
          <div className="flex items-center gap-2">
            {!editing && (
              <>
                <p className="leading-relaxed">{bio || "No bio yet."}</p>
                {isMine && (
                  <button onClick={() => setEditing(true)}>
                    <Icon icon="mingcute:edit-2-line" fontSize={16} />
                  </button>
                )}
              </>
            )}

            {editing && (
              <>
                <input
                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-white outline-none focus:border-blue-500"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={async () => {
                    setEditing(false);
                    await saveProfile({ bio });
                  }}
                  className="text-blue-400"
                >
                  <Icon icon="mingcute:save-2-line" fontSize={20} />
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setBio(user.bio || "");
                  }}
                  className="text-slate-400"
                >
                  <Icon icon="mingcute:close-line" fontSize={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-6 flex gap-6 border-y border-slate-800 py-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">{stats.posts}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400">Posts</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-white">{stats.likes}</span>
            <span className="text-xs uppercase tracking-wider text-slate-400">Likes</span>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="mt-6 px-6">
        <div className="mb-6 flex gap-6 border-b border-slate-800">
          <button className="border-b-2 border-blue-500 pb-3 font-medium text-blue-400">My Posts</button>
        </div>

        {/* Grid Gallery */}
        <div className="grid grid-cols-2 gap-4">
          {myposts.map((post) => (
            <div key={post._id} className="aspect-3/4 group relative overflow-hidden rounded-xl bg-slate-800">
              <Image
                src={post.image}
                alt={post.description || "Local Gem"}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="bg-linear-to-t absolute inset-0 from-black/80 via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="truncate text-sm font-bold text-white">{post.description || "Untitled Gem"}</h3>
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
