"use client";

import { Button } from "@tpl/ui";

/** Tombol hapus dengan konfirmasi (window.confirm). Tanpa JS tetap mengirim form (aksi server tetap memeriksa hak akses). */
export function HapusButton({
  label = "Hapus",
  konfirmasi,
}: {
  label?: string;
  konfirmasi: string;
}) {
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="!text-danger"
      onClick={(e) => {
        if (!window.confirm(konfirmasi)) e.preventDefault();
      }}
    >
      {label}
    </Button>
  );
}
