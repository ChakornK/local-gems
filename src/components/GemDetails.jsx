"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";

export default function GemDetails({ gemId, onClose }) {
  const router = useRouter();
  const [sign, setSign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!gemId) return;
    const fetchSign = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/image/${gemId}`);
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
  }, [gemId]);

  async function onLike() {
    if (liking || !sign) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/image/${gemId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to like");
      const data = await res.json();
      setSign((prev) => ({ ...prev, likes: data.likes }));
    } catch (err) {
      console.error(err);
    } finally {
      setLiking(false);
    }
  }

  const handleClose = (path) => {
    if (onClose) {
      onClose(typeof path === "string" ? path : null);
    } else if (typeof path === "string") {
      router.push(path);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-t-xl bg-slate-900 text-white">
      {loading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex animate-pulse flex-col items-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="font-medium text-slate-400">Loading gem details...</p>
          </div>
        </div>
      ) : error || !sign ? (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-white">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <h2 className="mb-2 text-xl font-bold text-red-400">Error</h2>
            <p className="mb-6 text-slate-400">{error || "Gem not found"}</p>
            <button
              onClick={handleClose}
              className="w-full rounded-xl bg-slate-800 py-3 text-white transition-colors hover:bg-slate-700"
            >
              Go Back
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Image Section */}
          <div className="relative h-[65%] w-full shrink-0 bg-gray-900">
            <Image src={sign.image} alt="Local Gem" fill className="object-cover" priority />
            <button
              onClick={handleClose}
              className="absolute left-4 top-4 z-10 rounded-full bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
            >
              <Icon icon="mingcute:close-line" fontSize={24} />
            </button>
          </div>

          {/* Text Section */}
          <div className="flex h-[35%] flex-col overflow-hidden bg-slate-900">
            {/* Header */}
            <div className="shrink-0 border-b border-slate-800 p-6 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="mb-1 text-2xl font-bold text-white">{sign.title || "Local Gem"}</h1>
                  <p className="text-sm text-slate-400">
                    Posted by{" "}
                    <button
                      onClick={() => {
                        handleClose(`/u/${sign.createdBy?._id}`);
                      }}
                      className="font-bold text-blue-400 hover:underline"
                    >
                      {sign.createdBy?.name ? sign.createdBy.name.split(" ")[0] : "an unknown user"}
                    </button>
                  </p>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-400">
                  {new Date(sign.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="flex-1 overflow-y-auto px-6 py-2.5">
              <p className="text-base leading-relaxed text-slate-300">
                {sign.description || "No description provided."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 gap-3 border-t border-slate-800 p-6 pb-8 pt-4">
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
        </>
      )}
    </div>
  );
}
