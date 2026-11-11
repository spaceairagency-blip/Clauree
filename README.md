# Clauree (Python / Flask)

Bookmarklet for Claude free-tier users: live usage widget, pre-send cost warning, prompt queue with auto-resume,
Grok prompt planner, and "Continue With Clauree" (Google AI Studio / Gemini) when your limit is reached.
Clauree does not alter or evade Anthropic's limits.

## Files
- `app.py` - the whole server (landing page, bookmarklet, Grok proxy). No build step.
- `assets/clauree.js` - the bookmarklet code that runs on claude.ai
- `assets/index.html` - landing page + Grok planner (`/#planner`) + Gemini chat (`/#continue`)
- `requirements.txt` - `flask`, `waitress`

## API keys (environment variables)
| Name | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio key for "Continue With Clauree" |
| `XAI_API_KEY` | xAI key for the Grok planner (optional; free alternative: the "Copy and open grok.com" button) |
| `GEMINI_MODEL`, `GROK_MODEL` | Optional model names (defaults: `gemini-2.5-flash`, `grok-4`) |
| `HOST` | Optional: your public https address if the auto-detected one is wrong |

Where to put them: the host's environment-variables panel if it has one, otherwise a `.env` file next to `app.py`
(copy `.env.example`). `.env` is git-ignored, so upload it to the host by hand, never through GitHub.

Heads-up: anyone who opens your site can use your keys' quota through the popups. The server limits this to
15 requests/min per IP, but keep the URL to yourself or add an access code. Users may also paste their own key in the popups.

## Deploy 24/7 on Wispbyte (laptop can be off)
1. Put this folder on GitHub (see below), or download it as a zip.
2. In Wispbyte create a **Python** server. Upload `app.py`, `requirements.txt` and the `assets/` folder
   (file manager; unzip there if it supports it).
3. Startup file: `app.py`. Make sure `requirements.txt` gets installed (many panels do it automatically on start;
   otherwise run `pip install -r requirements.txt` once in the console).
4. The app reads the port from `SERVER_PORT` (then `PORT`, then 8080) and binds `0.0.0.0`.
5. Add your env vars (above), start the server, and open its public URL / subdomain. If the bookmarklet points to the wrong address, set `HOST` and restart.
6. Drag the Clauree button to your bookmarks bar. Done.
If the page doesn't load, check the console for the port the panel assigned and confirm the app is listening on it.

## GitHub
    git init && git add . && git commit -m "Clauree"
    git branch -M main
    git remote add origin https://github.com/YOUR_USER/clauree.git
    git push -u origin main
Never commit API keys; put them in the host's environment variables.

## Run locally (optional)
    pip install -r requirements.txt
    python app.py        # http://localhost:8080
