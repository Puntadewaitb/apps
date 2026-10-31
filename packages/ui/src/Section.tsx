import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";
import { Container } from "./Container";

type Props = Omit<HTMLAttributes<HTMLElement>, "title"> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  tone?: "default" | "surface";
};

export function Section({
  title,
  subtitle,
  tone = "default",
  className,
  children,
  ...rest
}: Props) {
  return (
    <section
      className={cn("py-12 sm:py-16", tone === "surface" && "bg-surface", className)}
      {...rest}
    >
      <Container>
        {(title || subtitle) && (
          <header className="mb-8 max-w-2xl">
            {title && <h2 className="text-2xl font-bold text-fg sm:text-3xl">{title}</h2>}
            {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
          </header>
        )}
        {children}
      </Container>
    </section>
  );
}
