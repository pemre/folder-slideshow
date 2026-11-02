# AGENTS.md

Instructions for AI agents and contributors working on this repository.

## Golden rule

**Every change MUST update both README.md and AGENTS.md in the same commit.**
If nothing in them needs to change, re-read them and bump the `Last reviewed` line at the bottom of this file to say so. Stale docs are treated as bugs.

## Project

A browser-only slideshow player. The user picks a media folder (pictures and videos) and optionally a music folder, then plays them full screen, shuffled or in order. No backend, no uploads. Hosted on GitHub Pages.

## Stack

- React 18 + Vite 6 (JavaScript, JSX, no TypeScript)
- Tailwind CSS v4 via `@tailwindcss/vite` (utility classes only; a few keyframes live in `src/index.css`)
- No other runtime dependencies. Keep it that way unless there is a strong reason.

## Language rules

- All code, comments, identifiers, commit messages and docs are in English.
- UI text is localized (English and Turkish). Every user-visible string goes in `src/lib/i18n.js`, in both languages. Never hardcode UI text in components.

## Layout

| Path | Purpose |
| --- | --- |
| `src/App.jsx` | State owner: folders, saved handles, start/exit, switches Setup and Player |
| `src/Setup.jsx` | Landing screen: two folder cards, options, start button |
| `src/Player.jsx` | Full screen player: slides, music, overlay controls, shortcuts |
| `src/ui.jsx` | Icon, IconButton, Seg (segmented control) |
| `src/lib/media.js` | File kinds, folder scanning, shuffle/natural sort |
| `src/lib/tags.js` | Minimal ID3v2 reader (title, artist, cover) |
| `src/lib/handles.js` | IndexedDB storage for folder handles, permission helper |
| `src/lib/settings.js` | Persisted settings hook (localStorage) |
| `src/lib/i18n.js` | Strings and `makeT` |
| `.github/workflows/pages.yml` | Build and deploy to GitHub Pages on push to `main` |

## Behavior to preserve

- Music source: the music folder wins; if it has no audio, audio files inside the media folder are used.
- Folder handles are remembered in IndexedDB (Chromium). Reopening needs a click because browsers require a user gesture for permission.
- Browsers without `showDirectoryPicker` use an `<input webkitdirectory>` fallback with no persistence.
- Controls overlay shows on mouse move or touch and hides after 3 seconds. The cursor hides with it.
- Object URLs must always be revoked when no longer shown.
- Video sound ducks the music to 15 percent.
- Keyboard: Space, arrows, N/P, M, S, F, Esc.
- Slide transition: the newest layer (class `fs-fade`) has an opaque black background and fades in over the previous layer. Do not make it transparent, or the previous picture shows through the blurred backdrop when orientations differ.

## Commands

```
npm install
npm run dev      # local dev server
npm run build    # outputs dist/
```

## Deployment

Pushing to `main` runs the Pages workflow. One-time setup: repository Settings, Pages, Source = GitHub Actions.

## Known limits

- Tags are read only for MP3 (ID3v2). Other formats show the file name.
- HEIC and some codecs (for example MKV) are not playable in browsers and are skipped.
- Dropping a folder works only in Chromium browsers.

Last reviewed: fixed previous picture showing through the blurred backdrop (opaque top layer).
