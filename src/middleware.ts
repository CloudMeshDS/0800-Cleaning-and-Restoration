import { NextResponse, type NextRequest } from "next/server";

const WWW = "www.0800cleaningandrestoration.co.nz";
const APEX = "0800cleaningandrestoration.co.nz";

/**
 * One official, encrypted address:
 *  - plain-HTTP requests to the domain are upgraded to HTTPS
 *  - the bare domain is sent to www
 * Both are permanent (308) redirects that keep the path and query.
 */
export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host !== WWW && host !== APEX) return NextResponse.next();
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  if (host === APEX || proto === "http") {
    const url = new URL(req.url);
    url.protocol = "https:";
    url.host = WWW;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = { matcher: "/:path*" };
