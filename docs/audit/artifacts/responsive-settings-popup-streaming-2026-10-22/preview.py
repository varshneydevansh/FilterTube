import subprocess
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs
import mimetypes
import time

ROOT = Path(__file__).resolve().parents[4]
BASELINE = '54d1396a'
OLD = subprocess.check_output(['git', 'show', f'{BASELINE}:js/ui-shell/popup-shell.js'], cwd=ROOT)
OLD_SEED = subprocess.check_output(['git', 'show', f'{BASELINE}:js/seed.js'], cwd=ROOT)
PARENT = '''<!doctype html><meta charset="utf-8"><title>FilterTube popup sizing check</title>
<style>body{font:16px system-ui;background:#edf3f6;color:#23313a;margin:28px}h1{font-size:24px}main{display:flex;gap:32px;align-items:flex-start}section h2{font-size:16px}iframe{border:1px solid #bbc9cf;border-radius:18px;background:white;height:580px}output{display:block;margin:12px 0;font-family:monospace}p{max-width:65ch;line-height:1.5}</style>
<h1>Popup sizing regression check</h1><p>Both frames begin at 25 pixels. Each uses the actual bundled popup shell and styles. This models the browser sizing the popup from its document; it is not an installed-extension test.</p>
<main><section><h2>Previous build</h2><output id="beforeResult">Loading</output><iframe id="before" width="25" src="/case?baseline=1"></iframe></section>
<section><h2>Corrected build</h2><output id="afterResult">Loading</output><iframe id="after" width="25" src="/case"></iframe></section></main>
<script>for(const id of ['before','after']){const f=document.getElementById(id);f.onload=()=>{let n=0;const resize=()=>{const w=f.contentDocument.documentElement.getBoundingClientRect().width;f.style.width=w+'px';document.getElementById(id+'Result').textContent=Math.round(w)+' px';if(++n<4)requestAnimationFrame(resize)};resize()}}</script>'''

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        u = urlsplit(self.path)
        if u.path == '/':
            body, mime = PARENT.encode(), 'text/html'
        elif u.path == '/stream-check':
            body = b'''<!doctype html><title>FilterTube streaming delivery check</title><style>body{font:16px system-ui;margin:28px;background:#edf3f6;color:#23313a}main{display:flex;gap:24px}iframe{width:420px;height:260px;border:1px solid #bbc9cf;border-radius:16px;background:white}p{max-width:70ch;line-height:1.5}</style><h1>Streamed player delivery</h1><p>Both cases receive the same player record immediately and the recommendations three seconds later. These use production seed scripts on a local synthetic response, not installed YouTube playback.</p><main><iframe title="Previous code" src="/stream-case?baseline=1"></iframe><iframe title="Corrected code" src="/stream-case"></iframe></main>'''
            mime = 'text/html'
        elif u.path == '/stream-case':
            seed = '/baseline-seed.js' if parse_qs(u.query).get('baseline') else '/js/seed.js'
            label = 'Previous code' if parse_qs(u.query).get('baseline') else 'Corrected code'
            body = ('''<!doctype html><meta charset="utf-8"><style>body{font:16px system-ui;padding:16px;color:#23313a}p{line-height:1.5}strong{color:#146940}</style><h2>''' + label + '''</h2><p id="status">Starting</p><script src="''' + seed + '''"></script><script>
window.filterTube.updateSettings({enabled:true,hideSponsoredCards:true,listMode:'blocklist'});
(async()=>{const t=performance.now(),log=[];const status=document.getElementById('status');const elapsed=()=>((performance.now()-t)/1000).toFixed(3)+' s';const response=await fetch('/youtubei/v1/get_watch');log.push('Headers: '+elapsed());let first=false,text='';const decoder=new TextDecoder();const reader=response.body.getReader();for(;;){const chunk=await reader.read();if(chunk.done)break;text+=decoder.decode(chunk.value,{stream:true});if(!first&&text.includes('subStreamResponseCompleted')){first=true;log.push('Filtered player record: '+elapsed());status.innerHTML=log.join('<br>')}}const payload=JSON.parse(text);log.push('Recommendations complete: '+elapsed());log.push(payload[0].playerResponse.playerAds?'AD PLAN LEAKED':'<strong>Ad plan removed</strong>');status.innerHTML=log.join('<br>')})().catch(e=>document.getElementById('status').textContent=e.message)
</script>''').encode()
            mime = 'text/html'
        elif u.path == '/youtubei/v1/get_watch':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(b'[{"playerResponse":{"videoDetails":{"videoId":"abcdefghijk","lengthSeconds":"171"},"playerAds":[{}]},"responseType":"PLAYER_RESPONSE","subStreamResponseCompleted":true},')
            self.wfile.flush()
            time.sleep(3)
            self.wfile.write(b'{"watchNextResponse":{"contents":[]},"responseType":"WATCH_NEXT_RESPONSE","subStreamResponseCompleted":true}]')
            self.wfile.flush()
            return
        elif u.path == '/baseline-seed.js':
            body, mime = OLD_SEED, 'text/javascript'
        elif u.path == '/js/seed.js':
            body, mime = (ROOT / 'js/seed.js').read_bytes(), 'text/javascript'
        elif u.path == '/case':
            script = '/baseline.js' if parse_qs(u.query).get('baseline') else '/js/ui-shell/popup-shell.js'
            body = ('''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/css/design_tokens.css"><link rel="stylesheet" href="/css/components.css"><link rel="stylesheet" href="/css/popup.css"><link rel="stylesheet" href="/css/serene-shell.css"></head>
<body><div id="popupRoot"></div><script src="''' + script + '''"></script></body></html>''').encode()
            mime = 'text/html'
        elif u.path == '/baseline.js':
            body, mime = OLD, 'text/javascript'
        elif u.path.startswith(('/css/', '/icons/', '/assets/', '/js/ui-shell/')):
            p = (ROOT / u.path.lstrip('/')).resolve()
            if not p.is_relative_to(ROOT) or not p.is_file():
                self.send_error(404)
                return
            body, mime = p.read_bytes(), mimetypes.guess_type(p)[0] or 'application/octet-stream'
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

ThreadingHTTPServer(('127.0.0.1', 8766), Handler).serve_forever()
