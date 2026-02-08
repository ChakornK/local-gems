import dbConnect from "@/lib/mongodb"; // adjust path if yours is different
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

function mapPostToGem(p) {
  return {
    id: String(p._id),
    lat: p.lat,
    lng: p.lng,
    note: p.description || "",
    imageUrl: p.image || "",
    appraisals: p.likes ?? 0,
    createdAt: p.createdAt || null,
    createdBy: p.createdBy ? String(p.createdBy) : null,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const lat = toNumber(searchParams.get("lat"));
  const lng = toNumber(searchParams.get("lng"));
  const radiusMeters = toNumber(searchParams.get("radiusMeters")) ?? 1000;

  await dbConnect();

  // Use the raw Mongo collection through mongoose
  // If your collection is named "posts" instead of "post", change it here.
  const posts = mongoose.connection.db.collection("post");

  const raw = await posts
    .find({ lat: { $type: "number" }, lng: { $type: "number" } })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  if (lat === null || lng === null) {
    return Response.json({ gems: raw.map(mapPostToGem) });
  }

  const filtered = raw.filter((p) => {
    const d = haversineMeters(lat, lng, p.lat, p.lng);
    return d <= radiusMeters;
  });

  return Response.json({ gems: filtered.map(mapPostToGem) });
}