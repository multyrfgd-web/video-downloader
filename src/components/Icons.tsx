import type { PlatformId } from "@/lib/types";

/* ----------------------------- أيقونات الواجهة ----------------------------- */

const UI_PATHS = {
  download: "M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
  copy: "M9 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2ZM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  link: "M10 13a5 5 0 0 0 7.07.07l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5M14 11a5 5 0 0 0-7.07-.07L4.1 13.76a5 5 0 0 0 7.07 7.07l1.33-1.33",
  star: "m12 3.6 2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.88l-5.2 2.73.99-5.79-4.21-4.1 5.82-.85L12 3.6Z",
  trash: "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6",
  search: "m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.42-1.42M4.92 19.08l1.42-1.42m0-11.32L4.92 4.92m14.16 14.16-1.42-1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z",
  paste: "M9 4h6a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V5a1 1 0 0 1 1-1Zm0 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V4Z",
  check: "m5 13 4.5 4.5L19 7",
  close: "M6 6l12 12M18 6 6 18",
  chevron: "m6 9 6 6 6-6",
  spinner: "M12 3a9 9 0 1 0 9 9",
  music: "M9 18V6l10-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  image: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 11 3.5-4 2.5 3 2-2 3 3M8.5 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
  video: "M3 6h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm16 3 3-2v10l-3-2",
  zap: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  shield: "M12 3 5 6v6c0 4.2 2.9 7.9 7 9 4.1-1.1 7-4.8 7-9V6l-7-3Zm-2.5 9L11 13.5 15 9",
  sparkles: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Zm6 9 .9 2.3L21 15l-2.1.7L18 18l-.9-2.3L15 15l2.1-.7L18 12Z",
  external: "M14 4h6v6M20 4l-8 8M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4",
  play: "M8 5.5v13l11-6.5-11-6.5Z",
  plus: "M12 5v14M5 12h14",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  refresh: "M20 11a8 8 0 1 0-.6 4M20 5v6h-6",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  wave: "M2 12c2.5-4 4.5-4 7 0s4.5 4 7 0 4.5-4 6 0",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3.2 1.9",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.4 3.8-5.4 3.8-9S14.5 5.4 12 3m0 18c-2.5-2.4-3.8-5.4-3.8-9S9.5 5.4 12 3M3.5 12h17",
};

export type IconName = keyof typeof UI_PATHS;

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.7,
  filled = false,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={UI_PATHS[name]} />
    </svg>
  );
}

/* --------------------------- شعار تيك توك --------------------------- */

const BRAND_PATHS: Record<PlatformId, string> = {
  tiktok:
    "M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06V9.7a5.68 5.68 0 0 0-.77-.05A5.68 5.68 0 0 0 4 15.35 5.68 5.68 0 0 0 9.68 21a5.68 5.68 0 0 0 5.68-5.65V8.9a7.35 7.35 0 0 0 4.28 1.38V7.19a4.29 4.29 0 0 1-3.04-1.37Z",
  unknown:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6ZM13.8 17h-3.6v-1h.6c.5 0 .7-.2.7-.6v-3c0-.6-.3-.9-.9-.9h-.9v-1h2c1.2 0 1.9.7 1.9 1.8v3.2c0 .4.2.6.7.6h.5v1Z",
};

export function PlatformIcon({
  id,
  className = "h-6 w-6",
}: {
  id: PlatformId;
  className?: string;
}) {
  const path = BRAND_PATHS[id] ?? BRAND_PATHS.unknown;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
