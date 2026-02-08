import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  createdAt: Date,
  description: String,
  image: String,
  lat: Number,
  lng: Number,
});

export const POSTS_RADIUS = 5000; // 5km

export default mongoose.models.Post ||
  mongoose.model("Post", PostSchema, "post");
