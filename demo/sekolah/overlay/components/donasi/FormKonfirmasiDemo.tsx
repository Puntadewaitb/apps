"use client";

import { kirimKonfirmasiDemo } from "../../lib/demo-donasi";
import { FormKonfirmasi } from "./FormKonfirmasi";

export function FormKonfirmasiDemo({ slug, minimal }: { slug: string; minimal: number }) {
  return <FormKonfirmasi action={kirimKonfirmasiDemo} slug={slug} minimal={minimal} />;
}
