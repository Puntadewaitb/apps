import { blog } from "../content/blog.id";

/** Navigasi kategori (tautan ke /blog atau /blog/kategori/<id>) — jalan tanpa JavaScript. */
export function BlogFilter({ aktif }: { aktif?: string }) {
  const chip = (on: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm font-medium ${
      on
        ? "border-primary bg-primary text-primary-fg"
        : "border-border bg-bg text-fg hover:bg-surface"
    }`;
  return (
    <nav aria-label={blog.filterLabel} className="mb-8 flex flex-wrap gap-2">
      <a href="/blog" aria-current={aktif ? undefined : "true"} className={chip(!aktif)}>
        {blog.semua}
      </a>
      {blog.kategori.map((k) => (
        <a
          key={k.id}
          href={`/blog/kategori/${k.id}`}
          aria-current={aktif === k.id ? "true" : undefined}
          className={chip(aktif === k.id)}
        >
          {k.nama}
        </a>
      ))}
    </nav>
  );
}
