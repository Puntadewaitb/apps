import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, Container } from "@tpl/ui";
import { LoginForm } from "../../../components/admin/LoginForm";
import { amanCallback } from "../../../lib/auth-core";
import { authConfigured } from "../../../lib/env";
import { getAdminUser } from "../../../lib/session";

export const metadata: Metadata = { title: "Masuk" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const sp = await searchParams;
  const cb = amanCallback(Array.isArray(sp.callbackUrl) ? sp.callbackUrl[0] : sp.callbackUrl);
  // Sudah login → langsung ke tujuan (yang sudah divalidasi).
  if (await getAdminUser()) redirect(cb);
  return (
    <main id="isi" className="py-16">
      <Container className="max-w-md">
        <Card>
          <h1 className="text-2xl font-bold text-fg">Masuk Admin</h1>
          <p className="mt-1 text-sm text-muted">Khusus pengelola toko.</p>
          <div className="mt-6">
            <LoginForm callbackUrl={cb} nonaktif={!authConfigured()} />
          </div>
        </Card>
      </Container>
    </main>
  );
}
