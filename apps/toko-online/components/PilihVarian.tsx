"use client";

import { useState } from "react";
import { Badge } from "@tpl/ui";
import { rupiah } from "../lib/format";

export type VarianTampil = { id: number; name: string; harga: number; stock: number };

/** Pilihan varian: harga & stok mengikuti varian terpilih. Varian habis tidak bisa dipilih. */
export function PilihVarian({
  varian,
  hargaDasar,
}: {
  varian: VarianTampil[];
  hargaDasar: number;
}) {
  const awal = varian.find((v) => v.stock > 0) ?? varian[0];
  const [id, setId] = useState(awal?.id);
  const v = varian.find((x) => x.id === id) ?? awal;
  if (!v)
    return (
      <div>
        <p className="text-3xl font-bold text-primary" data-testid="harga-terpilih">
          {rupiah(hargaDasar)}
        </p>
        <p className="mt-4 text-sm" data-testid="stok">
          <Badge tone="danger">Stok habis</Badge>
        </p>
      </div>
    );
  const tunggal = varian.length === 1;
  return (
    <div>
      <p
        className="text-3xl font-bold text-primary"
        data-testid="harga-terpilih"
        aria-live="polite"
      >
        {rupiah(v.harga)}
      </p>
      {!tunggal && (
        <fieldset className="mt-5">
          <legend className="text-sm font-medium text-fg">Pilih varian</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {varian.map((x) => (
              <label
                key={x.id}
                className={`cursor-pointer rounded-md border px-4 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${x.stock <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="varian"
                  value={x.id}
                  checked={x.id === v.id}
                  disabled={x.stock <= 0}
                  onChange={() => setId(x.id)}
                  className="sr-only"
                />
                {x.name}
                {x.stock <= 0 && <span className="ml-1 text-xs">(habis)</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <p className="mt-4 text-sm" data-testid="stok" aria-live="polite">
        {v.stock <= 0 ? (
          <Badge tone="danger">Stok habis</Badge>
        ) : v.stock <= 10 ? (
          <Badge tone="danger">Tersisa {v.stock}</Badge>
        ) : (
          <span className="text-muted">Stok tersedia: {v.stock}</span>
        )}
        {!tunggal && <span className="sr-only"> untuk varian {v.name}</span>}
      </p>
    </div>
  );
}
