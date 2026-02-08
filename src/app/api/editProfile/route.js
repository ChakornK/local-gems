import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserData from "@/models/UserData";

export async function POST(req) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bio, pfp } = await req.json();

  const updates = {};
  if (typeof bio === "string") updates.bio = bio;
  if (typeof pfp === "string") updates.pfp = pfp;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  await dbConnect();

  let userData = await UserData.findById(session.user.id);
  if (!userData) {
    // Should have been created by auth hook, but fallback just in case
    userData = new UserData({ _id: session.user.id });
  }

  Object.assign(userData, updates);
  userData.updatedAt = new Date();
  await userData.save();

  const user = await User.findById(session.user.id);

  const mergedUser = {
    ...user.toObject(),
    bio: userData.bio,
    pfp: userData.pfp,
  };

  return NextResponse.json({ message: "Profile updated successfully", user: mergedUser });
}
