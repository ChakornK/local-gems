import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserData from "@/models/UserData";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const [user, userData] = await Promise.all([User.findCached(session.user.id), UserData.findById(session.user.id)]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const mergedUser = {
    ...user.toObject(),
    bio: userData?.bio || "",
    pfp: userData?.pfp || "person",
  };

  return NextResponse.json(mergedUser);
}
