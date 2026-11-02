export const TEMA = ["elegan", "floral", "islami"] as const;
export type Tema = (typeof TEMA)[number];
export const TEMA_DEFAULT: Tema = "floral";

/** Nilai tema dari DB/konfigurasi; nilai tak dikenal → default. */
export function resolveTema(value: string | null | undefined): Tema {
  const v = value?.trim().toLowerCase();
  return (TEMA as readonly string[]).includes(v ?? "") ? (v as Tema) : TEMA_DEFAULT;
}
