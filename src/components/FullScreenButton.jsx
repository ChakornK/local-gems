"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export default function FullScreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen: ${e.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  if (isFullscreen) return null;

  return (
    <button
      onClick={toggleFullscreen}
      className="z-9999 fixed right-4 top-4 flex items-center justify-center rounded-full bg-black/40 p-2.5 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-95"
      aria-label="Toggle Fullscreen"
    >
      <Icon icon="mingcute:fullscreen-line" fontSize={24} />
    </button>
  );
}
