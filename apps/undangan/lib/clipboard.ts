/** Dependensi yang bisa diganti (untuk uji): API clipboard modern & fallback execCommand. */
export type ClipboardDeps = {
  writeText?: (text: string) => Promise<void>;
  /** Fallback lama: salin lewat elemen tersembunyi + execCommand("copy"). Mengembalikan true bila berhasil. */
  legacyCopy?: (text: string) => boolean;
};

/**
 * Salin teks ke clipboard. Urutan: Clipboard API → fallback execCommand.
 * Mengembalikan true/false (tidak melempar) agar UI bisa menampilkan pesan yang tepat.
 */
export async function copyText(text: string, deps: ClipboardDeps): Promise<boolean> {
  if (deps.writeText) {
    try {
      await deps.writeText(text);
      return true;
    } catch {
      /* izin ditolak / konteks tidak aman → coba fallback */
    }
  }
  try {
    return deps.legacyCopy?.(text) ?? false;
  } catch {
    return false;
  }
}

/** Dependensi nyata dari browser. */
export function browserClipboardDeps(): ClipboardDeps {
  return {
    writeText:
      typeof navigator !== "undefined" && navigator.clipboard?.writeText
        ? (t) => navigator.clipboard.writeText(t)
        : undefined,
    legacyCopy: (t) => {
      const ta = document.createElement("textarea");
      ta.value = t;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try {
        return document.execCommand("copy");
      } finally {
        document.body.removeChild(ta);
      }
    },
  };
}
