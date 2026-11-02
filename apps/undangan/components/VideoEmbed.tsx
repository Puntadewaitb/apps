import { Section } from "@tpl/ui";
import { undangan } from "../content/undangan";
import { parseYoutubeId, youtubeEmbedUrl } from "../lib/video";

/** Tidak merender apa pun bila `undangan.video.youtube` kosong/tidak valid. */
export function VideoEmbed() {
  const id = parseYoutubeId(undangan.video.youtube);
  if (!id) return null;
  return (
    <Section id="video" title={undangan.video.judul}>
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
        <iframe
          src={youtubeEmbedUrl(id)}
          title={undangan.video.judul}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          allow="fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </Section>
  );
}
