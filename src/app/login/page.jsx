"use client";

import { signIn } from "@/lib/auth-client";
import { Icon } from "@iconify/react";

export default function LoginPage() {
  return (
    <main className="h-dvh flex w-screen flex-col items-center overflow-clip bg-slate-900 text-slate-50">
      <div className="flex max-w-sm grow flex-col items-stretch justify-between gap-4 px-8 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-blue-500 shadow-[0_0_3rem] shadow-blue-600">
            <Icon icon="mingcute:location-2-fill" fontSize={48} />
          </div>
          <h1 className="mt-8 text-3xl font-semibold">Sign in to Local Gems</h1>
          <p className="text-slate-200">Discover what's happening near you</p>
        </div>

        <button
          onClick={async () => {
            await signIn.social({
              provider: "google",
              callbackURL: "/",
            });
          }}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white p-4 font-semibold text-slate-950 transition-colors hover:bg-slate-100"
        >
          <Icon icon="logos:google-icon" fontSize={20} />
          Sign in with Google
        </button>
      </div>
    </main>
  );
}
