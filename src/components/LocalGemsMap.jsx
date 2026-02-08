"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/context/GeolocationContext";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import GemDetails from "./GemDetails";
import BottomSheet from "./BottomSheet";

const MapContainer = dynamic(async () => (await import("react-leaflet")).MapContainer, { ssr: false });
const TileLayer = dynamic(async () => (await import("react-leaflet")).TileLayer, { ssr: false });
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

export default function LocalGemsMap({ initialGemId }) {
  const { location, loading: geolocationLoading, error: geolocationError } = useGeolocation();

  const [rangeMeters, setRangeMeters] = useState(1000);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [gems, setGems] = useState([]);
  const [loadingGems, setLoadingGems] = useState(false);

  const [selectedGemId, setSelectedGemId] = useState(initialGemId || null);

  const router = useRouter();
  const [mapStyle, setMapStyle] = useState("satellite"); // "satellite" | "standard"

  useEffect(() => {
    if (initialGemId) {
      setSelectedGemId(initialGemId);
    }
  }, [initialGemId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      const L = (await import("leaflet")).default;

      const markerIcon2x = (await import("leaflet/dist/images/marker-icon-2x.png")).default;
      const markerIcon = (await import("leaflet/dist/images/marker-icon.png")).default;
      const markerShadow = (await import("leaflet/dist/images/marker-shadow.png")).default;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x.src ?? markerIcon2x,
        iconUrl: markerIcon.src ?? markerIcon,
        shadowUrl: markerShadow.src ?? markerShadow,
      });
    })();
  }, []);

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

  const routeTo = (path) => {
    router.push(path, { scroll: false });
  };

  return (
    <div className="relative h-screen w-full bg-white">
      {/* Map */}
      <div className="absolute inset-0 z-0">
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
              <Circle center={[location.lat, location.lng]} radius={rangeMeters} />
            </>
          )}

          {gems.map((g) => (
            <Marker
              key={g._id}
              position={[g.lat, g.lng]}
              eventHandlers={{
                click: () => routeTo(`/gem/${g._id}`),
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Settings button */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="pointer-events-auto absolute bottom-24 right-4 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-slate-900 text-white shadow-sm ring-1 ring-white/10 transition-colors hover:bg-black"
        aria-label="Settings"
        title="Settings"
      >
        <Icon icon="mingcute:settings-3-line" fontSize={20} />
      </button>

      {/* Location stat */}
      <div className="pointer-events-auto absolute bottom-24 left-4 rounded-2xl bg-slate-900 px-4 py-2 shadow-sm ring-1 ring-white/10">
        <div className="text-xs text-slate-400">Current location</div>
        <div className="text-sm font-medium text-white">
          {location
            ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
            : geolocationError
              ? "Location unavailable"
              : "Locating..."}
        </div>
        <div className="text-xs text-slate-400">
          Range: {metersLabel(rangeMeters)} • {mapStyle === "satellite" ? "Satellite" : "Standard"}
          {loadingGems ? " • Loading..." : ""}
        </div>
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <div className="z-2000 absolute inset-0 bg-black/30 p-4">
          <div className="mx-auto mt-20 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-900">Settings</div>
              <button onClick={() => setSettingsOpen(false)} className="rounded-full p-2 hover:bg-gray-100">
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
              <div className="text-sm font-medium text-gray-900">Detection Range</div>
              <div className="mt-1 text-sm text-gray-500">{metersLabel(rangeMeters)}</div>

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

      {/* Internal Bottom Sheet for Direct Route /gem/[id] */}
      <BottomSheet
        open={!!selectedGemId}
        onClose={() => {
          setSelectedGemId(null);
          router.push("/", { scroll: false });
        }}
      >
        <GemDetails
          gemId={selectedGemId}
          onClose={() => {
            setSelectedGemId(null);
            router.push("/", { scroll: false });
          }}
        />
      </BottomSheet>
    </div>
  );
}
