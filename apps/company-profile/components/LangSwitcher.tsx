"use client";

import { usePathname } from "next/navigation";
import { LANGS, localizeHref, stripLang, type Lang } from "../lib/i18n";

type Props = {
  lang: Lang;
  labels: { ganti: string; id: string; en: string };
};

/** Pilihan bahasa: tautan biasa ke halaman yang sama di bahasa lain (jalan tanpa JavaScript). */
export function LangSwitcher({ lang, labels }: Props) {
  const path = stripLang(usePathname() || "/");
  return (
    <nav
      aria-label={labels.ganti}
      data-testid="ganti-bahasa"
      className="flex items-center gap-1 max-md:px-2 max-md:py-2"
    >
      {LANGS.map((l) => {
        const aktif = l === lang;
        return (
          <a
            key={l}
            href={localizeHref(l, path)}
            lang={l}
            hrefLang={l}
            aria-current={aktif ? "true" : undefined}
            title={labels[l]}
            className={`rounded-md px-2 py-1 text-sm font-semibold ${
              aktif ? "bg-primary text-primary-fg" : "text-muted hover:bg-surface hover:text-fg"
            }`}
          >
            {l.toUpperCase()}
            <span className="sr-only"> — {labels[l]}</span>
          </a>
        );
      })}
    </nav>
  );
}
