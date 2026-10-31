import { cn } from "./cn";

type Props = {
  /** Nomor internasional tanpa +, mis. 6281234567890 */
  phone: string;
  message?: string;
  label?: string;
  className?: string;
};

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Tombol WhatsApp mengambang di pojok kanan bawah. */
export function WhatsAppButton({ phone, message, label = "Chat via WhatsApp", className }: Props) {
  return (
    <a
      href={buildWhatsAppUrl(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-success px-4 py-3 text-sm font-semibold text-white shadow-lg hover:opacity-90",
        className,
      )}
    >
      <span aria-hidden="true">💬</span>
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
