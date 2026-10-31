"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "./cn";

export type AccordionItem = { id: string; title: ReactNode; content: ReactNode };

type Props = {
  items: AccordionItem[];
  /** id item yang terbuka awal */
  defaultOpenId?: string;
  className?: string;
};

/** Accordion satu-terbuka-satu-waktu, aksesibel (aria-expanded/controls). */
export function Accordion({ items, defaultOpenId, className }: Props) {
  const [openId, setOpenId] = useState<string | undefined>(defaultOpenId);
  const base = useId();
  return (
    <div className={cn("divide-y divide-border rounded-lg border border-border", className)}>
      {items.map((item) => {
        const isOpen = item.id === openId;
        const panelId = `${base}-panel-${item.id}`;
        const btnId = `${base}-btn-${item.id}`;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={btnId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? undefined : item.id)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left font-medium text-fg hover:bg-surface"
              >
                <span>{item.title}</span>
                <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="px-4 pb-4 text-muted"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
