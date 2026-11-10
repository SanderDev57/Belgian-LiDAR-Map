"""Re-run a browser test package locally without fetching any terrain tiles."""
import argparse
import base64
import json
import math
import threading
from pathlib import Path
import numpy as np
from engines import Engines
from server import validate_grid
from registry import MODELS


def replay(package,model,threshold=.6):
    if package.get('schema')!='belgian-lidar-test-package' or package.get('version')!=1:raise ValueError('Unsupported test package')
    grid=package['dem']
    if grid.get('encoding')!='float32-little-endian-base64' or grid.get('projection')!='Web Mercator pixel coordinates, zoom 17, tileSize 512':raise ValueError('Unsupported raster format')
    if grid.get('halo')!=104:raise ValueError('Replay AI models from a package exported in AI mode (104 m margin), not rules-only mode')
    dem=validate_grid(grid,base64.b64decode(grid['data'],validate=True))
    output=Engines().run(model,dem,grid,threshold,threading.Event(),lambda p,m:print(f'{round(p)}% {m}',flush=True))
    origin=grid['origin'];step=grid['step'];world=512*2**17
    if not all(isinstance(v,(int,float))and math.isfinite(v) for v in (origin['x'],origin['y'],step))or step<=0:raise ValueError('Invalid grid placement')
    def ll(x,y):
        px=origin['x']+(x+.5)*step;py=origin['y']+(y+.5)*step
        return [px/world*360-180,math.degrees(math.atan(math.sinh(math.pi*(1-2*py/world))))]
    features=[]
    for r in output['results']:
        corners=[ll(r['minX']-.5,r['maxY']+.5),ll(r['maxX']+.5,r['maxY']+.5),ll(r['maxX']+.5,r['minY']-.5),ll(r['minX']-.5,r['minY']-.5)]
        features.append(dict(type='Feature',geometry=dict(type='Polygon',coordinates=[corners+[corners[0]]]),properties={k:r[k]for k in ('type','engine','score','scoreKind','modelRevision')}))
    return dict(type='FeatureCollection',terrainSource='Mapterhorn Terrarium',terrainAttribution='https://mapterhorn.com/attribution/',pipelineVersion='scan-model-lab-v1',scanEngines=[model],features=features,modelInfo=output['modelInfo'],details=output['details'])

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('package');p.add_argument('--model',choices=MODELS,default='tumulus');p.add_argument('--threshold',type=float,default=.6);p.add_argument('--output',required=True);args=p.parse_args()
    if not .1<=args.threshold<=.95:p.error('Threshold must be 0.1–0.95')
    try:
        source=Path(args.package)
        if source.stat().st_size>8_000_000:raise ValueError('Test package too large')
        output=replay(json.loads(source.read_text(encoding='utf-8')),args.model,args.threshold)
        Path(args.output).write_text(json.dumps(output,indent=2,allow_nan=False)+'\n',encoding='utf-8')
    except (ValueError,KeyError,TypeError)as error:p.exit(1,f'Replay failed: {error}\n')
