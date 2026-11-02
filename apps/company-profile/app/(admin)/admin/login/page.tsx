import type { Metadata } from "next";
import { Button, Card, Container, FormField } from "@tpl/ui";
import { adminConfig } from "../../../../lib/env";

export const metadata: Metadata = { title: "Masuk Admin", robots: { index: false, follow: false } };

const messages: Record<string, string> = {
  salah: "Password salah.",
  "terlalu-banyak": "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
  nonaktif: "Login admin dinonaktifkan: ADMIN_PASSWORD / ADMIN_SESSION_SECRET belum diatur.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const disabled = adminConfig() === null;
  const message = error ? messages[error] : disabled ? messages.nonaktif : undefined;
  return (
    <main className="py-16">
      <Container className="max-w-md">
        <Card>
          <h1 className="text-2xl font-bold text-fg">Masuk Admin</h1>
          {message && (
            <p role="alert" className="mt-3 text-sm text-danger">
              {message}
            </p>
          )}
          <form method="post" action="/api/admin/login" className="mt-5 space-y-4">
            <FormField label="Password" required>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-md border border-border bg-bg px-3 py-2"
              />
            </FormField>
            <Button type="submit" disabled={disabled}>
              Masuk
            </Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}
