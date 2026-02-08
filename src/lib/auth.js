"server-only";

import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import User from "@/models/User";
import UserData from "@/models/UserData";
import dbConnect from "./mongodb";
import { redisAdapter, storeUser, removeUser } from "./redisAdapter";

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
  trustedOrigins: ["http://localhost:3000", process.env.BETTER_AUTH_BASE_URL],
  baseURL: process.env.BETTER_AUTH_BASE_URL,
  database: mongodbAdapter(db, {
    client,
  }),
  secondaryStorage: redisAdapter,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_OAUTH_ID,
      clientSecret: process.env.GOOGLE_OAUTH_SECRET,
      prompt: "consent",
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          await dbConnect();

          // Ensure UserData exists
          const existingData = await UserData.findById(session.userId);
          if (!existingData) {
            await UserData.create({ _id: session.userId });
          }

          let user = await User.findCached(session.userId);
          if (user) {
            await storeUser(session.userId, user);
          }
        },
      },
      update: {
        after: async (session) => {
          await dbConnect();
          const user = await User.findCached(session.userId);
          if (user) {
            await storeUser(session.userId, user);
          }
        },
      },
      delete: {
        after: async (session) => {
          await removeUser(session.userId);
        },
      },
    },
  },
});
