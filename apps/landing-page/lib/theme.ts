export const THEMES = ["netral", "hangat", "hijau"] as const;
export type Theme = (typeof THEMES)[number];

/** Tema aktif: env NEXT_PUBLIC_THEME (bila valid) menimpa default di content/site.ts. */
export function resolveTheme(envValue: string | undefined, fallback: Theme): Theme {
  const v = envValue?.trim().toLowerCase();
  return (THEMES as readonly string[]).includes(v ?? "") ? (v as Theme) : fallback;
}
