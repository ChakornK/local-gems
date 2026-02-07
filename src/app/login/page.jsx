"use client";

import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  return (
    <main className="h-dvh flex w-screen flex-col overflow-clip bg-slate-900 text-slate-50">
      <div className="flex grow flex-col items-stretch p-8">
        <h1 className="text-3xl font-semibold">Sign in to Local Gems</h1>
        <button
          onClick={async () => {
            await signIn.social({
              provider: "google",
              callbackURL: "/",
            });
          }}
          className="bg-white text-slate-950"
        >
          Sign in with Google
        </button>
      </div>
    </main>
  );
}
