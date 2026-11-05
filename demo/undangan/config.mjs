// Sample statis undangan. Halaman dirender dari data SEED (DB sementara saat build); RSVP & ucapan disimulasikan
// di localStorage peramban dengan skema validasi yang sama; ?to= / ?kode= dibaca di klien.
const config = {
  db: true,
  seed: "prisma/seed.ts",
  keep: ["prisma", "prisma.config.ts"],
  remove: [
    "lib/api.ts",
    "lib/admin-auth.ts",
    "lib/admin-session.ts",
    "lib/limiters.ts",
    "lib/request.ts",
    "lib/csv.ts",
  ],
  patches: [
    // Cover: nama tamu dari URL (?to= / ?kode=) setelah hydration.
    {
      file: "components/Cover.tsx",
      find: 'import { Button } from "@tpl/ui";',
      replace:
        'import { Button } from "@tpl/ui";\nimport { useGuestName } from "../lib/tamu-demo";',
    },
    {
      file: "components/Cover.tsx",
      find: 'export function Cover({ guestName, judul, nama, dateText, audioSrc = "/audio/latar.wav" }: Props) {',
      replace:
        'export function Cover({\n  guestName: serverName,\n  judul,\n  nama,\n  dateText,\n  audioSrc = "/audio/latar.wav",\n}: Props) {\n  const guestName = useGuestName(serverName);',
    },
    // RSVP: isian awal/kode/maks. orang dari URL; kirim → simulasi lokal.
    {
      file: "components/RsvpForm.tsx",
      find: 'import { Button, FormField, Section } from "@tpl/ui";',
      replace:
        'import { Button, FormField, Section } from "@tpl/ui";\nimport { demoFetch } from "../lib/demo-api";\nimport { useTamuForm } from "../lib/tamu-demo";',
    },
    {
      file: "components/RsvpForm.tsx",
      find: 'export function RsvpForm({ defaultName = "", kode, maxPax }: Props) {',
      replace:
        'export function RsvpForm({ defaultName: dn = "", kode: k, maxPax: mp }: Props) {\n  const { defaultName, kode, maxPax } = useTamuForm({ defaultName: dn, kode: k, maxPax: mp });',
    },
    {
      file: "components/RsvpForm.tsx",
      find: 'await fetch("/api/rsvp"',
      replace: 'await demoFetch("/api/rsvp"',
    },
    {
      file: "components/RsvpForm.tsx",
      find: "defaultValue={defaultName}",
      replace: "key={defaultName} defaultValue={defaultName}",
    },
    // Ucapan: simulasi lokal.
    {
      file: "components/Ucapan.tsx",
      find: 'import { Button, Card, FormField, Section } from "@tpl/ui";',
      replace:
        'import { Button, Card, FormField, Section } from "@tpl/ui";\nimport { demoFetch } from "../lib/demo-api";\nimport { useNamaIsian } from "../lib/tamu-demo";',
    },
    {
      file: "components/Ucapan.tsx",
      find: 'export function Ucapan({ initial, nextCursor: initialCursor, defaultName = "" }: Props) {',
      replace:
        'export function Ucapan({ initial, nextCursor: initialCursor, defaultName: dn = "" }: Props) {\n  const defaultName = useNamaIsian(dn);',
    },
    { file: "components/Ucapan.tsx", find: "await fetch(", replace: "await demoFetch(", all: true },
    {
      file: "components/Ucapan.tsx",
      find: "defaultValue={defaultName}",
      replace: "key={defaultName} defaultValue={defaultName}",
    },
    // Ucapan milik pengunjung (localStorage) tampil segera setelah muat, bukan menunggu polling 15 dtk.
    {
      file: "components/Ucapan.tsx",
      find: "const id = setInterval(tick, POLL_MS);",
      replace: "void tick();\n    const id = setInterval(tick, POLL_MS);",
    },
    // Kalender: berkas .ics statis dibuat saat build (overlay app/kalender.ics/route.ts).
    {
      file: "components/DetailAcara.tsx",
      find: 'href="/api/kalender"',
      replace: 'href="/kalender.ics"',
    },
  ],
};

export default config;
