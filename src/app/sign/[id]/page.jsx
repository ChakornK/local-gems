"use client";

import { useState, use, useEffect } from "react";
import { ArrowLeft, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SignDetailsPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [sign, setSign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTextFocused, setIsTextFocused] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    const fetchSign = async () => {
      try {
        const res = await fetch(`/api/image/${id}`);
        if (!res.ok) throw new Error("Failed to fetch gem details");
        const data = await res.json();
        setSign(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSign();
  }, [id]);

  async function onLike() {
    if (liking) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/image/${id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to like");
      const data = await res.json();
      setSign((prev) => ({ ...prev, likes: data.likes }));
    } catch (err) {
      console.error(err);
    } finally {
      setLiking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 text-white">
        <div className="flex animate-pulse flex-col items-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="font-medium text-slate-400">Loading gem details...</p>
        </div>
      </div>
    );
  }

  if (error || !sign) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-900 p-6 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-red-400">Error</h2>
          <p className="mb-6 text-slate-400">{error || "Gem not found"}</p>
          <button
            onClick={() => router.back()}
            className="w-full rounded-xl bg-slate-800 py-3 text-white transition-colors hover:bg-slate-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const heights = isTextFocused ? { image: "h-[33%]", text: "h-[67%]" } : { image: "h-[67%]", text: "h-[33%]" };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-900">
      {/* Top Bar */}
      <div className="relative z-30 flex w-full items-center border-b border-white/10 bg-white/5 px-4 py-4 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full p-2 text-white transition-colors hover:bg-white/10"
        >
          <ArrowLeft size={20} />
        </button>

        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-normal uppercase tracking-widest text-white">
          Sign Detail
        </span>
      </div>

      {/* Image Section */}
      <div className={`${heights.image}relative w-full bg-gray-900 transition-all duration-500 ease-in-out`}>
        <Image src={sign.image} alt="Local Gem" fill className="object-cover" priority />
        <div className="pointer-events-none absolute inset-0 bg-black/20" />
      </div>

      {/* Text Section */}
      <div
        className={`
          ${heights.text}relative z-10 -mt-6 flex w-full flex-col rounded-t-3xl bg-slate-900 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out
        `}
      >
        {/* Arrow Protrusion */}
        <button
          onClick={() => setIsTextFocused((prev) => !prev)}
          className="absolute -top-4 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300 transition-all hover:bg-slate-700"
        >
          <ChevronUp size={18} className={`transition-transform duration-300 ${isTextFocused ? "rotate-180" : ""}`} />
        </button>

        {/* Header */}
        <div className="border-b border-slate-800 p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-white">Local Gem</h1>
              <p className="text-sm text-slate-400">Posted by @{sign.createdBy?.username || "user"}</p>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-400">
              {new Date(sign.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-base leading-relaxed text-slate-300">{sign.description || "No description provided."}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-800 p-6 pt-4">
          <button
            onClick={onLike}
            disabled={liking}
            className="flex-1 rounded-xl bg-blue-500 py-3 font-medium text-white transition-transform hover:bg-blue-600 active:scale-95 disabled:opacity-50"
          >
            {liking ? "..." : `Like (${sign.likes || 0})`}
          </button>
          <button className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-3 font-medium text-white transition-transform hover:bg-slate-700 active:scale-95">
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
