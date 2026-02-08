"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/context/GeolocationContext";
import { useRouter } from "next/navigation";

const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false },
);
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false },
);
const Marker = dynamic(async () => (await import("react-leaflet")).Marker, {
  ssr: false,
});
const Popup = dynamic(async () => (await import("react-leaflet")).Popup, {
  ssr: false,
});
const Circle = dynamic(async () => (await import("react-leaflet")).Circle, {
  ssr: false,
});

function metersLabel(m) {
  if (m < 1000) return `${m} m`;
  const km = (m / 1000).toFixed(m % 1000 === 0 ? 0 : 1);
  return `${km} km`;
}

export default function LocalGemsMap() {
  const {
    location,
    loading: geolocationLoading,
    error: geolocationError,
  } = useGeolocation();

  const [rangeMeters, setRangeMeters] = useState(1000);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [gems, setGems] = useState([]);
  const [loadingGems, setLoadingGems] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newPhoto, setNewPhoto] = useState(null);
  const [savingGem, setSavingGem] = useState(false);

  const route = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      const L = (await import("leaflet")).default;

      const markerIcon2x = (
        await import("leaflet/dist/images/marker-icon-2x.png")
      ).default;
      const markerIcon = (await import("leaflet/dist/images/marker-icon.png"))
        .default;
      const markerShadow = (
        await import("leaflet/dist/images/marker-shadow.png")
      ).default;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
        iconUrl: markerIcon.src ?? markerIcon,
        shadowUrl: markerShadow.src ?? markerShadow,
      });
    })();
  }, []);

  // Load gems (works with your backend later, but will also work with the mock API I can give you)
  useEffect(() => {
    (async () => {
      if (geolocationLoading || !location) return;
      setLoadingGems(true);
      try {
        const qs = new URLSearchParams({
          lat: location.lat.toString(),
          lng: location.lng.toString(),
          radiusMeters: rangeMeters.toString(),
        });

        const res = await fetch(`/api/image?${qs.toString()}`);
        if (!res.ok) throw new Error("Failed to load gems");
        const data = await res.json();
        setGems(data.gems || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingGems(false);
      }
    })();
  }, [location, rangeMeters]);

  const center = useMemo(() => {
    return location ? [location.lat, location.lng] : [49.2827, -123.1207]; // fallback (Vancouver)
  }, [location]);

  async function appraiseGem(gemId) {
    setGems((prev) =>
      prev.map((g) =>
        g.id === gemId ? { ...g, appraisals: (g.appraisals || 0) + 1 } : g,
      ),
    );

    try {
      const res = await fetch(`/api/image/${gemId}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("like failed");
    } catch (e) {
      setGems((prev) =>
        prev.map((g) =>
          g.id === gemId
            ? { ...g, likes: Math.max(0, (g.appraisals || 1) - 1) }
            : g,
        ),
      );
    }
  }

  async function submitNewGem() {
    route.push("/takePhoto");
  }

  return (
    <div className="relative h-screen w-full bg-white">
      {/* Top bar */}
      <div className="absolute left-0 right-0 top-0 z-[1000] flex items-center justify-between px-4 pt-4">
        <div className="rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-black/5">
          <div className="text-xs text-gray-500">Current location</div>
          <div className="text-sm font-medium text-gray-900">
            {location
              ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
              : geolocationError
                ? "Location unavailable"
                : "Locating..."}
          </div>
          <div className="text-xs text-gray-500">
            Range: {metersLabel(rangeMeters)}
            {loadingGems ? " • Loading..." : ""}
          </div>
        </div>

        <button
          onClick={() => setSettingsOpen(true)}
          className="rounded-full bg-white/90 p-3 shadow-sm ring-1 ring-black/5 hover:bg-white"
          aria-label="Settings"
          title="Settings"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M19.4 15a7.94 7.94 0 0 0 .1-1 7.94 7.94 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a8.5 8.5 0 0 0-1.7-1l-.4-2.5H9.1L8.7 7a8.5 8.5 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.94 7.94 0 0 0-.1 1c0 .34.03.67.1 1l-2 1.6 2 3.4 2.4-1c.53.4 1.1.73 1.7 1l.4 2.5h5.8l.4-2.5c.6-.27 1.17-.6 1.7-1l2.4 1 2-3.4-2-1.6Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Map */}
      <div className="absolute inset-0">
        <MapContainer center={center} zoom={15} className="h-full w-full">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {location && (
            <>
              <Marker position={[location.lat, location.lng]}>
                <Popup>You are here</Popup>
              </Marker>
              <Circle
                center={[location.lat, location.lng]}
                radius={rangeMeters}
              />
            </>
          )}

          {gems.map((g) => (
            <Marker key={g.id} position={[g.lat, g.lng]}>
              <Popup>
                <div className="w-[220px]">
                  <div className="text-sm font-semibold text-gray-900">
                    Local Gem
                  </div>

                  {g.imageUrl ? (
                    <img
                      src={g.imageUrl}
                      alt="Gem"
                      className="mt-2 h-28 w-full rounded-lg object-cover"
                    />
                  ) : null}

                  <p className="mt-2 text-sm text-gray-800">{g.note}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => appraiseGem(g.id)}
                      className="rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-black"
                    >
                      Appraise
                    </button>
                    <div className="text-xs text-gray-600">
                      {g.appraisals || 0} appraisals
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Add button */}
      <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-[1000] flex justify-center">
        <button
          onClick={() => setAddOpen(true)}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 shadow-lg ring-1 ring-black/10 hover:bg-black"
          aria-label="Add a gem"
          title="Add a gem"
        >
          <span className="text-3xl leading-none text-white">+</span>
        </button>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div className="absolute inset-0 z-[2000] bg-black/30 p-4">
          <div className="mx-auto mt-20 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900">
                Settings
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium text-gray-900">
                Detection Range
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {metersLabel(rangeMeters)}
              </div>

              <input
                className="mt-4 w-full"
                type="range"
                min={100}
                max={10000}
                step={100}
                value={rangeMeters}
                onChange={(e) => setRangeMeters(Number(e.target.value))}
              />

              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>100m</span>
                <span>10km</span>
              </div>
            </div>

            <button
              onClick={() => setSettingsOpen(false)}
              className="mt-5 w-full rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-black"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <div className="absolute inset-0 z-[2000] bg-black/30 p-4">
          <div className="mx-auto mt-16 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900">
                Add a Local Gem
              </div>
              <button
                onClick={() => setAddOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-900">Note</label>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="What makes this spot special?"
                className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-gray-400"
                rows={4}
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-900">
                Photo (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                className="mt-2 w-full text-sm"
                onChange={(e) => setNewPhoto(e.target.files?.[0] ?? null)}
              />
            </div>

            <button
              onClick={submitNewGem}
              disabled={savingGem || !location || !newNote.trim()}
              className="mt-5 w-full rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingGem ? "Posting..." : "Post Gem"}
            </button>

            {!location && (
              <div className="mt-3 text-xs text-gray-500">
                Location is required to post a gem.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
