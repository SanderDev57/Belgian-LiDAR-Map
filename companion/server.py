"""Loopback-only map + model inference service. Run from any directory with Python 3.12."""
import argparse
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
from pathlib import Path
import re
import threading
import time
from urllib.parse import urlsplit
import uuid
import numpy as np
from engines import Engines, Cancelled
from registry import catalog, MODELS

ROOT=Path(__file__).resolve().parent.parent
MAX_CELLS=700000
MAX_BODY=MAX_CELLS*4


def validate_grid(metadata, body):
    if not isinstance(metadata,dict):raise ValueError('Invalid metadata')
    for key in ('width','height','halo'):
        if type(metadata.get(key)) is not int:raise ValueError('Invalid raster dimensions')
    w,h,halo=metadata['width'],metadata['height'],metadata['halo']
    if not (1<=w<=808 and 1<=h<=808 and w*h<=MAX_CELLS and halo==104):
        raise ValueError('Model scans require a bounded raster with a 104 m context margin')
    if metadata.get('cellSize')!=1:raise ValueError('Model adapter requires 1 m sampling')
    for key,dim in [('widthM',w),('heightM',h)]:
        v=metadata.get(key)
        if isinstance(v,bool) or not isinstance(v,(int,float)) or not np.isfinite(v) or not 30<=v<=600 or dim!=int(np.ceil(v))+2*halo:
            raise ValueError('Invalid selected area')
    if len(body)!=w*h*4:raise ValueError('Raster body length mismatch')
    dem=np.frombuffer(body,dtype='<f4').copy().reshape(h,w)
    # Missing DEMs are not imputed for inference: avoid artificial steps at gaps.
    if not np.isfinite(dem).all() or np.any(dem<=-500) or np.any(dem>=9000):
        raise ValueError('AI scan requires complete, plausible elevation values; missing data was found')
    return dem


class Jobs:
    def __init__(self,engine=None):
        self.engine=engine or Engines();self.lock=threading.Lock();self.jobs=OrderedDict()
        self.executor=ThreadPoolExecutor(max_workers=1)

    def submit(self,dem,metadata,model,threshold):
        with self.lock:
            request_id=metadata.get('requestId',uuid.uuid4().hex)
            if not isinstance(request_id,str) or not re.fullmatch(r'[0-9a-f]{32}',request_id):raise ValueError('Invalid request ID')
            if request_id in self.jobs:
                if self.jobs[request_id]['state']=='cancelled':return dict(id=request_id)
                raise ValueError('Duplicate request ID')
            if any(j['state']=='running' for j in self.jobs.values()):raise RuntimeError('A scan is already running. Cancel it or wait for completion.')
            job=dict(id=request_id,state='running',progress=0,message='Queued',cancel=threading.Event(),created=time.time())
            self.jobs[job['id']]=job
            while len(self.jobs)>16:self.jobs.popitem(last=False)
            self.executor.submit(self.run,job,dem,metadata,model,threshold)
            return dict(id=job['id'])

    def run(self,job,dem,metadata,model,threshold):
        def progress(percent,message):
            with self.lock:job.update(progress=round(percent),message=message)
        try:
            result=self.engine.run(model,dem,metadata,threshold,job['cancel'],progress)
            with self.lock:
                if job['cancel'].is_set():job.update(state='cancelled',message='Cancelled')
                else:job.update(state='complete',progress=100,result=result,message='Complete')
        except Cancelled:
            with self.lock:job.update(state='cancelled',message='Cancelled')
        except Exception as error:
            with self.lock:job.update(state='failed',message=f'{type(error).__name__}: {error}')

    def get(self,key):
        with self.lock:
            job=self.jobs.get(key)
            if not job or time.time()-job['created']>1800:return None
            return {k:v for k,v in job.items() if k not in ('cancel','created')}

    def cancel(self,key):
        with self.lock:
            if key not in self.jobs:
                self.jobs[key]=dict(id=key,state='cancelled',progress=0,message='Cancelled before upload completed',cancel=threading.Event(),created=time.time())
                while len(self.jobs)>16:
                    old=next((k for k,j in self.jobs.items() if j['state']!='running'),None)
                    if old is None:break
                    del self.jobs[old]
                return True
            self.jobs[key]['cancel'].set()
            self.jobs[key].pop('result',None)
            if self.jobs[key]['state']!='running':self.jobs[key]['state']='cancelled'
            return True


class Handler(BaseHTTPRequestHandler):
    protocol_version='HTTP/1.1'

    def setup(self):
        super().setup();self.connection.settimeout(30)

    def log_message(self,format,*args):
        # Do not log scan coordinates, raw DEMs or user feedback.
        if not self.path.startswith('/api/scans/'):
            super().log_message(format,*args)

    def authorised(self):
        allowed={f'127.0.0.1:{self.server.server_port}',f'localhost:{self.server.server_port}'}
        if self.headers.get('Host') not in allowed:return False
        origin=self.headers.get('Origin')
        if origin and origin not in {'http://'+host for host in allowed}:return False
        site=self.headers.get('Sec-Fetch-Site')
        return site not in ('cross-site',)

    def reply(self,status,data):
        payload=json.dumps(data,allow_nan=False).encode()
        self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(payload)));self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff');self.send_header('Connection','close');self.close_connection=True;self.end_headers()
        try:self.wfile.write(payload)
        except (BrokenPipeError,ConnectionResetError):pass

    def do_GET(self):
        if not self.authorised():return self.reply(403,dict(error='Only the local map origin is permitted'))
        path=urlsplit(self.path).path
        if path=='/api/models':return self.reply(200,dict(service='belgian-lidar-models',version=1,models=catalog(),contextMargin=104))
        if path.startswith('/api/scans/'):
            job=self.server.jobs.get(path.split('/')[-1])
            return self.reply(200 if job else 404,job or dict(error='Scan not found or expired'))
        relative='index.html' if path=='/' else path.lstrip('/')
        file=(ROOT/relative).resolve()
        allowed=(relative in ('index.html','Belgian-LiDAR-Map.html') or relative.startswith(('js/','css/','vendor/','licenses/')))
        if not allowed or not file.is_relative_to(ROOT) or not file.is_file() or any(p.startswith('.')for p in Path(relative).parts):
            return self.reply(404,dict(error='Not found'))
        data=file.read_bytes();self.send_response(200)
        self.send_header('Content-Type',mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
        self.send_header('Content-Length',str(len(data)));self.send_header('Cache-Control','no-cache');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Connection','close');self.close_connection=True;self.end_headers()
        try:self.wfile.write(data)
        except (BrokenPipeError,ConnectionResetError):pass

    def do_POST(self):
        if not self.authorised():return self.reply(403,dict(error='Only the local map origin is permitted'))
        if urlsplit(self.path).path!='/api/scans':return self.reply(404,dict(error='Not found'))
        try:
            if self.headers.get('Transfer-Encoding'):raise ValueError('Chunked bodies are not supported')
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=MAX_BODY:raise ValueError('Raster body is missing or too large')
            if self.headers.get('Content-Type')!='application/octet-stream':raise ValueError('Expected binary float32 DEM')
            header=self.headers.get('X-Scan-Metadata','')
            if len(header)>4096:raise ValueError('Metadata too large')
            metadata=json.loads(header)
            if not isinstance(metadata,dict):raise ValueError('Invalid metadata')
            model=metadata.get('model');threshold=metadata.get('threshold',.6)
            if model not in MODELS:raise ValueError('Unknown model')
            if isinstance(threshold,bool) or not isinstance(threshold,(int,float)) or not .1<=threshold<=.95:raise ValueError('Invalid score threshold')
            if not next(m['installed'] for m in catalog() if m['id']==model):raise ValueError(f'Model not installed. Run: python companion/setup_models.py {model}')
            dem=validate_grid(metadata,self.rfile.read(length))
            return self.reply(202,self.server.jobs.submit(dem,metadata,model,threshold))
        except RuntimeError as error:return self.reply(409,dict(error=str(error)))
        except (ValueError,TypeError,KeyError) as error:return self.reply(400,dict(error=str(error)))

    def do_DELETE(self):
        if not self.authorised():return self.reply(403,dict(error='Only the local map origin is permitted'))
        path=urlsplit(self.path).path
        if not re.fullmatch(r'/api/scans/[0-9a-f]{32}',path):return self.reply(404,dict(error='Not found'))
        found=self.server.jobs.cancel(path.split('/')[-1]);return self.reply(200 if found else 404,dict(cancelled=found))

    def do_OPTIONS(self):
        self.reply(403,dict(error='Cross-origin access is disabled. Open the map from this companion server.'))


def make_server(port=8765,jobs=None):
    server=ThreadingHTTPServer(('127.0.0.1',port),Handler)
    server.jobs=jobs or Jobs();return server


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--port',type=int,default=8765)
    args=parser.parse_args()
    try:
        server=make_server(args.port)
        print(f'Open http://127.0.0.1:{server.server_port} in your browser. Keep this terminal open.',flush=True)
        print('Loopback only. No model weights are downloaded automatically. Ctrl+C stops the server.',flush=True)
        server.serve_forever()
    except KeyboardInterrupt:
        for key in list(server.jobs.jobs):server.jobs.cancel(key)
        server.shutdown();server.server_close()
