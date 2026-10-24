import { NextResponse, type NextRequest } from "next/server";

/** One official address: send the bare domain to www (permanent redirect). */
export function middleware(req: NextRequest) {
  if (req.headers.get("host") === "0800cleaningandrestoration.co.nz") {
    const url = new URL(req.url);
    url.host = "www.0800cleaningandrestoration.co.nz";
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = { matcher: "/:path*" };
