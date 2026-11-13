# Clauree

Usage strip above the Claude chat box: estimated limit use, forecast, reset countdown, prompt planner (Grok, Gemini fallback), queue-and-auto-send, and context copy.

## Supabase (stores your data)
Run `clauree-supabase.sql` once in Supabase > SQL Editor. It is safe to run again and never deletes your data.
- `clauree_sync`: your limit hits and finished usage windows (numbers and times only, never chat text), found by a hash of your sync key.
- `clauree_rate`: hourly request counters that protect your AI keys, shared across all servers.
Without the two Supabase variables everything still works: the AI limit falls back to server memory and sync shows an error.

Sync in the widget: Details > open the drawer (✦) > History > Turn on sync. Copy the key to another browser with I have a key.

## Deploy
1. Push this folder to a GitHub repo and import it in Vercel (no build step).
2. In Vercel > Settings > Environment Variables add:
   - `XAI_API_KEY` (your xAI key)
   - `GEMINI_API_KEY` (your Gemini key)
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API; the service role key is secret and is only used inside `api/`)
   - optional: `XAI_MODEL` (default `grok-3-mini`), `GEMINI_MODEL` (default `gemini-2.5-flash`)
3. Redeploy, open your site, drag the Clauree button to your bookmarks bar, open claude.ai and click it.

## Files
- `public/clauree.js`: the whole engine and widget. The install button is built from this file, so there is only one copy.
- `public/index.html`: install page and a demo that mimics Claude's page.
- `public/bridge.html`: popup used when claude.ai blocks direct calls to your server.
- `api/ai.js`: planner endpoint (Grok first, Gemini second, keys stay on the server).

## If detection stops working
Claude's page can change. Selectors and the limit-banner pattern are at the top of `clauree.js` (`C`). Override them without editing code by running this once in the claude.ai console:
`localStorage.setItem('clr.cfg', JSON.stringify({composer:'...',send:'...'}))`

## Check these first on the real site
1. The strip appears above the chat box.
2. After you send a message and Claude answers, "messages" goes up in Details.
3. When you hit the limit, the bar changes to "Limit reached" and shows a reset time. If it does not, copy the exact limit message and adjust `banner()` / `parseReset()`.

## Mobile
- **iPhone (Safari):** on the install page, add any bookmark, then edit it and paste the copied script as its URL. Open claude.ai and tap the bookmark from the bookmarks menu each time.
- **Android (Firefox):** best option. Build the extension (below), or use the bookmarklet: type the bookmark's name in the address bar and tap the suggestion.
- **The Claude app itself cannot be extended.** Use claude.ai in the browser, or the Clauree app (PWA) next to it.

### Extension (Firefox Android, and desktop Chrome / Edge / Firefox)
1. `node scripts/build-extension.js https://YOUR-SITE.vercel.app`
2. Desktop: load `extension/dist` as an unpacked extension. Firefox Android: zip the contents of `extension/dist` and submit it to addons.mozilla.org (free developer account) for signing, then install it from there.
The extension runs automatically on every claude.ai page. Rebuild and resubmit it when `public/clauree.js` changes.

### Clauree app (PWA) at /app/
Open `https://YOUR-SITE.vercel.app/app/` on your phone and choose Add to Home screen. It never keeps an old copy: every file is fetched fresh, so each push to GitHub (which Vercel deploys) reaches the app on its next launch, and the app reloads itself when an update lands. On Android, installed PWAs appear in the Share menu, so you can share text from the Claude app straight into Clauree.

## Run locally
1. `cp .env.example .env.local` and fill in your keys (never commit `.env.local`).
2. `node scripts/dev.js` (Node 18 or newer, nothing to install).
3. Open http://localhost:3000 (site), /dashboard.html, and /app/ (the PWA).
Without keys the pages still load; the AI endpoints answer "Both AI providers failed" and sync says it is not set up.
