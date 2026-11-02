import { SESSION_COOKIE } from "../../../../lib/admin-session";
import { isSameOrigin } from "../../../../lib/request";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return new Response("Permintaan ditolak.", { status: 403 });
  return new Response(null, {
    status: 303,
    headers: {
      Location: "/admin/login",
      "Cache-Control": "no-store",
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
    },
  });
}
