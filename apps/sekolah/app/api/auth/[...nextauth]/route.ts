import NextAuth from "next-auth";
import { buildAuthOptions } from "../../../../lib/auth";
import { authConfigured } from "../../../../lib/env";

/** Handler NextAuth. Tanpa NEXTAUTH_SECRET valid → 503 (fail closed), bukan crash/sesi tak aman. */
const handler = (req: Request, ctx: unknown) => {
  if (!authConfigured())
    return Response.json(
      { error: "Login dinonaktifkan: NEXTAUTH_SECRET belum diatur." },
      { status: 503 },
    );
  return (NextAuth(buildAuthOptions()) as unknown as (r: Request, c: unknown) => Promise<Response>)(
    req,
    ctx,
  );
};

export { handler as GET, handler as POST };
