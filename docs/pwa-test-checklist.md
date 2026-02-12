# MagmaBot PWA Test Checklist

## Prerequisites

- Serve over HTTPS (or localhost)
- Use Chrome/Edge (best PWA support)
- Clear browser cache before testing

---

## 1. Install Prompt

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1.1 | Open MagmaBot UI in Chrome | Page loads normally | ☐ |
| 1.2 | Check DevTools → Application → Manifest | Manifest parsed, no warnings | ☐ |
| 1.3 | Look for browser install icon (address bar) | Install button appears after ~30s | ☐ |
| 1.4 | Click install or use ⋮ → "Install MagmaBot" | App installs, opens in standalone window | ☐ |
| 1.5 | Verify standalone window has no address bar | Title bar shows "MagmaBot Command Center" | ☐ |

## 2. Offline Load

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 2.1 | After install, disconnect network (airplane mode) | — | ☐ |
| 2.2 | Refresh the PWA window | Cached shell loads (index.html, favicon) | ☐ |
| 2.3 | Check DevTools → Application → Cache Storage | `magmabot-v1` cache exists with entries | ☐ |
| 2.4 | Navigate to a page that requires API | Graceful error shown (not browser offline) | ☐ |
| 2.5 | Reconnect network and refresh | Full app loads, API reconnects | ☐ |

## 3. Cache Update Behavior

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 3.1 | Deploy a new version (update `sw.js` cache name) | — | ☐ |
| 3.2 | Open app (still serving old cache) | Old version shows initially | ☐ |
| 3.3 | Refresh/reopen the app | New SW activates, new content loads | ☐ |
| 3.4 | Verify old cache is cleaned up | Only new cache name remains in Cache Storage | ☐ |
| 3.5 | Check DevTools → Application → Service Workers | New SW is active & controlling | ☐ |

## 4. Edge Cases

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 4.1 | Open in Firefox / Safari | SW registers, basic caching works | ☐ |
| 4.2 | Clear site data and reload | App re-caches, install prompt reappears | ☐ |
| 4.3 | Multiple tabs open during SW update | All tabs pick up new SW after close/reopen | ☐ |

---

> **Note:** The current `sw.js` uses a network-first strategy for API calls and caches only the shell assets. If a richer offline experience is needed, add API response caching with TTL.
