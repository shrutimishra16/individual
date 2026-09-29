# Media Folder

Drop your personal photos and videos here to replace the placeholder images on the site.

---

## 📁 photos/

Each file corresponds to a card on the main page. Just replace the file — keep the exact filename.

| Filename | Used on | Card |
|---|---|---|
| `hero.jpg` | Hero banner (full background) | — |
| `s1e1.jpg` | Season 1 · E1 | First Message |
| `s1e2.jpg` | Season 1 · E2 | First Call |
| `s1e3.jpg` | Season 1 · E3 | First Date |
| `s2e1.jpg` | Season 2 · E1 | Inside Jokes |
| `s2e2.jpg` | Season 2 · E2 | Cute Moments |
| `s2e3.jpg` | Season 2 · E3 | The Confession |
| `s5e1.jpg` | Season 5 · E1 | Wedding Day |
| `s5e2.jpg` | Season 5 · E2 | Our Home |
| `s5e3.jpg` | Season 5 · E3 | Little One |
| `s5finale.jpg` | Season 5 · Finale | To Be Continued |

### Tips
- Recommended size: **300×170 px** (cards), **1600×900 px** (hero)
- Any common format works: `.jpg`, `.jpeg`, `.png`, `.webp`
- If you use a different extension (e.g. `.png`), update the matching `src` in `index.html` too
- Keep file sizes small for fast loading — compress at [squoosh.app](https://squoosh.app)

---

## 📁 videos/

Not used yet — reserved for future video support. Drop any `.mp4` clips here.

---

## Screen-off / Background Audio Note

**Why music stops when you lock the screen:**

The YouTube IFrame player runs inside a browser tab. On mobile (iOS & Android), browsers
suspend JavaScript and media playback when the screen locks or you switch apps — this is
an OS-level restriction, not something the web app can override.

**Best workaround right now:**

| Option | How |
|---|---|
| **YouTube app itself** | Search the song in the YouTube app. It plays in the background natively (YouTube Premium) or just keep the screen on. |
| **Keep screen on** | Use the "Keep screen on" Wake Lock button in the music room — it prevents the screen from auto-locking while the tab is open. |
| **Don't switch apps** | On iOS, swipe up slowly and leave the browser in the foreground. On Android, use split-screen. |
| **Use a PWA install** | On Chrome/Android: tap the 3-dot menu → "Add to Home Screen". Installed PWAs stay alive slightly longer in the background. |

There is no way to make a pure web app play audio in the background after the screen locks —
only native apps (Spotify, YouTube) can do that via OS media session APIs.
