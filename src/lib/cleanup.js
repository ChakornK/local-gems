import mongoose from "mongoose";
import { disconnectRedis } from "./redisAdapter";

process.on("SIGTERM", () => {
  try {
    disconnectRedis();
  } catch (e) {
    console.error(e);
  }
  try {
    mongoose.connection.close();
  } catch (e) {
    console.error(e);
  }
});
