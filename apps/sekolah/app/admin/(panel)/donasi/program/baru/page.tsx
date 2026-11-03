import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { FormProgram } from "../../../../../../components/admin/FormProgram";
import { requireAdmin } from "../../../../../../lib/session";
import { simpanProgram } from "../../actions";

export const metadata: Metadata = { title: "Program Donasi Baru" };
export const dynamic = "force-dynamic";

export default async function ProgramBaru() {
  await requireAdmin("donasi", "/admin/donasi/program/baru");
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-fg">Program Donasi Baru</h1>
        <FormProgram
          action={simpanProgram}
          nilai={{ title: "", description: "", target: "", deadline: "", active: true, image: "" }}
        />
      </Container>
    </main>
  );
}
