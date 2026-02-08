"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/context/GeolocationContext";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import GemDetails from "./GemDetails";
import BottomSheet from "./BottomSheet";
import ClusterList from "./ClusterList";

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
const MarkerClusterGroup = dynamic(async () => (await import("@/components/GemClusterGroup")).default, {
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

  const [clusterGems, setClusterGems] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      const L = (await import("leaflet")).default;

      const customPin = L.divIcon({
        html: `
<div class="relative flex items-center justify-center text-blue-400" style="width: 40px; height: 48px;">
  <svg viewBox="0 0 24 24" class="drop-shadow-black/50 absolute inset-0 h-full w-full drop-shadow" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor" />
  </svg>
  <div class="z-201 absolute left-1/2 top-[16px] flex h-[8px] w-[8px] -translate-x-1/2 items-center justify-center rounded-full bg-white"></div>
</div>
              `,
        className: "custom-clustericon",
        iconSize: L.point(40, 48),
        iconAnchor: [20, 48],
      });
      L.Marker.prototype.options.icon = customPin;
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

          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            spiderfyOnMaxZoom={false}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={false}
            onClusterClick={(cluster) => {
              const markers = cluster.layer.getAllChildMarkers();
              const gemIds = markers.map((m) => m.options.gemId);
              const selectedGems = gems.filter((g) => gemIds.includes(g._id));
              setClusterGems(selectedGems);
            }}
          >
            {gems.map((g) => (
              <Marker
                key={g._id}
                position={[g.lat, g.lng]}
                gemId={g._id}
                eventHandlers={{
                  click: () => routeTo(`/gem/${g._id}`),
                }}
              />
            ))}
          </MarkerClusterGroup>
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

      {/* Settings BottomSheet */}
      <BottomSheet open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <div className="flex h-full flex-col overflow-hidden bg-slate-900 p-6 text-white">
          <div className="flex items-center justify-between pb-4">
            <h2 className="text-xl font-bold">Settings</h2>
            <button
              onClick={() => setSettingsOpen(false)}
              className="rounded-full bg-slate-800 p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <Icon icon="mingcute:close-line" fontSize={24} />
            </button>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto py-4">
            {/* Map Style */}
            <section>
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                <Icon icon="mingcute:layers-line" fontSize={18} />
                Map Style
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMapStyle("standard")}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                    mapStyle === "standard"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <Icon icon="mingcute:map-2-line" fontSize={32} />
                  <span className="text-sm font-medium">Standard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMapStyle("satellite")}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                    mapStyle === "satellite"
                      ? "border-blue-500 bg-blue-500/10 text-blue-400"
                      : "border-slate-800 bg-slate-800/50 text-slate-400 hover:border-slate-700 hover:bg-slate-800"
                  }`}
                >
                  <Icon icon="mingcute:earth-line" fontSize={32} />
                  <span className="text-sm font-medium">Satellite</span>
                </button>
              </div>
            </section>

            {/* Detection Range */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  <Icon icon="mingcute:radar-line" fontSize={18} />
                  Detection Range
                </div>
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-bold text-blue-400 ring-1 ring-blue-500/20">
                  {metersLabel(rangeMeters)}
                </span>
              </div>

              <div className="px-2">
                <input
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500"
                  type="range"
                  min={100}
                  max={10000}
                  step={100}
                  value={rangeMeters}
                  onChange={(e) => setRangeMeters(Number(e.target.value))}
                />
                <div className="mt-4 flex justify-between text-xs font-medium text-slate-500">
                  <span>100m</span>
                  <span>5km</span>
                  <span>10km</span>
                </div>
              </div>
            </section>
          </div>

          <button
            onClick={() => setSettingsOpen(false)}
            className="mt-6 w-full rounded-2xl bg-blue-500 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/20 transition-transform hover:bg-blue-600 active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </BottomSheet>

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

      {/* Cluster List BottomSheet */}
      <BottomSheet open={!!clusterGems} onClose={() => setClusterGems(null)}>
        {clusterGems && (
          <ClusterList
            gems={clusterGems}
            onClose={() => setClusterGems(null)}
            onGemClick={(gem) => {
              setClusterGems(null);
              routeTo(`/gem/${gem._id}`);
            }}
          />
        )}
      </BottomSheet>
    </div>
  );
}
