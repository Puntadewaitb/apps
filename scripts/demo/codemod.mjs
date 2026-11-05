// Codemod untuk build "sample statis": membungkus atribut tautan/gambar pada elemen intrinsik
// (<a href>, <img src>, <source src/srcSet>, <video poster/src>, <link href>) dengan withBase() dari @tpl/ui,
// sehingga URL root-relatif ("/produk", "/img/x.svg") mendapat base path (mis. /apps/toko-online) saat
// di-hosting di sub-path GitHub Pages.
//
// Berbasis AST (TypeScript compiler) — bukan regex — sehingga ekspresi (`href={`/produk/${slug}`}`,
// `src={p.image}`, `href={x ? "/a" : "/b"}`) ikut tertangani. Dijalankan HANYA pada salinan di .demo/;
// kode sumber app tidak pernah diubah.
import ts from "typescript";

/** elemen -> atribut yang berisi URL */
export const URL_ATTRS = {
  a: ["href"],
  img: ["src", "srcSet"],
  source: ["src", "srcSet"],
  video: ["src", "poster"],
  audio: ["src"],
  link: ["href"],
  form: ["action"],
};

/** Elemen yang atributnya hanya boleh dibungkus bila berupa literal string (action={fungsi} = server action). */
const HANYA_LITERAL = new Set(["form"]);

function tagOf(node) {
  const n = node.tagName;
  return ts.isIdentifier(n) ? n.text : undefined; // hanya elemen intrinsik huruf kecil (a, img, ...)
}

/**
 * @param {string} source isi file .tsx
 * @param {string} fileName
 * @returns {{ code: string, wrapped: number }}
 */
export function wrapUrlAttributes(source, fileName = "file.tsx") {
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  /** @type {{start:number,end:number,text:string}[]} */
  const edits = [];

  const visit = (node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = tagOf(node);
      const attrs = tag ? URL_ATTRS[tag] : undefined;
      if (attrs) {
        for (const prop of node.attributes.properties) {
          if (!ts.isJsxAttribute(prop) || !ts.isIdentifier(prop.name)) continue;
          if (!attrs.includes(prop.name.text) || !prop.initializer) continue;
          const init = prop.initializer;
          if (ts.isStringLiteral(init)) {
            // href="/x" → href={withBase("/x")} ; literal non-root-relatif dibiarkan.
            if (!init.text.startsWith("/") || init.text.startsWith("//")) continue;
            edits.push({
              start: init.getStart(sf),
              end: init.getEnd(),
              text: `{withBase(${JSON.stringify(init.text)})}`,
            });
          } else if (!HANYA_LITERAL.has(tag) && ts.isJsxExpression(init) && init.expression) {
            const e = init.expression;
            if (ts.isStringLiteralLike(e) && !e.text.startsWith("/")) continue; // literal absolut/anchor
            edits.push({
              start: e.getStart(sf),
              end: e.getEnd(),
              text: `withBase(${e.getText(sf)})`,
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  if (edits.length === 0) return { code: source, wrapped: 0 };

  let code = source;
  for (const ed of edits.sort((a, b) => b.start - a.start)) {
    code = code.slice(0, ed.start) + ed.text + code.slice(ed.end);
  }
  return { code: addImport(code, fileName), wrapped: edits.length };
}

/** Sisipkan `import { withBase } from "@tpl/ui";` setelah import terakhir (dan setelah direktif "use client"). */
function addImport(code, fileName) {
  if (/import\s*{[^}]*\bwithBase\b[^}]*}\s*from\s*["']@tpl\/ui["']/.test(code)) return code;
  const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let pos = 0;
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) pos = st.getEnd();
    else if (
      ts.isExpressionStatement(st) &&
      ts.isStringLiteral(st.expression) &&
      pos === 0 // direktif di paling atas
    )
      pos = st.getEnd();
  }
  const line = '\nimport { withBase } from "@tpl/ui";';
  return code.slice(0, pos) + line + code.slice(pos);
}
