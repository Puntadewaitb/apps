import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TEMA } from "./tema";

const css = readFileSync(join(__dirname, "..", "app", "tema.css"), "utf8");

function palet(nama: string): Record<string, string> {
  const blok = new RegExp(`\\[data-theme="${nama}"\\]\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
  return Object.fromEntries(
    [...blok.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1]!, m[2]!]),
  );
}

function lum(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function kontras(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

describe("kontras tema (WCAG AA ≥ 4.5:1)", () => {
  for (const t of TEMA) {
    it(`tema ${t}: token lengkap & pasangan teks/latar memenuhi AA`, () => {
      const p = palet(t);
      for (const k of [
        "primary",
        "primary-fg",
        "accent",
        "bg",
        "surface",
        "fg",
        "muted",
        "border",
      ]) {
        expect(p[k], `${t} ${k}`).toBeTruthy();
      }
      const pasangan: Array<[string, string]> = [
        ["fg", "bg"],
        ["fg", "surface"],
        ["muted", "bg"],
        ["muted", "surface"],
        ["primary-fg", "primary"],
        ["primary", "bg"],
        ["primary", "surface"],
      ];
      for (const [a, b] of pasangan) {
        expect(kontras(p[a]!, p[b]!), `${t}: ${a} di atas ${b}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
