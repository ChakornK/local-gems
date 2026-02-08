"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "motion/react";

export default function GemDetails({ gemId, onClose }) {
  const router = useRouter();
  const [sign, setSign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showHearts, setShowHearts] = useState([]);
  const [pulseCount, setPulseCount] = useState(0);
  const pendingRequestsRef = useRef(0);

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
    if (!sign) return;

    const previousIsLiked = sign.isLiked;
    const previousLikesCount = sign.likes || 0;

    pendingRequestsRef.current++;

    // Optimistic Update
    setSign((prev) => {
      const newIsLiked = !prev.isLiked;
      const newLikes = newIsLiked ? (prev.likes || 0) + 1 : Math.max(0, (prev.likes || 0) - 1);
      return { ...prev, likes: newLikes, isLiked: newIsLiked };
    });
    setPulseCount((prev) => prev + 1);

    if (!previousIsLiked) {
      const newHearts = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        angle: (Math.random() - 0.5) * 60,
        distance: 100 + Math.random() * 50,
        color: ["#F472B6", "#EC4899", "#DB2777", "#F0ABFC", "#E879F9"][Math.floor(Math.random() * 5)],
      }));
      setShowHearts((prev) => [...prev, ...newHearts]);
      setTimeout(() => {
        setShowHearts((prev) => prev.filter((h) => !newHearts.find((nh) => nh.id === h.id)));
      }, 1000);
    }

    try {
      const res = await fetch(`/api/image/${gemId}/like`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();

      pendingRequestsRef.current--;

      if (pendingRequestsRef.current === 0) {
        setSign((prev) => ({ ...prev, likes: data.likes, isLiked: data.isLiked }));
      }
    } catch (err) {
      console.error(err);
      pendingRequestsRef.current--;

      if (pendingRequestsRef.current === 0) {
        setSign((prev) => ({ ...prev, likes: previousLikesCount, isLiked: previousIsLiked }));
      }
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + `/gem/${gemId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
          <div className="relative flex h-[65%] w-full shrink-0 items-center justify-center bg-slate-950">
            <div className="aspect-9/16 relative h-full overflow-hidden">
              <img src={sign.image} alt="Local Gem" className="object-cover" />
            </div>
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
                className="group relative flex-1 transition-all active:scale-90 disabled:opacity-50"
              >
                <div
                  className={`relative flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white shadow-lg transition-all ${
                    sign.isLiked
                      ? "bg-linear-to-r from-pink-500 via-rose-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
                      : "border border-slate-700 bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  <motion.div
                    key={pulseCount}
                    initial={{ scale: 1 }}
                    animate={sign.isLiked ? { scale: [1, 1.5, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    className="flex items-center"
                  >
                    <Icon
                      icon={sign.isLiked ? "mingcute:heart-fill" : "mingcute:heart-line"}
                      fontSize={22}
                      className={sign.isLiked ? "drop-shadow-sm" : "text-slate-400"}
                    />
                  </motion.div>
                  <span>{sign.likes || 0}</span>
                </div>

                <AnimatePresence>
                  {showHearts.map((heart) => (
                    <motion.div
                      key={heart.id}
                      initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                      animate={{
                        opacity: 0,
                        scale: 1.5,
                        x: Math.sin((heart.angle * Math.PI) / 180) * heart.distance,
                        y: -Math.cos((heart.angle * Math.PI) / 180) * heart.distance,
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="pointer-events-none absolute left-1/2 top-1/2 -ml-3 -mt-3"
                      style={{ color: heart.color }}
                    >
                      <Icon icon="mingcute:heart-fill" fontSize={24} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </button>

              <button
                onClick={handleCopy}
                className={`flex-1 rounded-xl border py-3 font-medium transition-all active:scale-95 ${
                  copied
                    ? "border-green-500/50 bg-green-500/10 text-green-400"
                    : "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                }`}
              >
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
