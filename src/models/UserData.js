import mongoose from "mongoose";

const UserDataSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Same ID as the User model
  bio: { type: String, default: "" },
  pfp: { type: String, default: "person" },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.UserData || mongoose.model("UserData", UserDataSchema, "userData");
