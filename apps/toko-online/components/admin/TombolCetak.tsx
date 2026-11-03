"use client";

import { Button } from "@tpl/ui";

export function TombolCetak() {
  return (
    <Button type="button" onClick={() => window.print()} className="print:hidden">
      Cetak / simpan PDF
    </Button>
  );
}
