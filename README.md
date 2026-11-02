# Folder Slideshow

A small, private, browser-only slideshow player. Pick a folder of pictures and videos, optionally a folder of music, and watch them full screen in random or sequential order.

- Separate pickers for the media folder and the music folder
- If only a media folder is chosen, audio files inside it are used as music
- Full screen player; move the mouse (or tap) to reveal controls, they hide after 3 seconds
- Now playing card with cover art, title, artist, seek, previous/next track, volume
- Shuffle or sequential, 3/5/10/20 seconds per picture, fit or fill, slow zoom
- Videos play to the end; their sound can duck the music
- Remembers the last folders (Chromium browsers; one click to re-grant access)
- English and Turkish UI
- Nothing is uploaded; files never leave your browser

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space | Pause or resume slideshow |
| Left / Right | Previous / next slide |
| N / P | Next / previous track |
| M | Mute music |
| Up / Down | Music volume |
| S | Toggle shuffle |
| F | Toggle full screen |
| Esc | Exit (when not in full screen) |

## Browser support

Best in Chrome, Edge and other Chromium browsers (folder picker, drag and drop, remembered folders). Firefox and Safari work through a basic folder input without remembering folders.

## Development

```
npm install
npm run dev
npm run build
```

Stack: React 18, Vite 6, Tailwind CSS v4. See AGENTS.md for the code map and contribution rules.

## Deployment (GitHub Pages)

The workflow in `.github/workflows/pages.yml` builds and deploys on every push to `main`.
One-time setup: Settings, Pages, Source = GitHub Actions.

## Contributing rule

Every change must update README.md and AGENTS.md in the same commit. See AGENTS.md.
