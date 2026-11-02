import { db } from "./db";

export const WISH_PAGE_SIZE = 20;

export type WishItem = { id: number; name: string; message: string; createdAt: string };

/** Ucapan yang tampil (visible) untuk acara, terbaru dulu; cursor = id terakhir dari halaman sebelumnya. */
export async function listVisibleWishes(
  eventId: number,
  cursor?: number,
): Promise<{ items: WishItem[]; nextCursor: number | null }> {
  const rows = await db().wish.findMany({
    where: { eventId, visible: true, ...(cursor ? { id: { lt: cursor } } : {}) },
    orderBy: { id: "desc" },
    take: WISH_PAGE_SIZE + 1,
    select: { id: true, name: true, message: true, createdAt: true },
  });
  const page = rows.slice(0, WISH_PAGE_SIZE);
  return {
    items: page.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    nextCursor: rows.length > WISH_PAGE_SIZE ? (page[page.length - 1]?.id ?? null) : null,
  };
}
