import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { wrapUrlAttributes } from "./codemod.mjs";
import { deriveModule } from "./derive.mjs";
import { postProcessHtml } from "./postprocess.mjs";
import { verify } from "./verify.mjs";

describe("codemod wrapUrlAttributes", () => {
  const run = (src) => wrapUrlAttributes(src, "x.tsx");

  it("membungkus literal root-relatif & ekspresi pada elemen intrinsik", () => {
    const { code, wrapped } = run(`export const A = () => (
  <div>
    <a href="/produk">p</a>
    <a href={\`/produk/\${slug}\`}>q</a>
    <img src={p.image} alt="" />
    <img src="/img/x.svg" alt="" />
    <a href={ok ? "/a" : "/b"}>r</a>
  </div>
);`);
    expect(wrapped).toBe(5);
    expect(code).toContain('href={withBase("/produk")}');
    expect(code).toContain("href={withBase(`/produk/${slug}`)}");
    expect(code).toContain("src={withBase(p.image)}");
    expect(code).toContain('src={withBase("/img/x.svg")}');
    expect(code).toContain('withBase(ok ? "/a" : "/b")');
    expect(code).toContain('import { withBase } from "@tpl/ui";');
  });

  it("tidak menyentuh anchor, URL absolut, literal non-root, atau komponen kustom", () => {
    const src = `export const A = () => (<div>
  <a href="#x">a</a><a href="https://wa.me/1">b</a><a href={"mailto:a@b.id"}>c</a>
  <a href="//cdn.id/x">d</a><a href="relatif">e</a><Link href="/produk">f</Link><Card src="/img/a.svg" />
</div>);`;
    const r = run(src);
    expect(r.wrapped).toBe(0);
    expect(r.code).toBe(src);
  });

  it("menaruh import setelah direktif 'use client' dan import yang ada, tidak ganda", () => {
    const { code } = run(`"use client";
import { useState } from "react";
export const A = () => <a href="/x">x</a>;`);
    const lines = code.split("\n");
    expect(lines[0]).toBe('"use client";');
    expect(code.indexOf("withBase } from")).toBeGreaterThan(code.indexOf("react"));
    const again = wrapUrlAttributes(code, "x.tsx");
    expect(again.code.match(/import \{ withBase \}/g)).toHaveLength(1);
  });
});

describe("codemod <form action>", () => {
  it("membungkus action literal, TIDAK menyentuh action={fungsi} (server action)", () => {
    const r = wrapUrlAttributes(
      `export const A = () => (<div><form action="/produk" /><form action={kirim} /><form action={x ? "/a" : "/b"} /></div>);`,
      "x.tsx",
    );
    expect(r.wrapped).toBe(1);
    expect(r.code).toContain('action={withBase("/produk")}');
    expect(r.code).toContain("action={kirim}");
  });
});

describe("deriveModule", () => {
  const src = `import { cache } from "react";
import { db } from "./db";
import { sanitizeText } from "@tpl/core";

/** Urutan halaman. */
export const PER = 12;
export type U = "a" | "b";
/** Murni. */
export function murni(x: string): string {
  return sanitizeText(x) + PER;
}
export const semua = cache(() => db().x.findMany());
export async function cari() {
  return db().y.findMany();
}
`;
  it("hanya mempertahankan deklarasi bernama + komentar JSDoc; membuang impor DB", () => {
    const out = deriveModule(src, {
      names: ["PER", "U", "murni"],
      dropImports: ["react", "./db"],
    });
    expect(out).toContain("export function murni");
    expect(out).toContain("/** Murni. */");
    expect(out).toContain("export const PER = 12;");
    expect(out).toContain("export type U");
    expect(out).toContain('import { sanitizeText } from "@tpl/core";');
    expect(out).not.toMatch(/db\(|cache|cari|semua|from "\.\/db"|from "react"/);
  });
  it("gagal keras bila nama yang diminta tidak ada di sumber", () => {
    expect(() => deriveModule(src, { names: ["murni", "tidakAda"] })).toThrow(/tidakAda/);
  });
});

describe("postProcessHtml", () => {
  it("mengganti meta robots lama dengan noindex di <head>", () => {
    const out = postProcessHtml(
      '<html><head><meta name="robots" content="index, follow"/></head><body></body></html>',
    );
    expect(out).toContain('content="noindex,nofollow"');
    expect(out).not.toContain("index, follow");
    expect(out.match(/name="robots"/g)).toHaveLength(1);
  });
});

describe("verify", () => {
  const tmp = [];
  afterEach(() => tmp.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));
  function dist(files) {
    const d = mkdtempSync(join(tmpdir(), "demo-verify-"));
    tmp.push(d);
    for (const [p, c] of Object.entries(files)) {
      const f = join(d, p);
      mkdirSync(join(f, ".."), { recursive: true });
      writeFileSync(f, c);
    }
    return d;
  }
  const page = (body) =>
    `<html><head><meta name="robots" content="noindex,nofollow"/></head><body><div id="demo-banner"></div>${body}</body></html>`;

  it("lolos untuk situs benar", () => {
    const d = dist({
      "t/index.html": page('<a href="/apps/t/about/">a</a><img src="/apps/t/img/a.svg">'),
      "t/about/index.html": page(""),
      "t/img/a.svg": "<svg/>",
    });
    expect(verify(d, ["t"]).errors).toEqual([]);
  });

  it("mendeteksi URL tanpa base path", () => {
    const d = dist({ "t/index.html": page('<img src="/img/a.svg">') });
    expect(verify(d, ["t"]).errors.join("\n")).toMatch(/tanpa base path/);
  });

  it("mendeteksi tautan putus, rujukan /admin & /api, dan JS yang memanggil /api", () => {
    const d = dist({
      "t/index.html": page(
        '<a href="/apps/t/hilang/">x</a><a href="/apps/t/admin/">y</a><a href="/apps/t/api/leads">z</a>',
      ),
      "t/_next/a.js": 'x=await fetch("/api/leads",{method:"POST"})',
    });
    const e = verify(d, ["t"]).errors.join("\n");
    expect(e).toMatch(/tujuan tidak ada/);
    expect(e).toMatch(/menuju admin\/API/);
    expect(e).toMatch(/JS memanggil fetch\(\/api\/leads/);
  });

  it("string /api biasa (pencocok rute simulator) BUKAN panggilan jaringan", () => {
    const d = dist({
      "t/index.html": page(""),
      "t/_next/a.js": 'if(u.pathname==="/api/rsvp"){return demo("/api/rsvp")}',
    });
    expect(verify(d, ["t"]).errors).toEqual([]);
  });

  it("mendeteksi halaman tanpa noindex atau tanpa banner", () => {
    const d = dist({ "t/index.html": "<html><head></head><body></body></html>" });
    const e = verify(d, ["t"]).errors.join("\n");
    expect(e).toMatch(/noindex/);
    expect(e).toMatch(/banner/);
  });
});
