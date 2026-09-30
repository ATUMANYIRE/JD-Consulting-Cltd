import { CameraIcon } from "./icons";

// YouTube and Vimeo links play in their own privacy-friendly embed; any other video is a file.
function embedUrl(src) {
  const youtube = src.match(/^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`;
  const vimeo = src.match(/^https:\/\/(?:www\.)?vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`;
  return null;
}

// One photo or video slot. Pass { type: "image" | "video", src, alt, poster, caption } once the
// company supplies genuine media; without a src it renders a clearly labelled placeholder.
export default function MediaFrame({ media, label, aspect = "aspect-[4/3]", rounded = "rounded-3xl", className = "" }) {
  const frame = `relative overflow-hidden ${rounded} ${aspect} ${className}`;

  if (!media?.src) {
    return (
      <div className={`${frame} grid place-items-center border-2 border-dashed border-navy/15 bg-[#eef2f6]`}>
        <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M-10 ${40 + i * 18} Q50 ${28 + i * 18} 100 ${40 + i * 18} T210 ${36 + i * 18}`}
              fill="none"
              stroke={i === 3 ? "#E28A2E" : "#0E293E"}
              strokeOpacity={i === 3 ? 0.3 : 0.07}
            />
          ))}
        </svg>
        <div className="relative flex flex-col items-center gap-2 px-4 text-center text-navy/45">
          <CameraIcon />
          <span className="text-xs font-semibold uppercase tracking-widest">{label}</span>
        </div>
      </div>
    );
  }

  return (
    <figure className={className}>
      <div className={`relative overflow-hidden ${rounded} ${aspect} bg-navy`}>
        {media.type === "video" && embedUrl(media.src) ? (
          <iframe
            src={embedUrl(media.src)}
            title={media.alt || media.caption || "Video"}
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="h-full w-full"
          />
        ) : media.type === "video" ? (
          <video src={media.src} poster={media.poster} controls playsInline preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <img src={media.src} alt={media.alt ?? ""} loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
      {media.caption && <figcaption className="mt-2 text-sm text-navy/60">{media.caption}</figcaption>}
    </figure>
  );
}
