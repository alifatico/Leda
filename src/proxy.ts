import { NextResponse, type NextRequest } from "next/server";
import { professions } from "@/lib/professions";

const slugs = new Set(professions.map((p) => p.slug));

/**
 * Unknown profession slugs get a real 404 (Cache Components streams the shell
 * before the page can call notFound(), which would make it a soft 404).
 */
export function proxy(req: NextRequest) {
  const slug = req.nextUrl.pathname.split("/")[2] ?? "";
  if (!slugs.has(slug)) {
    return NextResponse.rewrite(new URL("/404-not-found", req.url), { status: 404 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/preventivo/:slug"] };
