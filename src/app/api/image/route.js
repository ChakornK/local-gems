import dbConnect from "@/lib/mongodb";
import { session } from "@/lib/session";
import Post from "@/models/Post";
import { NextResponse } from "next/server";
import { uploadToS3 } from "@/lib/s3";

import { cacheData } from "@/lib/redisAdapter";
import { POSTS_RADIUS } from "@/models/Post";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat"));
  const lng = parseFloat(searchParams.get("lng"));

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Invalid latitude or longitude" },
      { status: 400 },
    );
  }

  const s = await session();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  // Round coordinates to ~110m precision (3 decimal places) for caching "similar" locations
  const cacheKey = `posts:nearby:${lat.toFixed(3)}:${lng.toFixed(3)}`;

  try {
    const posts = await cacheData(
      cacheKey,
      async () => {
        // Simple bounding box calculation
        // 1 degree lat ~= 111km
        // 1 degree lng ~= 111km * cos(lat)
        const latDelta = POSTS_RADIUS / 111000;
        const lngDelta =
          POSTS_RADIUS / (111000 * Math.cos(lat * (Math.PI / 180)));

        return await Post.find({
          lat: { $gte: lat - latDelta, $lte: lat + latDelta },
          lng: { $gte: lng - lngDelta, $lte: lng + lngDelta },
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
      },
      60 * 30,
    );

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching nearby posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  const s = await session();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image");
  const lat = parseFloat(formData.get("lat"));
  const lng = parseFloat(formData.get("lng"));
  const description = formData.get("description");

  if (!file || isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileName = `posts/${Date.now()}-${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "",
    )}`;

    // Upload process
    const imageUrl = await uploadToS3(buffer, fileName, file.type);

    await dbConnect();
    const newPost = await Post.create({
      image: imageUrl,
      lat,
      lng,
      description,
      createdAt: new Date(),
    });

    return NextResponse.json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
