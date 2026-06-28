const STORAGE_KEYS = {
  queueVideos: "mediacenter.queueVideos",
  savedVideos: "mediacenter.savedVideos",
};

const queueList = document.getElementById("queueList");
const savedList = document.getElementById("savedList");

render();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  if (changes[STORAGE_KEYS.queueVideos] || changes[STORAGE_KEYS.savedVideos]) {
    render();
  }
});

async function render() {
  const result = await chrome.storage.local.get([STORAGE_KEYS.queueVideos, STORAGE_KEYS.savedVideos]);
  renderList(queueList, Array.isArray(result[STORAGE_KEYS.queueVideos]) ? result[STORAGE_KEYS.queueVideos] : [], true);
  renderList(savedList, Array.isArray(result[STORAGE_KEYS.savedVideos]) ? result[STORAGE_KEYS.savedVideos] : [], false);
}

function renderList(container, items, showThumbnail) {
  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = '<div class="empty">Nothing saved yet.</div>';
    return;
  }

  for (const item of items) {
    const row = document.createElement("a");
    row.className = "item";
    row.href = item.url || "#";
    row.target = "_blank";
    row.rel = "noreferrer noopener";
    row.innerHTML = `
      <div class="thumb" style="${showThumbnail && item.thumbnail ? `background-image:url('${item.thumbnail}')` : ""}"></div>
      <div>
        <div class="title">${escapeHtml(item.title || "Untitled video")}</div>
        <div class="meta">${escapeHtml(item.url || "")}</div>
      </div>
    `;
    container.appendChild(row);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}