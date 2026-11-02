import { ambilRingkasan } from "../../../../lib/ringkasan";
import { apiAdmin } from "../../../../lib/session";

export const dynamic = "force-dynamic";

/** GET /api/admin/ringkasan — contoh route handler admin: sesi dicek ulang di sini (bukan hanya di proxy). */
export async function GET() {
  const { user, respons } = await apiAdmin("ringkasan");
  if (respons) return respons;
  return Response.json(await ambilRingkasan(user.role), {
    headers: { "Cache-Control": "no-store" },
  });
}
