"use client";

import { useSyncExternalStore } from "react";
import { pad, remaining } from "../lib/countdown";
import { site } from "../content/site";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}
const getNowSeconds = () => Math.floor(Date.now() / 1000);
const getServerNow = () => null;

/** Banner promo + countdown. Tidak dirender di server (menghindari mismatch hydration) dan hilang saat promo berakhir. */
export function PromoBanner() {
  const { promo } = site;
  const nowSec = useSyncExternalStore(subscribe, getNowSeconds, getServerNow);
  if (!promo.enabled || nowSec === null) return null;
  const left = remaining(Date.parse(promo.endsAt), nowSec * 1000);
  if (!left) return null;

  const units: Array<[string, number]> = [
    ["hari", left.days],
    ["jam", left.hours],
    ["menit", left.minutes],
    ["detik", left.seconds],
  ];

  return (
    <aside
      aria-label="Promo"
      className="bg-fg px-4 py-2 text-center text-sm text-bg"
      data-testid="promo-banner"
    >
      <span className="font-medium">{promo.text}</span>
      <span
        role="timer"
        aria-label={`Sisa waktu promo: ${left.days} hari ${left.hours} jam ${left.minutes} menit`}
        className="mx-3 inline-flex gap-1.5 align-middle"
      >
        {units.map(([label, value]) => (
          <span key={label} className="rounded bg-bg/15 px-1.5 py-0.5 tabular-nums">
            {pad(value)}
            <span className="ml-0.5 text-xs opacity-80">{label.slice(0, 1)}</span>
          </span>
        ))}
      </span>
      <a href={promo.cta.href} className="font-semibold underline underline-offset-2">
        {promo.cta.label}
      </a>
    </aside>
  );
}
