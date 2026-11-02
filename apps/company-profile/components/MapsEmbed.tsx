import { ButtonLink } from "@tpl/ui";
import { fmt } from "../lib/i18n";
import { mapsSearchUrl, safeMapsEmbedUrl } from "../lib/maps";

type Props = {
  embedUrl: string;
  title: string;
  address: string;
  /** Teks UI: judul iframe (`{nama}`) & label tombol. */
  labels: { judul: string; buka: string };
};

/** Embed Google Maps (bila URL valid) + tautan buka di Maps. */
export function MapsEmbed({ embedUrl, title, address, labels }: Props) {
  const src = safeMapsEmbedUrl(embedUrl);
  return (
    <div className="space-y-3">
      {src && (
        <iframe
          src={src}
          title={fmt(labels.judul, { nama: title })}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          className="h-64 w-full rounded-lg border border-border"
        />
      )}
      <ButtonLink
        href={mapsSearchUrl(`${title}, ${address}`)}
        target="_blank"
        rel="noopener noreferrer"
        variant="secondary"
        size="sm"
      >
        {labels.buka}
      </ButtonLink>
    </div>
  );
}
