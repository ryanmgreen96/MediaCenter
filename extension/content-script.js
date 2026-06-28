const APP_STORAGE_KEY = "mediacenter.state.v3";
const STORAGE_KEYS = {
  queueVideos: "mediacenter.queueVideos",
  savedVideos: "mediacenter.savedVideos",
};

if (isYouTubePage()) {
  attachYouTubeCapture();
}

if (isMediaCenterPage()) {
  syncStorageToPage();
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (changes[STORAGE_KEYS.queueVideos] || changes[STORAGE_KEYS.savedVideos]) {
      syncStorageToPage();
    }
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "mediacenter-get-current-video") {
    sendResponse({ video: getCurrentVideoMeta() });
    return true;
  }

  if (message?.type === "mediacenter-get-context-video") {
    sendResponse({ video: getContextVideoMeta(message.linkUrl) });
    return true;
  }

  if (message?.type === "mediacenter-sync-storage" && isMediaCenterPage()) {
    syncStorageToPage().then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});

function attachYouTubeCapture() {
  document.addEventListener(
    "contextmenu",
    (event) => {
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) {
        return;
      }

      window.__mediacenterLastContextVideo = extractVideoMetaFromAnchor(anchor);
    },
    true,
  );
}

function getCurrentVideoMeta() {
  if (!isYouTubePage()) {
    return null;
  }

  const videoId = new URL(location.href).searchParams.get("v") || getYouTubeVideoIdFromPath();
  const title =
    document.querySelector("h1 yt-formatted-string")?.textContent?.trim() ||
    document.querySelector("meta[property='og:title']")?.content?.trim() ||
    document.title.replace(/\s-\sYouTube$/i, "").trim();
  const thumbnail =
    document.querySelector("meta[property='og:image']")?.content?.trim() ||
    (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");

  if (!title && !location.href) {
    return null;
  }

  return {
    title: title || "Untitled video",
    url: canonicalizeUrl(location.href),
    thumbnail,
    source: "youtube",
  };
}

function getContextVideoMeta(linkUrl) {
  if (window.__mediacenterLastContextVideo) {
    return {
      ...window.__mediacenterLastContextVideo,
      url: canonicalizeUrl(window.__mediacenterLastContextVideo.url || linkUrl || location.href),
    };
  }

  const anchor = document.querySelector(`a[href='${cssEscape(linkUrl)}']`) || document.querySelector("a[href]");
  if (!anchor) {
    return null;
  }

  return extractVideoMetaFromAnchor(anchor);
}

function extractVideoMetaFromAnchor(anchor) {
  const title =
    anchor.getAttribute("aria-label")?.trim() ||
    anchor.getAttribute("title")?.trim() ||
    anchor.textContent?.replace(/\s+/g, " ").trim() ||
    anchor.closest("ytd-rich-item-renderer")?.querySelector("#video-title")?.textContent?.trim() ||
    anchor.closest("ytd-compact-video-renderer")?.querySelector("#video-title")?.textContent?.trim() ||
    "Untitled video";
  const img = anchor.querySelector("img");
  const thumbnail = img?.currentSrc || img?.src || anchor.closest("ytd-rich-item-renderer")?.querySelector("img")?.currentSrc || "";

  return {
    title,
    url: canonicalizeUrl(anchor.href),
    thumbnail,
    source: "youtube",
  };
}

async function syncStorageToPage() {
  const result = await chrome.storage.local.get([STORAGE_KEYS.queueVideos, STORAGE_KEYS.savedVideos]);
  const queueVideos = Array.isArray(result[STORAGE_KEYS.queueVideos]) ? result[STORAGE_KEYS.queueVideos] : [];
  const savedVideos = Array.isArray(result[STORAGE_KEYS.savedVideos]) ? result[STORAGE_KEYS.savedVideos] : [];
  const current = readPageState();

  localStorage.setItem(
    APP_STORAGE_KEY,
    JSON.stringify({
      ...current,
      queueVideos,
      savedVideos,
    }),
  );

  window.postMessage({ source: "mediacenter-extension", type: "sync-data" }, "*");
}

function readPageState() {
  try {
    return JSON.parse(localStorage.getItem(APP_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function isYouTubePage() {
  return /(^|\.)youtube\.com$/.test(location.hostname) || location.hostname === "youtu.be";
}

function isMediaCenterPage() {
  return location.protocol === "file:" && /MediaCenter[/\\]index\.html$/i.test(location.pathname);
}

function getYouTubeVideoIdFromPath() {
  const match = location.pathname.match(/\/watch\/(?:v=)?([a-zA-Z0-9_-]+)/i);
  return match?.[1] || "";
}

function canonicalizeUrl(value) {
  try {
    return new URL(value, location.href).href;
  } catch {
    return value || location.href;
  }
}

function cssEscape(value) {
  if (window.CSS?.escape) {
    return window.CSS.escape(value);
  }

  return String(value).replace(/['"\\]/g, "\\$&");
}