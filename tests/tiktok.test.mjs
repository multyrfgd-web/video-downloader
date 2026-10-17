import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { afterEach, test } from "node:test";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
const project = new URL("../", import.meta.url).pathname;

const { outputFiles } = await build({
  stdin: {
    contents: [
      'export * from "./src/lib/platforms.ts";',
      'export * from "./src/lib/providers.ts";',
      'export * from "./src/lib/storage.ts";',
    ].join("\n"),
    resolveDir: project,
    loader: "ts",
  },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const lib = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString("base64")}`);

const sample = lib.TIKTOK.sample;
const originalFetch = globalThis.fetch;
const originalWindow = globalThis.window;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
});

const unsupported = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://www.instagram.com/reel/abc123/",
  "https://x.com/user/status/1234567890",
  "https://www.facebook.com/reel/1234567890/",
  "https://example.com/video.mp4",
  "https://tiktok.com.evil.test/@user/video/6718335390845095173",
  "https://not-tiktok.com/@user/video/6718335390845095173",
  "https://www.tiktok.com@evil.test/@user/video/6718335390845095173",
  "https://user:secret@www.tiktok.com/@user/video/6718335390845095173",
  "https://example.com/?url=https://www.tiktok.com/@user/video/6718335390845095173",
  "https://www.tiktok.com:8080/@user/video/6718335390845095173",
  "https://shop.tiktok.com/@user/video/6718335390845095173",
  "https://www.tiktok.com/@user",
  "https://www.tiktok.com/@user/photo/6718335390845095173",
  "https://www.tiktok.com/music/example-6718335390845095173",
  "https://vm.tiktok.com/",
  "https://www.tiktok.com/redirect?url=https://example.com/video.mp4",
  "javascript:alert(1)",
  "ftp://www.tiktok.com/@user/video/6718335390845095173",
  "https://www.tiktok.com/\\@user/video/6718335390845095173",
  "https://www.tiktok.com/@user/video/6718335390845095173\nmalformed",
  "not a link",
  "",
];

test("accepts and normalizes only direct and short TikTok video links", () => {
  const supported = [
    sample,
    "https://m.tiktok.com/@test.user_1/video/6718335390845095173/",
    "https://vm.tiktok.com/ZM123abc/",
    "https://vt.tiktok.com/ZS123abc/",
    "https://www.tiktok.com/t/ZT123abc/",
    "https://www.tiktok.com/share/video/6718335390845095173/",
    "https://www.tiktok.com/v/6718335390845095173.html",
    "www.tiktok.com/@scout2015/video/6718335390845095173",
  ];
  for (const url of supported) {
    assert.ok(lib.normalizeTikTokUrl(url), url);
    assert.equal(lib.detectPlatform(url), "tiktok");
  }
  assert.equal(lib.normalizeTikTokUrl(`  ${sample}#player  `), sample);
  assert.equal(lib.normalizeTikTokUrl(sample.replace("https:", "http:")), sample);
});

test("rejects other platforms, spoofed domains, profiles and photo posts", () => {
  for (const url of unsupported) {
    assert.equal(lib.normalizeTikTokUrl(url), null, url);
    assert.equal(lib.detectPlatform(url), "unknown", url);
  }
});

test("rejects unsupported input at the resolver without making any network request", async () => {
  let requests = 0;
  globalThis.fetch = async () => {
    requests += 1;
    throw new Error("A network request must not happen");
  };
  for (const url of unsupported) {
    const outcome = await lib.resolveMedia(url);
    assert.equal(outcome.result, null);
    assert.equal(outcome.error, lib.TIKTOK_ONLY_MESSAGE);
    assert.deepEqual(outcome.attempts, []);
  }
  assert.equal(requests, 0);
});

function mockResponse(data, status = 200) {
  globalThis.fetch = async () => new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const video = {
  id: "6718335390845095173",
  title: "Saved TikTok",
  play: "https://cdn.example.test/video.mp4",
  hdplay: "https://cdn.example.test/video-hd.mp4",
  cover: "https://cdn.example.test/cover.jpg",
  music: "https://cdn.example.test/audio.mp3",
  duration: 12,
  hd_size: 1024,
  author: { nickname: "Test Creator" },
};

test("uses only TikWM with the validated TikTok URL and HD parameter", async () => {
  let requests = 0;
  globalThis.fetch = async (input, options) => {
    requests += 1;
    const endpoint = new URL(input);
    assert.equal(endpoint.origin, "https://www.tikwm.com");
    assert.equal(endpoint.pathname, "/api/");
    assert.equal(endpoint.searchParams.get("url"), sample);
    assert.equal(endpoint.searchParams.get("hd"), "1");
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify({ code: 0, data: video }));
  };
  const outcome = await lib.resolveMedia(sample);
  assert.equal(requests, 1);
  assert.equal(outcome.result.platform, "tiktok");
  assert.equal(outcome.result.kind, "video");
  assert.equal(outcome.result.videoUrl, video.hdplay);
  assert.equal(outcome.result.videoSdUrl, video.play);
  assert.equal(outcome.result.noWatermarkUrl, video.hdplay);
  assert.equal(outcome.result.audioUrl, video.music);
  assert.equal(outcome.result.quality, "HD");
  assert.equal(outcome.attempts[0].ok, true);
});

test("falls back to the available SD video, not another platform or provider", async () => {
  mockResponse({ code: 0, data: { ...video, hdplay: undefined, play: "/video/media/play/test.mp4" } });
  const { result } = await lib.resolveMedia(sample);
  assert.equal(result.quality, "SD");
  assert.equal(result.videoUrl, "https://www.tikwm.com/video/media/play/test.mp4");
});

test("does not turn a TikTok photo post or unsafe media URL into a downloadable video", async () => {
  for (const data of [
    { ...video, images: [video.cover] },
    { title: "Photo only", images: [video.cover] },
    { play: "javascript:alert(1)" },
    { play: "data:video/mp4;base64,AAAA" },
  ]) {
    mockResponse({ code: 0, data });
    const outcome = await lib.resolveMedia("https://vm.tiktok.com/ZM123abc/");
    assert.equal(outcome.result, null);
    assert.equal(outcome.attempts[0].ok, false);
  }
});

test("returns useful failures for rate limits and an unavailable provider", async () => {
  for (const [data, status] of [
    [{ code: -1, msg: "Free Api Limit: 1 request/second." }, 200],
    [{}, 429],
    [{}, 503],
    [{ code: -1, msg: "Url parsing is failed!" }, 200],
  ]) {
    mockResponse(data, status);
    const outcome = await lib.resolveMedia(sample);
    assert.equal(outcome.result, null);
    assert.ok(outcome.error);
    assert.equal(outcome.attempts.length, 1);
    assert.equal(outcome.attempts[0].provider, "tikwm");
  }
});

function localStorageMock() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  };
}

function historyItem(overrides = {}) {
  return {
    id: "saved-video",
    url: sample,
    platform: "tiktok",
    kind: "video",
    provider: "TikWM",
    title: "Saved TikTok",
    videoUrl: video.hdplay,
    favorite: true,
    createdAt: Date.now(),
    ...overrides,
  };
}

test("migrates legacy history to TikTok videos only and preserves TikTok favorites", () => {
  globalThis.window = { localStorage: localStorageMock() };
  const saved = historyItem();
  const legacy = [
    saved,
    historyItem({ platform: "youtube", url: unsupported[0] }),
    historyItem({ url: unsupported[0] }),
    historyItem({ url: "https://www.tiktok.com/@user" }),
    historyItem({ kind: "image" }),
    historyItem({ videoUrl: "javascript:alert(1)" }),
    null,
    {},
  ];
  window.localStorage.setItem("mqata3.history.v1", JSON.stringify(legacy));
  assert.deepEqual(lib.loadHistory(), [saved]);
  lib.saveHistory(legacy);
  assert.deepEqual(JSON.parse(window.localStorage.getItem("mqata3.history.v1")), [saved]);
});

test("accumulates batch history and retains a favorite when refreshing a video", () => {
  let items = [];
  items = lib.upsertHistory(items, historyItem({ favorite: false }));
  const second = historyItem({ id: "second", url: "https://vm.tiktok.com/ZM123abc/" });
  items = lib.upsertHistory(items, second);
  items = lib.upsertHistory(items, { ...second, favorite: false, title: "Refreshed" });
  assert.equal(items.length, 2);
  assert.equal(items[0].favorite, true);
  assert.deepEqual(lib.clearHistory(items), [items[0]]);
});

test("renders a TikTok-only app without other platform controls or broken navigation", async () => {
  const output = await build({
    entryPoints: [new URL("../src/App.tsx", import.meta.url).pathname],
    bundle: true,
    platform: "node",
    format: "cjs",
    packages: "external",
    write: false,
    jsx: "automatic",
  });
  const module = { exports: {} };
  new Function("require", "module", "exports", output.outputFiles[0].text)(require, module, module.exports);
  const { createElement } = require("react");
  const { renderToString } = require("react-dom/server");
  const html = renderToString(createElement(module.exports.default));
  assert.match(html, /لتيك توك/);
  assert.match(html, /رابط فيديو تيك توك/);
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /سجل مقاطع تيك توك/);
  assert.doesNotMatch(html, /youtube|instagram|twitter|facebook|يوتيوب|انستغرام|فيسبوك|المنصات المدعومة/i);
});