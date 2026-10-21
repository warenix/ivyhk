# IVY.HK · 老婆生日快樂

A tiny birthday mini-game for 老公 → 老婆. The pig throws cakes, you catch five of them,
and then it celebrates.

No build step. No framework. No runtime dependencies except the Google Fonts stylesheet.
Deploy the folder as-is.

```
index.html          markup, three stages (intro → game → victory)
css/style.css       everything visual
js/game.js          game loop, WebAudio SFX, confetti, stage machine
sw.js               service worker — offline cache + auto-update
manifest.json       PWA manifest
image/              piggy mascot, cake, icons, OG share image
```

## The three stages

1. **Intro** — the pig, the date, a "開始" button.
2. **Game** — the pig tosses cakes into the air. Tap one to catch it.
   Five catches fills the heart meter. Misses cost nothing, they only break the combo.
   Keyboard: <kbd>Tab</kbd> to a cake and <kbd>Space</kbd> to catch, or <kbd>Space</kbd> alone
   to catch the oldest cake.
3. **Victory** — confetti, the pig cheering, `再玩一次` to play again and a share button
   (Web Share API, falls back to copy-link).

## Deploying

Any static host works. The current production host is **Vercel** behind **Cloudflare**.

- Vercel: import the repo, no build command, output directory `.`
- Cloudflare Pages: build command empty, output directory `.`
- GitHub Pages: serve from the repo root

After deploying, bump `VERSION` in `sw.js` whenever you change assets — the service worker
caches by that name, and the page auto-reloads when a new version activates.

## Asset generation

`image/icon.svg`, `heart_192.png`, `heart_512.png` and `icon_maskable.png` are all rendered
from one vector heart path. `image/og.png` (1200×630) is the WhatsApp / Instagram share
preview — regenerate it if the wording changes:

```bash
rsvg-convert -w 512 -h 474 -b none -o image/heart_512.png image/icon.svg
rsvg-convert -w 192 -h 178 -b none -o image/heart_192.png image/icon.svg
```

The OG image is composed with Python + Pillow (`Noto Sans CJK HK` for the text).

## Notes

- **Google AdSense was removed.** The old page carried an ad script; ads on a private
  birthday card are not great. To put it back, add this before `</body>`:
  ```html
  <script data-ad-client="ca-pub-3401903052239973" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
  ```
  and reserve space with `min-height` on the stage.
- **Cloudflare Web Analytics** is kept. If it is enabled in the Cloudflare dashboard the
  beacon is injected at the edge and the tag in `index.html` is harmless either way.
- `robots.txt` is not in the repo on purpose — Vercel generates one (including AI content
  signals) for you. If you deploy elsewhere, add your own.
- The message text, the date and the artwork are unchanged from the 2020 original.
