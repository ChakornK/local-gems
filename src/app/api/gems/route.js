// src/app/api/gems/route.js
export const dynamic = "force-dynamic";

// Simple in-memory store (resets when server restarts)
globalThis.__LOCAL_GEMS__ = globalThis.__LOCAL_GEMS__ || [
  // Uncomment to seed demo gems:
  // { id: "1", lat: 49.2608, lng: -123.2509, note: "Great sunset spot 🌅", imageUrl: "", appraisals: 3 },
];

function getStore() {
  return globalThis.__LOCAL_GEMS__;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radiusMeters = Number(searchParams.get("radiusMeters") || 1000);

  const gems = getStore();

  // If no coords provided, just return all (safe for demo)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ gems });
  }

  // Filter within radius (rough but good enough for hackathon)
  const filtered = gems.filter((g) => {
    const dLat = (g.lat - lat) * 111_000;
    const dLng = (g.lng - lng) * 111_000 * Math.cos((lat * Math.PI) / 180);
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);
    return dist <= radiusMeters;
  });

  return Response.json({ gems: filtered });
}

export async function POST(request) {
  const contentType = request.headers.get("content-type") || "";
  const gems = getStore();

  // Expect multipart/form-data from your UI
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const lat = Number(form.get("lat"));
    const lng = Number(form.get("lng"));
    const note = String(form.get("note") || "").trim();
    const photo = form.get("photo"); // File | null

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !note) {
      return new Response("Invalid payload", { status: 400 });
    }

    const id = String(Date.now());
    const gem = {
      id,
      lat,
      lng,
      note,
      // For demo: we are not storing the image anywhere yet
      // When you add storage later, return a real URL here.
      imageUrl: photo && typeof photo === "object" ? "" : "",
      appraisals: 0,
      createdAt: new Date().toISOString(),
    };

    gems.unshift(gem);
    return Response.json({ gem }, { status: 201 });
  }

  // Optional JSON support
  const body = await request.json().catch(() => null);
  if (!body) return new Response("Invalid payload", { status: 400 });

  const { lat, lng, note } = body;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !note) {
    return new Response("Invalid payload", { status: 400 });
  }

  const id = String(Date.now());
  const gem = { id, lat, lng, note: String(note), imageUrl: "", appraisals: 0 };
  gems.unshift(gem);
  return Response.json({ gem }, { status: 201 });
}