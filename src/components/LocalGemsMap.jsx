"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/context/GeolocationContext";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

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
  const [mapStyle, setMapStyle] = useState("satellite"); // "satellite" | "standard"

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
        setGems(data || []);
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
      <div className="z-1000 pointer-events-none absolute left-0 right-0 top-0 flex items-center justify-between px-4 pt-4">
        <div className="pointer-events-auto ml-12 rounded-full bg-slate-900 px-4 py-2 shadow-sm ring-1 ring-white/10">
          <div className="text-xs text-slate-400">Current location</div>
          <div className="text-sm font-medium text-white">
            {location
              ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
              : geolocationError
                ? "Location unavailable"
                : "Locating..."}
          </div>
          <div className="text-xs text-slate-400">
            Range: {metersLabel(rangeMeters)} •{" "}
            {mapStyle === "satellite" ? "Satellite" : "Standard"}
            {loadingGems ? " • Loading..." : ""}
          </div>
        </div>

        <button
          onClick={() => setSettingsOpen(true)}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm ring-1 ring-white/10 transition-colors hover:bg-black"
          aria-label="Settings"
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Map */}
      <div className="absolute inset-0">
        <MapContainer
          key={!geolocationLoading ? "map-ready" : "map-loading"}
          center={center}
          zoom={15}
          className="h-full w-full"
        >
          {mapStyle === "satellite" ? (
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          ) : (
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://tile.jawg.io/03a4a9f9-9307-4a1d-ac35-fda25ea3559f/{z}/{x}/{y}{r}.png?access-token=JpJbH2xN72Dan8bpThb5RwJCZMEvPzCDfrU0IVidSDRUQ4zLRB9ryTvIZEliu0Cu"
            />
          )}

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

                  {g.image ? (
                    <img
                      src={g.image}
                      alt="Gem"
                      className="mt-2 h-28 w-full rounded-lg object-cover"
                    />
                  ) : null}

                  <p className="mt-2 text-sm text-gray-800">{g.note}</p>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => appraiseGem(g.id)}
                      className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-black"
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

      {/* Settings modal */}
      {settingsOpen && (
        <div className="z-2000 absolute inset-0 bg-black/30 p-4">
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
              <div className="text-sm font-medium text-gray-900">Map Style</div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMapStyle("standard")}
                  className={
                    "rounded-xl px-3 py-2 text-sm font-medium ring-1 transition " +
                    (mapStyle === "standard"
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-white text-slate-900 ring-gray-200 hover:bg-gray-50")
                  }
                >
                  Standard
                </button>

                <button
                  type="button"
                  onClick={() => setMapStyle("satellite")}
                  className={
                    "rounded-xl px-3 py-2 text-sm font-medium ring-1 transition " +
                    (mapStyle === "satellite"
                      ? "bg-slate-900 text-white ring-slate-900"
                      : "bg-white text-slate-900 ring-gray-200 hover:bg-gray-50")
                  }
                >
                  Satellite
                </button>
              </div>
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
        <div className="z-2000 absolute inset-0 bg-black/30 p-4">
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
