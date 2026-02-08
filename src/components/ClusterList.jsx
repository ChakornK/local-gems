"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";

export default function ClusterList({ gems, onGemClick, onClose }) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/50 p-6 backdrop-blur-sm">
        <div>
          <h2 className="bg-linear-to-r from-white to-slate-400 bg-clip-text text-xl font-bold text-transparent">
            {gems.length} {gems.length === 1 ? "Gem" : "Gems"} Found
          </h2>
          <p className="text-sm text-slate-500">Nearby in this cluster</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-slate-800 p-2.5 text-slate-400 transition-all hover:bg-slate-700 hover:text-white active:scale-90"
        >
          <Icon icon="mingcute:close-line" fontSize={24} />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {gems.map((gem, index) => (
          <div
            key={gem._id}
            onClick={() => onGemClick(gem)}
            className="group relative flex cursor-pointer items-center gap-4 rounded-2xl border border-white/5 bg-slate-800/40 p-3 transition-all duration-300 hover:border-blue-500/30 hover:bg-slate-800"
          >
            {/* Thumbnail */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-700 shadow-inner">
              {gem.image ? (
                <Image
                  src={gem.image}
                  alt={gem.title || "Gem"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-500">
                  <Icon icon="mingcute:pic-line" fontSize={32} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h3 className="truncate text-base font-bold text-white">
                  {gem.description ? gem.description.substring(0, 30) : "Local Gem"}
                  {gem.description?.length > 30 ? "..." : ""}
                </h3>
              </div>
              <p className="line-clamp-2 text-sm leading-snug text-slate-400">
                {gem.description || "No description provided."}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-blue-400/80">
                <Icon icon="mingcute:location-line" />
                <span>View Details</span>
              </div>
            </div>

            <div className="rounded-full bg-slate-700/50 p-2 text-slate-500 transition-colors group-hover:bg-blue-500/10 group-hover:text-blue-400">
              <Icon icon="mingcute:right-line" fontSize={18} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
