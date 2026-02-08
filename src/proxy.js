import { session } from "@/lib/session";
import { NextResponse } from "next/server";

export default async function proxy(req) {
  const path = req.nextUrl.pathname;

  const s = await session();

  if (!s?.session?.userId && path !== "/login") {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Proxy should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
