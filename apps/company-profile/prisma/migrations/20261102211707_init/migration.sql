-- CreateTable
CREATE TABLE "Pesan" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telepon" TEXT NOT NULL DEFAULT '',
    "layanan" TEXT NOT NULL DEFAULT '',
    "isi" TEXT NOT NULL,
    "emailTerkirim" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Pesan_createdAt_idx" ON "Pesan"("createdAt");
