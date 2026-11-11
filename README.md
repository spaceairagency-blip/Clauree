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
