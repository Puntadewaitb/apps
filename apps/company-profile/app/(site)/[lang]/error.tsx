"use client";

import { useParams } from "next/navigation";
import { Button, Container } from "@tpl/ui";
import { isLang } from "../../../lib/i18n";
import { ui as uiEn } from "../../../content/ui.en";
import { ui as uiId } from "../../../content/ui.id";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useParams<{ lang?: string }>();
  const u = (isLang(lang) && lang === "en" ? uiEn : uiId).error;
  return (
    <main className="py-24">
      <Container className="max-w-xl text-center">
        <h1 className="text-3xl font-bold text-fg">{u.judul}</h1>
        <p className="mt-3 text-muted">{u.teks}</p>
        <Button className="mt-8" onClick={() => reset()}>
          {u.ulangi}
        </Button>
      </Container>
    </main>
  );
}
