import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserData from "@/models/UserData";
import Post from "@/models/Post";
import mongoose from "mongoose";

export async function GET(req, { params }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  await dbConnect();

  try {
    const [user, userData, postsCount, likesResult, userPosts] = await Promise.all([
      User.findCached(id),
      UserData.findById(id),
      Post.countDocuments({ createdBy: id }),
      Post.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
      ]),
      Post.find({ createdBy: id }).sort({ createdAt: -1 }).limit(20),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stats = {
      posts: postsCount,
      likes: likesResult[0]?.totalLikes || 0,
    };

    const publicProfile = {
      _id: user._id,
      name: user.name,
      bio: userData?.bio || "",
      pfp: userData?.pfp || "person",
      image: user.image,
      stats,
      posts: userPosts,
    };

    return NextResponse.json(publicProfile);
  } catch (error) {
    return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
  }
}
