import { messageSchema, nameSchema, phoneIdSchema } from "@tpl/core";
import { z } from "zod";

export const leadSchema = z.object({
  name: nameSchema,
  phone: phoneIdSchema,
  message: messageSchema({ min: 0, max: 1000 }),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** Ubah ZodError menjadi { field: pesanPertama } untuk ditampilkan di form. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
