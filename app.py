"""Clauree server (Python/Flask): landing page, bookmarklet, Grok + Gemini proxies. API keys live in env vars."""
import os, re, json, time, urllib.request, urllib.error, urllib.parse
from pathlib import Path
from flask import Flask, request, jsonify, Response, stream_with_context
from werkzeug.middleware.proxy_fix import ProxyFix

try:  # loads a local .env file if python-dotenv is installed (never commit .env)
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / '.env')
except ImportError:
    pass

BASE = Path(__file__).parent
JS = (BASE / 'assets' / 'clauree.js').read_text(encoding='utf-8')
PAGE = (BASE / 'assets' / 'index.html').read_text(encoding='utf-8')
SYS = ('You are a prompt-engineering assistant. Rewrite the rough request into one clear, complete '
       'prompt that gets an excellent answer in a single message. Return only the prompt.')

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
hits, cache = {}, {}


def limited():
    """Protects the server's own keys: 15 requests/min per IP."""
    now, ip = time.time(), request.remote_addr
    recent = [t for t in hits.get(ip, []) if now - t < 60]
    if len(recent) >= 15:
        return True
    hits[ip] = recent + [now]
    return False


def bookmarklet(host):
    """Bookmarklet code with this site's address baked in (built on the fly, no build step)."""
    if host not in cache:
        cache[host] = 'javascript:' + urllib.parse.quote(JS.replace('__HOST__', host), safe="()!*~'")
    return cache[host]


@app.get('/')
def home():
    host = (os.environ.get('HOST') or request.host_url).rstrip('/')
    return Response(PAGE.replace('__BOOKMARKLET__', bookmarklet(host)), mimetype='text/html')


@app.get('/healthz')
def healthz():
    return 'ok'


@app.post('/api/grok')
def grok():
    data = request.get_json(silent=True) or {}
    prompt = str(data.get('prompt', ''))[:6000].strip()
    model = str(data.get('model') or os.environ.get('GROK_MODEL') or 'grok-4').strip()
    user_key = request.headers.get('x-xai-key', '').strip()
    key = user_key or os.environ.get('XAI_API_KEY', '')
    if not key:
        return jsonify(text='No xAI key: set XAI_API_KEY on the server (or paste one in the planner).'), 400
    if not prompt:
        return jsonify(text='Empty prompt.'), 400
    if not user_key and limited():
        return jsonify(text='Too many requests, try again in a minute.'), 429
    body = json.dumps({'model': model, 'messages': [{'role': 'system', 'content': SYS},
                                                    {'role': 'user', 'content': prompt}]}).encode()
    req = urllib.request.Request('https://api.x.ai/v1/chat/completions', data=body, headers={
        'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key, 'User-Agent': 'Clauree/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return jsonify(text=json.load(r)['choices'][0]['message']['content'])
    except urllib.error.HTTPError as e:
        return jsonify(text='xAI error %s: %s' % (e.code, e.read().decode()[:300])), 502
    except Exception as e:
        return jsonify(text='Error: %s' % e), 500


def text_err(msg, code):
    return Response(msg, status=code, mimetype='text/plain')


@app.post('/api/gemini')
def gemini():
    """Streams Gemini's reply (server-sent events) through to the browser."""
    data = request.get_json(silent=True) or {}
    contents = data.get('contents')
    model = str(data.get('model') or os.environ.get('GEMINI_MODEL') or 'gemini-2.5-flash').strip()
    user_key = request.headers.get('x-goog-key', '').strip()
    key = user_key or os.environ.get('GEMINI_API_KEY', '')
    if not key:
        return text_err('No Gemini key: set GEMINI_API_KEY on the server (or paste one in the popup).', 400)
    if not isinstance(contents, list) or not contents:
        return text_err('Empty conversation.', 400)
    if not re.fullmatch(r'[A-Za-z0-9._-]+', model):
        return text_err('Invalid model name.', 400)
    body = json.dumps({'contents': contents})
    if len(body) > 300000:
        return text_err('Conversation too long.', 413)
    if not user_key and limited():
        return text_err('Too many requests, try again in a minute.', 429)
    url = 'https://generativelanguage.googleapis.com/v1beta/models/%s:streamGenerateContent?alt=sse' % model
    req = urllib.request.Request(url, data=body.encode(), headers={
        'Content-Type': 'application/json', 'x-goog-api-key': key})
    try:
        up = urllib.request.urlopen(req, timeout=120)
    except urllib.error.HTTPError as e:
        return text_err('Gemini error %s: %s' % (e.code, e.read().decode()[:300]), 502)
    except Exception as e:
        return text_err('Error: %s' % e, 502)

    def gen():
        with up:
            while True:
                chunk = up.read1(4096)
                if not chunk:
                    break
                yield chunk
    return Response(stream_with_context(gen()), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


if __name__ == '__main__':
    port = int(os.environ.get('SERVER_PORT') or os.environ.get('PORT') or 8080)
    print('Clauree listening on port', port, flush=True)
    try:
        from waitress import serve
        serve(app, host='0.0.0.0', port=port, send_bytes=1)  # send_bytes=1 keeps streaming live
    except ImportError:
        app.run(host='0.0.0.0', port=port, threaded=True)
