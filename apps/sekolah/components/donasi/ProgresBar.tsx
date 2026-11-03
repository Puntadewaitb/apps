import { rupiah } from "../../lib/format";

type Props = { terkumpul: number; target: number; persen: number; donatur: number };

/** Bilah progres donasi (dapat dibaca pembaca layar). Lebar dibatasi 100% walau persen > 100. */
export function ProgresBar({ terkumpul, target, persen, donatur }: Props) {
  return (
    <div data-testid="progres">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, persen)}
        aria-label={`Terkumpul ${persen}% dari target`}
        className="h-3 w-full overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, persen)}%` }}
        />
      </div>
      <p className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
        <span>
          <strong className="text-lg text-fg" data-testid="terkumpul">
            {rupiah(terkumpul)}
          </strong>{" "}
          <span className="text-muted">dari {rupiah(target)}</span>
        </span>
        <span className="text-muted">
          <span data-testid="persen">{persen}%</span> · {donatur} donatur
        </span>
      </p>
    </div>
  );
}
