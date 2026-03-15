import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - login, register
     * - api (auth routes, etc.)
     * - _next (Next.js internals)
     * - favicon, other static files
     */
    "/((?!login|register|api|_next|favicon).*)",
  ],
};
