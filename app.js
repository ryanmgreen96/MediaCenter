const STORAGE_KEY = "mediacenter.state.v3";

const defaultState = {
  activeHeaderId: "",
  activePageId: "",
  editMode: false,
  deleteMode: false,
  topGroups: [],
  quickLinks: [],
  headers: [],
  queueVideos: [],
  savedVideos: [],
};

const state = loadState();

const headerList = document.getElementById("headerList");
const topTabStack = document.getElementById("topTabStack");
const topLinks = document.getElementById("topLinks");
const pageTabs = document.getElementById("pageTabs");
const videoGrid = document.getElementById("videoGrid");
const savedList = document.getElementById("savedList");
const emptyState = document.getElementById("emptyState");
const activeHeaderTitle = document.getElementById("activeHeaderTitle");

bindActions();
render();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? mergeState(defaultState, JSON.parse(raw)) : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeState(base, incoming) {
  return {
    ...structuredClone(base),
    ...incoming,
    topGroups: incoming.topGroups ?? structuredClone(base.topGroups),
    quickLinks: incoming.quickLinks ?? structuredClone(base.quickLinks),
    headers: incoming.headers ?? structuredClone(base.headers),
    queueVideos: incoming.queueVideos ?? structuredClone(base.queueVideos),
    savedVideos: incoming.savedVideos ?? structuredClone(base.savedVideos),
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindActions() {
  document.getElementById("addHeaderBtn").addEventListener("click", () => {
    const title = prompt("Header title?");
    if (!title) return;
    state.headers.unshift({
      id: crypto.randomUUID(),
      title,
      countLabel: "New header",
      pages: [{ id: crypto.randomUUID(), title: "Page 1", videos: [] }],
    });
    state.activeHeaderId = state.headers[0].id;
    state.activePageId = state.headers[0].pages[0].id;
    persistAndRender();
  });

  document.getElementById("addQuickLinkBtn").addEventListener("click", () => {
    const title = prompt("Quick link title?");
    const url = prompt("Quick link URL?");
    if (!title || !url) return;
    state.quickLinks.unshift({
      id: crypto.randomUUID(),
      icon: title.slice(0, 1).toUpperCase(),
      title,
      url,
    });
    persistAndRender();
  });

  document.getElementById("addTabBtn").addEventListener("click", () => {
    const header = getActiveHeader();
    if (!header) return;
    const title = prompt("Page tab title?");
    if (!title) return;
    const page = { id: crypto.randomUUID(), title, videos: [] };
    header.pages.push(page);
    state.activePageId = page.id;
    persistAndRender();
  });

  document.getElementById("editModeBtn").addEventListener("click", () => {
    state.editMode = !state.editMode;
    state.deleteMode = false;
    persistAndRender();
  });

  document.getElementById("deleteModeBtn").addEventListener("click", () => {
    state.deleteMode = !state.deleteMode;
    state.editMode = false;
    persistAndRender();
  });

}

function persistAndRender() {
  saveState();
  render();
}

function render() {
  renderHeaders();
  renderTopTabs();
  renderQuickLinks();
  renderPageTabs();
  renderVideos();
  renderSaved();
}

function renderHeaders() {
  headerList.innerHTML = "";
  state.headers.forEach((header) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `header-item ${header.id === state.activeHeaderId ? "active" : ""}`;
    button.innerHTML = `
      <span class="header-icon">${header.title.slice(0, 1).toUpperCase()}</span>
      <span class="header-meta">
        <strong>${escapeHtml(header.title)}</strong>
        <span>${escapeHtml(header.countLabel ?? "Page group")}</span>
      </span>
      <span class="header-pill">${header.pages.length}</span>
    `;
    button.addEventListener("click", () => {
      state.activeHeaderId = header.id;
      state.activePageId = header.pages[0]?.id ?? "";
      persistAndRender();
    });
    headerList.appendChild(button);
  });
}

function renderTopTabs() {
  topTabStack.innerHTML = "";
  state.topGroups.forEach((group) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-mark";
    button.title = group.label;
    topTabStack.appendChild(button);
  });
}

function renderQuickLinks() {
  topLinks.innerHTML = "";
  state.quickLinks.forEach((link) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quick-link";
    button.innerHTML = `
      <span class="quick-icon">${escapeHtml(link.icon ?? link.title.slice(0, 1).toUpperCase())}</span>
    `;
    button.addEventListener("click", () => window.open(link.url, "_blank", "noopener"));
    topLinks.appendChild(button);
  });
}

function renderPageTabs() {
  const header = getActiveHeader();
  pageTabs.innerHTML = "";
  activeHeaderTitle.textContent = header ? header.title : "";

  if (!header) return;

  header.pages.forEach((page) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `page-tab ${page.id === state.activePageId ? "active" : ""}`;
    button.textContent = page.title;
    button.addEventListener("click", () => {
      state.activePageId = page.id;
      persistAndRender();
    });
    pageTabs.appendChild(button);
  });
}

function renderVideos() {
  const header = getActiveHeader();
  const page = getActivePage();
  const videos = header ? page?.videos ?? [] : state.queueVideos;

  videoGrid.innerHTML = "";
  emptyState.classList.toggle("show", videos.length === 0);

  videos.forEach((video) => {
    const card = document.getElementById("videoCardTemplate").content.firstElementChild.cloneNode(true);
    card.querySelector("h3").textContent = video.title;
    card.querySelector("p").textContent = "";
    card.addEventListener("click", () => {
      if (header) {
        page.videos = page.videos.filter((item) => item.id !== video.id);
      } else {
        state.queueVideos = state.queueVideos.filter((item) => item.id !== video.id);
      }
      persistAndRender();
    });
    videoGrid.appendChild(card);
  });
}

function renderSaved() {
  savedList.innerHTML = "";
  state.savedVideos.forEach((saved) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "saved-item";
    item.innerHTML = `
      <span class="saved-icon">↗</span>
      <span class="saved-meta"><strong>${escapeHtml(saved.title)}</strong></span>
    `;
    item.addEventListener("click", () => window.open(saved.url, "_blank", "noopener"));
    savedList.appendChild(item);
  });
}

function getActiveHeader() {
  return state.headers.find((header) => header.id === state.activeHeaderId) ?? state.headers[0];
}

function getActivePage() {
  const header = getActiveHeader();
  return header?.pages.find((page) => page.id === state.activePageId) ?? header?.pages[0];
}

window.addEventListener("message", (event) => {
  if (event?.data?.source !== "mediacenter-extension" || event?.data?.type !== "sync-data") {
    return;
  }

  state.queueVideos = loadState().queueVideos;
  state.savedVideos = loadState().savedVideos;
  render();
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function shorten(value) {
  const text = String(value ?? "");
  if (text.length <= 32) return text;
  return `${text.slice(0, 29)}...`;
}