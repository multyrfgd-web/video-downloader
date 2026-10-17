# Maqta3: TikTok Only

An Arabic, right-to-left TikTok video downloader built with React, Vite, and Tailwind CSS. The production build is a single HTML file in `dist/index.html`.

## Run

```sh
npm install
npm run dev
```

## Verify

```sh
node --test tests/tiktok.test.mjs
npx tsc --noEmit
npm run build
```

## Supported Links

- Direct TikTok video links, including mobile and shared video URLs.
- Short links on `vm.tiktok.com`, `vt.tiktok.com`, and `tiktok.com/t/`.
- TikTok video batches, processed sequentially to respect the provider's request limit.

Other platforms, lookalike domains, profile links, and photo posts are rejected. Old multi-platform history is filtered to retain only TikTok videos and their favorites.

## Download Service

`src/lib/providers.ts` uses TikWM's documented `https://www.tikwm.com/api/` endpoint with `url` and `hd=1`. Video URLs are sent to this third-party service. History and favorites remain in the browser's local storage.

Actual downloads require the service and its media CDN to be reachable. A blocked request, rate limit, or private/deleted video is displayed as an error; no other-platform provider or public proxy is used. If a CDN prevents cross-origin fetching, the application opens the media URL for manual saving instead.

Provider-dependent tests use mocked responses, so passing tests does not guarantee live-service availability.