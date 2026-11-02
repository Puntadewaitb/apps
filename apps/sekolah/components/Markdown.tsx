import type { ReactNode } from "react";
import { parseMarkdown, type Block, type Inline } from "../lib/markdown";

function inline(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.text;
      case "code":
        return (
          <code key={i} className="rounded bg-surface px-1 py-0.5 font-mono text-[0.9em]">
            {n.text}
          </code>
        );
      case "strong":
        return <strong key={i}>{inline(n.children)}</strong>;
      case "em":
        return <em key={i}>{inline(n.children)}</em>;
      case "link": {
        const luar = n.href.startsWith("https://");
        return (
          <a
            key={i}
            href={n.href}
            {...(luar ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="font-medium text-primary underline underline-offset-2"
          >
            {inline(n.children)}
          </a>
        );
      }
    }
  });
}

function blok(b: Block, i: number): ReactNode {
  switch (b.t) {
    case "heading":
      return b.level === 2 ? (
        <h2 key={i} className="mt-10 text-2xl font-bold text-fg">
          {inline(b.children)}
        </h2>
      ) : (
        <h3 key={i} className="mt-8 text-xl font-semibold text-fg">
          {inline(b.children)}
        </h3>
      );
    case "p":
      return (
        <p key={i} className="mt-4">
          {inline(b.children)}
        </p>
      );
    case "ul":
      return (
        <ul key={i} className="mt-4 list-disc space-y-1 pl-6">
          {b.items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={i} className="mt-4 list-decimal space-y-1 pl-6">
          {b.items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <blockquote key={i} className="mt-6 border-l-4 border-primary pl-4 italic text-muted">
          {inline(b.children)}
        </blockquote>
      );
    case "code":
      return (
        <pre key={i} className="mt-4 overflow-x-auto rounded-lg bg-surface p-4 text-sm">
          <code>{b.text}</code>
        </pre>
      );
    case "hr":
      return <hr key={i} className="my-8 border-border" />;
    case "img":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={b.src}
          alt={b.alt}
          loading="lazy"
          decoding="async"
          className="mt-6 h-auto w-full rounded-lg border border-border"
        />
      );
  }
}

/** Render Markdown aman: tanpa HTML mentah, semua teks di-escape oleh React. */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="max-w-3xl text-fg" data-testid="isi-artikel">
      {parseMarkdown(source).map(blok)}
    </div>
  );
}
