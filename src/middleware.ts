import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublic = createRouteMatcher([
  "/",
  "/login(.*)",
  "/registro(.*)",
  "/aplicar(.*)",
  "/eventos(.*)",
  "/sso-callback(.*)",
  "/robots.txt",
  "/sitemap.xml",
]);

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get("host") || "";
  if (
    process.env.VERCEL_ENV === "production" &&
    host.endsWith(".vercel.app")
  ) {
    const dest = new URL(req.url);
    dest.protocol = "https:";
    dest.host = "www.connectainf.com";
    dest.port = "";
    return NextResponse.redirect(dest, 308);
  }

  if (!isPublic(req)) {
    const { userId } = await auth();
    if (!userId) {
      // Avoid Clerk protect-rewrite → opaque 404/error on /after-auth/*
      const login = new URL("/login", req.url);
      const next = `${req.nextUrl.pathname}${req.nextUrl.search}`;
      if (next.startsWith("/") && !next.startsWith("//")) {
        login.searchParams.set("next", next);
      }
      return NextResponse.redirect(login);
    }
  }

  // Role-based redirects happen in layouts after profile load
  // /pendiente and /rechazado require auth but skip approval gate in pages
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
