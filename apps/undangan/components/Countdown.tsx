"use client";

import { useSyncExternalStore } from "react";
import { pad, remaining } from "@tpl/core";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}
const getNowSeconds = () => Math.floor(Date.now() / 1000);
const getServerNow = () => null; // tidak dirender di server → tanpa mismatch hydration

type Props = { target: string; selesaiText?: string };

/** Hitung mundur ke `target` (ISO 8601). Setelah lewat, tampil `selesaiText`. */
export function Countdown({
  target,
  selesaiText = "Hari bahagia telah tiba. Terima kasih atas doa Anda.",
}: Props) {
  const nowSec = useSyncExternalStore(subscribe, getNowSeconds, getServerNow);
  if (nowSec === null) return <div className="h-24" aria-hidden="true" />; // jaga tinggi, cegah layout shift
  const left = remaining(Date.parse(target), nowSec * 1000);
  if (!left) {
    return (
      <p role="status" data-testid="countdown-selesai" className="text-center text-lg text-muted">
        {selesaiText}
      </p>
    );
  }
  const units: Array<[string, number]> = [
    ["Hari", left.days],
    ["Jam", left.hours],
    ["Menit", left.minutes],
    ["Detik", left.seconds],
  ];
  return (
    <div
      role="timer"
      aria-label={`Menuju hari bahagia: ${left.days} hari ${left.hours} jam ${left.minutes} menit`}
      data-testid="countdown"
      className="grid grid-cols-4 gap-2 text-center sm:gap-4"
    >
      {units.map(([label, v]) => (
        <div key={label} className="rounded-lg border border-border bg-bg px-1 py-3 sm:py-4">
          <div className="text-2xl font-bold tabular-nums text-fg sm:text-4xl">{pad(v)}</div>
          <div className="text-xs text-muted sm:text-sm">{label}</div>
        </div>
      ))}
    </div>
  );
}
