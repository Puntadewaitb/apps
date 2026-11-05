// Konfigurasi sample statis landing-page. Bagian server dibuang; form kontak diganti overlay (simulasi).
const config = {
  remove: [
    "lib/db.ts",
    "lib/admin-auth.ts",
    "lib/admin-session.ts",
    "lib/limiters.ts",
    "lib/request.ts",
    "lib/csv.ts",
    "lib/env.ts",
  ],
};

export default config;
