import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserData from "@/models/UserData";
import Post from "@/models/Post";
import mongoose from "mongoose";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const [user, userData, postsCount, likesResult, userPosts] = await Promise.all([
    User.findCached(session.user.id),
    UserData.findById(session.user.id),
    Post.countDocuments({ createdBy: session.user.id }),
    Post.aggregate([
      { $match: { createdBy: new mongoose.Types.ObjectId(session.user.id) } },
      { $group: { _id: null, totalLikes: { $sum: { $size: { $ifNull: ["$likes", []] } } } } },
    ]),
    Post.find({ createdBy: session.user.id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const stats = {
    posts: postsCount,
    likes: likesResult[0]?.totalLikes || 0,
  };

  const mergedUser = {
    ...user.toObject(),
    bio: userData?.bio || "",
    pfp: userData?.pfp || "person",
    stats,
    posts: userPosts.map((post) => ({
      ...post,
      likes: Array.isArray(post.likes) ? post.likes.length : 0,
    })),
  };

  return NextResponse.json(mergedUser);
}
