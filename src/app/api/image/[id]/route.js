import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { session } from "@/lib/session";

export async function GET(req, { params }) {
  const s = await session();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await dbConnect();
    const post = await Post.findById(id).populate("createdBy", "name").lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const likesCount = (post.likes || []).length;
    const isLiked = post.likes?.some((uid) => uid.toString() === s.user.id);

    return NextResponse.json({
      ...post,
      likes: likesCount,
      isLiked,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
