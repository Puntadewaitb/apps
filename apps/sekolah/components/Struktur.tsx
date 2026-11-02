import { Card } from "@tpl/ui";
import type { NodeStruktur } from "../content/profil";

/** Bagan organisasi sebagai daftar bersarang (tebaca screen reader; tanpa gambar). */
export function Struktur({ node, level = 0 }: { node: NodeStruktur; level?: number }) {
  return (
    <li data-testid="node-struktur" data-level={level}>
      <Card className="inline-block min-w-56 py-3">
        <p className="text-sm font-semibold text-primary">{node.jabatan}</p>
        <p className="text-fg">{node.nama}</p>
      </Card>
      {node.anak.length > 0 && (
        <ul className="ml-4 mt-3 space-y-3 border-l-2 border-primary/30 pl-5 sm:ml-8">
          {node.anak.map((a) => (
            <Struktur key={`${a.jabatan}-${a.nama}`} node={a} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
