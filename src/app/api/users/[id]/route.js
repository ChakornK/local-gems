import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserData from "@/models/UserData";

export async function GET(req, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  await dbConnect();

  try {
    const [user, userData] = await Promise.all([User.findCached(id), UserData.findById(id)]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const publicProfile = {
      _id: user._id,
      name: user.name,
      bio: userData?.bio || "",
      pfp: userData?.pfp || "person",
      image: user.image,
    };

    return NextResponse.json(publicProfile);
  } catch (error) {
    return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
  }
}
