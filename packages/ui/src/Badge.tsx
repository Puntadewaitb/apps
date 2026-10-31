import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "primary" | "success" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface text-muted border-border",
  primary: "bg-primary/10 text-primary border-primary/30",
  success: "bg-success/10 text-success border-success/30",
  danger: "bg-danger/10 text-danger border-danger/30",
};

export function Badge({
  tone = "neutral",
  className,
  ...rest
}: { tone?: Tone } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
