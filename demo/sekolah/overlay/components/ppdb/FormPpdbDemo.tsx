"use client";

// OVERLAY sample statis: halaman server tidak bisa meneruskan fungsi ke komponen klien (server action tidak ada),
// jadi action simulasi diberikan dari komponen klien ini.
import { daftarPpdbDemo } from "../../lib/demo-ppdb";
import { FormPpdb } from "./FormPpdb";

export function FormPpdbDemo() {
  return <FormPpdb action={daftarPpdbDemo} />;
}
