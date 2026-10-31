/** Port dev/prod tiap app (lihat PLAN.md §2). */
export const APP_PORTS = {
  "landing-page": 3001,
  "company-profile": 3002,
  undangan: 3003,
  sekolah: 3004,
  "toko-online": 3005,
} as const;

export type AppName = keyof typeof APP_PORTS;
