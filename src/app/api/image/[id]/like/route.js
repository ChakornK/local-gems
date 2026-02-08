import { session } from "@/lib/session";
import Post from "@/models/Post";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  const s = await session();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const post = await Post.findById(id);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  post.likes += 1;
  await post.save();

  return NextResponse.json({ likes: post.likes }, { status: 200 });
}
