import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  description: String,
  image: String,
  lat: Number,
  lng: Number,
  likes: { type: Number, default: 0 },
});

export const MAX_POSTS_RADIUS = 5000; // 5km

export default mongoose.models.Post || mongoose.model("Post", PostSchema, "post");
