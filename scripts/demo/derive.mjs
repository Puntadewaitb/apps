// Turunkan modul "murni" (tanpa DB) dari modul sumber yang mencampur logika murni dan akses DB.
//
// Mis. lib/katalog.ts berisi parseUrut/urutkan/paginasi (murni, dipakai komponen klien di sample statis) bersama
// cariProduk (Prisma). Sample statis tidak boleh membawa Prisma ke bundel klien, tetapi menyalin fungsi murni
// secara manual berisiko drift. Solusi: ekstrak deklarasi top-level BERNAMA dari sumber asli lewat AST, sehingga
// logika selalu sama dengan app asli. Nama yang diminta tak ada → GAGAL KERAS (struktur sumber berubah).
import ts from "typescript";

function namesOf(st) {
  if (ts.isVariableStatement(st))
    return st.declarationList.declarations.flatMap((d) =>
      ts.isIdentifier(d.name) ? [d.name.text] : [],
    );
  if (
    ts.isFunctionDeclaration(st) ||
    ts.isClassDeclaration(st) ||
    ts.isInterfaceDeclaration(st) ||
    ts.isTypeAliasDeclaration(st) ||
    ts.isEnumDeclaration(st)
  )
    return st.name ? [st.name.text] : [];
  return [];
}

/**
 * @param {string} source isi file .ts/.tsx
 * @param {{ names: string[], dropImports?: string[] }} opts
 *   names       deklarasi top-level yang dipertahankan (fungsi, const, type, interface)
 *   dropImports modul yang impornya dibuang seluruhnya (mis. "react", "./db")
 * @returns {string}
 */
export function deriveModule(source, { names, dropImports = [] }) {
  const sf = ts.createSourceFile(
    "derive.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const want = new Set(names);
  const found = new Set();
  const parts = [];
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) {
      const mod = ts.isStringLiteral(st.moduleSpecifier) ? st.moduleSpecifier.text : "";
      if (!dropImports.includes(mod)) parts.push(st.getText(sf));
      continue;
    }
    const ns = namesOf(st);
    if (ns.some((n) => want.has(n))) {
      ns.forEach((n) => found.add(n));
      // getFullText menyertakan komentar JSDoc di depan deklarasi.
      parts.push(st.getFullText(sf).replace(/^\s*\n/, ""));
    }
  }
  const hilang = names.filter((n) => !found.has(n));
  if (hilang.length)
    throw new Error(`derive: deklarasi tidak ditemukan di sumber: ${hilang.join(", ")}`);
  return `// DIHASILKAN oleh scripts/demo/derive.mjs dari modul sumber — jangan diedit.\n${parts.join("\n")}\n`;
}
