# MediaCenter

MediaCenter is a browser-based bookmark and video queue surface intended to run in Microsoft Edge/Chrome and store user data locally at first.

## Current direction

- Top bar: icon-only bookmarks and grouped tabs.
- Left panel: a single header column with links beneath it.
- Center viewer: queued videos plus the selected header's pages.
- Right panel: saved-for-later video links and titles.

## Initial implementation notes

- Start with one extension unless there is a hard permission split that forces two.
- Prefer a single storage model for the first version so the browser action, context menu, and page UI all read from the same source of truth.
- Use local storage for the prototype, then move to extension storage if persistence or sync requirements become stricter.

## Easy push setup

The repository is already initialized and the GitHub remote is set to:

https://github.com/ryanmgreen96/MediaCenter.git

## Extension

The unpacked browser extension lives in [extension/](extension/). It adds:

- A right-click `Que` menu item for YouTube links.
- A toolbar button that saves the current YouTube video for later.

Load that folder as an unpacked extension in Edge or Chrome. The MediaCenter page is only a viewer when you want it open.

Typical first push flow:

```bash
git add -A
git commit -m "Initial MediaCenter scaffold"
git push -u origin main
```

## Open questions to settle before building

- Whether video capture should be handled by one extension or split into a browser action extension plus a context-menu extension.
- Whether video data should stay in `localStorage` for v1 or move immediately to `chrome.storage.local`.
- Whether left-panel headers should create independent viewer pages or filtered views over one shared dataset.