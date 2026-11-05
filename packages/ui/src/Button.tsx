import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "./cn";
import { withBase } from "./base";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:opacity-90",
  secondary: "border border-border bg-surface text-fg hover:bg-border/40",
  ghost: "text-primary hover:bg-surface",
};
const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3 text-lg",
};

function classes(variant: Variant, size: Size, extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50",
    variants[variant],
    sizes[size],
    extra,
  );
}

type Common = { variant?: Variant; size?: Size };

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={classes(variant, size, className)} {...rest} />;
}

/** Tautan bergaya tombol. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  ...rest
}: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={classes(variant, size, className)} href={withBase(href)} {...rest} />;
}
