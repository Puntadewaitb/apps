-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "jenis" TEXT NOT NULL DEFAULT 'pernikahan',
    "tema" TEXT NOT NULL DEFAULT 'floral',
    "title" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "groomParents" TEXT NOT NULL DEFAULT '',
    "brideParents" TEXT NOT NULL DEFAULT '',
    "akadAt" DATETIME NOT NULL,
    "resepsiAt" DATETIME NOT NULL,
    "venueName" TEXT NOT NULL,
    "venueAddress" TEXT NOT NULL,
    "resepsiVenueName" TEXT NOT NULL DEFAULT '',
    "resepsiVenueAddress" TEXT NOT NULL DEFAULT '',
    "mapsUrl" TEXT NOT NULL DEFAULT '',
    "quote" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Event" ("akadAt", "brideName", "brideParents", "createdAt", "groomName", "groomParents", "id", "mapsUrl", "quote", "resepsiAt", "resepsiVenueAddress", "resepsiVenueName", "slug", "title", "venueAddress", "venueName") SELECT "akadAt", "brideName", "brideParents", "createdAt", "groomName", "groomParents", "id", "mapsUrl", "quote", "resepsiAt", "resepsiVenueAddress", "resepsiVenueName", "slug", "title", "venueAddress", "venueName" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
