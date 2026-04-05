import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

/** Sanity webhook: POST with header x-sanity-revalidate-secret matching env */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-sanity-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  revalidatePath("/", "layout");
  revalidatePath("/blog");
  return NextResponse.json({ revalidated: true, now: Date.now() });
}
