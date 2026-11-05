// Sample statis company-profile. Konten sudah berbasis file (content/*) dan semua halaman memakai
// generateStaticParams, jadi tidak perlu DB. Yang disesuaikan:
//  - awalan bahasa: di versi lengkap proxy.ts me-rewrite ID tanpa awalan (/layanan → /id/layanan); hosting statis tidak
//    punya rewrite, jadi SEMUA bahasa berawalan (/id/…, /en/…) dan `/` mengalihkan ke /id/
//  - filter portofolio ?kategori= → halaman statis /portofolio/kategori/<id>/ (sama seperti blog)
//  - form kontak → simulasi (localStorage, skema validasi sama)
const config = {
  remove: [
    "lib/db.ts",
    "lib/env.ts",
    "lib/limiters.ts",
    "lib/mailer.ts",
    "lib/csv.ts",
    "lib/request.ts",
    "lib/admin-auth.ts",
    "lib/admin-session.ts",
    "app/og",
  ],
  patches: [
    {
      file: "lib/i18n.ts",
      find: 'return lang === DEFAULT_LANG ? "" : `/${lang}`;',
      replace: "return `/${lang}`;",
    },
    // Rute OG (ImageResponse) tidak diekspor → arahkan ke gambar statis agar tak ada URL og:image yang 404.
    {
      file: "lib/seo.ts",
      find: "export const ogImagePath = (lang: Lang) => `/og/${lang}`;",
      replace: 'export const ogImagePath = (_lang: Lang) => "/img/hero.svg";',
    },
    {
      file: "components/KontakForm.tsx",
      find: 'import { Button, FormField } from "@tpl/ui";',
      replace:
        'import { Button, FormField } from "@tpl/ui";\nimport { demoFetch } from "../lib/demo-api";',
    },
    {
      file: "components/KontakForm.tsx",
      find: 'await fetch("/api/kontak"',
      replace: 'await demoFetch("/api/kontak"',
    },
    // Tautan internal di dalam artikel (markdown) yang tak berawalan bahasa = Indonesia → proxy.ts tidak ada, tambahkan /id.
    {
      file: "components/Markdown.tsx",
      find: "            href={n.href}\n",
      replace:
        '            href={n.href.startsWith("/") && !/^\\/(id|en)(\\/|$)/.test(n.href) ? `/id${n.href}` : n.href}\n',
    },
    // Portofolio: halaman tidak lagi membaca searchParams; kategori datang sebagai prop dari halaman statis.
    {
      file: "app/(site)/[lang]/portofolio/page.tsx",
      find: "  searchParams: Promise<{ kategori?: string | string[] }>;\n",
      replace: "  kategori?: string;\n",
    },
    {
      file: "app/(site)/[lang]/portofolio/page.tsx",
      find: "export default async function PortofolioPage({ params, searchParams }: Props) {",
      replace: "export async function PortofolioIsi({ params, kategori }: Props) {",
    },
    {
      file: "app/(site)/[lang]/portofolio/page.tsx",
      find: "kategoriValid((await searchParams).kategori, lang)",
      replace: "kategoriValid(kategori, lang)",
    },
    {
      file: "app/(site)/[lang]/portofolio/page.tsx",
      find: "href={`${dasar}?kategori=${c.id}`}",
      replace: "href={`${dasar}/kategori/${c.id}`}",
    },
    {
      file: "app/(site)/[lang]/portofolio/page.tsx",
      find: "      <Ajakan lang={lang} />\n    </main>\n  );\n}",
      replace:
        '      <Ajakan lang={lang} />\n    </main>\n  );\n}\n\nexport default function PortofolioPage({ params }: Pick<Props, "params">) {\n  return PortofolioIsi({ params });\n}',
    },
  ],
};

export default config;
