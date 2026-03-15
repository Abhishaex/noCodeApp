import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// No auth required — app is open to everyone
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon).*)"],
};
