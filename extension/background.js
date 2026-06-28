const STORAGE_KEYS = {
  queueVideos: "mediacenter.queueVideos",
  savedVideos: "mediacenter.savedVideos",
};

const QUEUE_MENU_ID = "mediacenter-queue-video";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: QUEUE_MENU_ID,
      title: "Que",
      contexts: ["link"],
      documentUrlPatterns: ["https://www.youtube.com/*", "https://m.youtube.com/*", "https://youtu.be/*"],
    });
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) {
    return;
  }

  const video = await requestVideo(tab.id, "mediacenter-get-current-video");
  if (!video) {
    return;
  }

  await addSavedVideo(video);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== QUEUE_MENU_ID || !tab?.id) {
    return;
  }

  const video = await requestVideo(tab.id, "mediacenter-get-context-video", { linkUrl: info.linkUrl });
  if (!video) {
    return;
  }

  await addQueueVideo(video);
});

async function addQueueVideo(video) {
  const record = normalizeVideo(video);
  const current = await getArray(STORAGE_KEYS.queueVideos);
  await chrome.storage.local.set({
    [STORAGE_KEYS.queueVideos]: [record, ...current.filter((item) => item.url !== record.url)],
  });
}

async function addSavedVideo(video) {
  const record = normalizeVideo(video);
  const current = await getArray(STORAGE_KEYS.savedVideos);
  await chrome.storage.local.set({
    [STORAGE_KEYS.savedVideos]: [record, ...current.filter((item) => item.url !== record.url)],
  });
}

function normalizeVideo(video) {
  return {
    id: crypto.randomUUID(),
    title: video.title || "Untitled video",
    url: video.url || video.linkUrl || "",
    thumbnail: video.thumbnail || "",
    source: video.source || "youtube",
    savedAt: Date.now(),
  };
}

async function getArray(key) {
  const result = await chrome.storage.local.get(key);
  return Array.isArray(result[key]) ? result[key] : [];
}

function requestVideo(tabId, messageType, extra = {}) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: messageType, ...extra }, (response) => {
      if (chrome.runtime.lastError || !response) {
        resolve(null);
        return;
      }

      resolve(response.video ?? null);
    });
  });
}

