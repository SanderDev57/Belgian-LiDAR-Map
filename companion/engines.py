"""CPU inference adapters. Model scores are not calibrated archaeological probabilities."""
import importlib.util
import math
import threading
from pathlib import Path
import numpy as np
from scipy.ndimage import uniform_filter
from registry import MODELS, ROOT, verified_path


class Cancelled(Exception):
    pass


def check(cancel):
    if cancel.is_set():
        raise Cancelled('Scan cancelled')


def load_helper(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'vendor' / 'tumulus' / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Engines:
    def __init__(self):
        self.loaded = {}

    def load(self, key):
        if key in self.loaded:
            return self.loaded[key]
        import torch
        torch.set_num_threads(4)
        path = verified_path(key)
        # Explicit safe loading: never fall back to arbitrary pickle execution.
        checkpoint = torch.load(path, map_location='cpu', weights_only=True)
        if key == 'tumulus':
            from torch import nn
            class Net(nn.Module):
                def __init__(self):
                    super().__init__()
                    self.c = nn.Sequential(nn.Conv2d(4,16,3,2,1),nn.ReLU(),nn.Conv2d(16,32,3,2,1),nn.ReLU(),nn.Conv2d(32,64,3,2,1),nn.ReLU(),nn.AdaptiveAvgPool2d(1))
                    self.f = nn.Linear(64,1)
                def forward(self, x):
                    return self.f(self.c(x).flatten(1)).squeeze(1)
            model = Net()
            state = checkpoint
        else:
            from torchvision.models.detection import fasterrcnn_resnet50_fpn_v2
            from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
            model = fasterrcnn_resnet50_fpn_v2(weights=None, weights_backbone=None)
            model.roi_heads.box_predictor = FastRCNNPredictor(model.roi_heads.box_predictor.cls_score.in_features,2)
            state = checkpoint.get('state_dict', checkpoint)
        model.load_state_dict(state, strict=True)
        model.eval()
        # Keep just one large ADAF network resident at once.
        if key.startswith('adaf-'):
            for old in list(self.loaded):
                if old.startswith('adaf-'):
                    del self.loaded[old]
        self.loaded[key] = model
        return model

    def run(self, key, dem, meta, threshold, cancel, progress):
        check(cancel); progress(5, 'Loading checksum-verified model')
        model = self.load(key)
        check(cancel)
        if key == 'tumulus':
            results, details = self.tumulus(model,dem,meta,threshold,cancel,progress)
        else:
            results, details = self.adaf(model,dem,meta,threshold,cancel,progress)
        check(cancel)
        for result in results:
            result.update(type=MODELS[key]['types'][0], engine=key, scoreKind='model', modelRevision=MODELS[key]['revision'])
        return dict(results=results[:150], candidates=len(results), model=key,
            modelInfo={k:v for k,v in MODELS[key].items() if k not in ('url','file')},
            threshold=threshold, details=details, adapterVersion='scan-model-lab-v1',
            warning='Experimental geographic transfer. Model scores are not confirmed finds, dates or calibrated probabilities.')

    @staticmethod
    def tumulus(model,dem,meta,threshold,cancel,progress):
        import torch
        lt=load_helper('lib_tumul'); channels=load_helper('lib_channels')
        # Upstream 2 m multiscale matched-filter proposals; the original numerical
        # and four-channel image recipes are retained. Our ranking is raw CNN,
        # not the upstream Romanian fusion score or its post-filter thresholds.
        relief=lt.slrm2(dem,1.0)
        detections=lt.detect(relief,exclude_margin=25)
        halo=meta['halo']; width=meta['widthM']; height=meta['heightM']
        proposals=[d for d in detections if halo<=d[1]*2<halo+width and halo<=d[0]*2<halo+height]
        proposals.sort(key=lambda d:-d[2])
        truncated=len(proposals)>100
        proposals=proposals[:100]
        check(cancel); progress(20,f'Checking {len(proposals)} mound proposals')
        results=[]
        for index,(y,x,zscore,scale) in enumerate(proposals):
            check(cancel)
            py,px=y*2,x*2
            stamps=[]
            for dy in (-12,0,12):
                for dx in (-12,0,12):
                    patch=dem[py+dy-40:py+dy+40,px+dx-40:px+dx+40]
                    if patch.shape==(80,80):
                        stamp=channels.stamp_multi(patch,1.0,['hs','slrm','slope','rough'])
                        if stamp is not None:
                            stamps.append(stamp)
            if not stamps:
                continue
            with torch.inference_mode():
                probabilities=torch.sigmoid(model(torch.from_numpy(np.stack(stamps)).float()/255)).numpy()
            check(cancel)
            score=float(probabilities.max())
            if score>=threshold:
                # Centred radial half-height is an approximate footprint, not a survey outline.
                radius=max(8,min(30,20*scale))
                results.append(dict(type='mound',score=round(score*100,1),cx=px,cy=py,
                    minX=px-radius,minY=py-radius,maxX=px+radius,maxY=py+radius,
                    area=round(math.pi*radius*radius),relief=round(float(relief[y,x]),3),
                    footprint='Approximate mound search footprint; classifier context is 80 × 80 m'))
            progress(20+75*(index+1)/max(1,len(proposals)),f'Classified {index+1}/{len(proposals)} mound proposals')
        results.sort(key=lambda r:-r['score'])
        return results,dict(proposals=len(proposals),proposalLimitReached=truncated,
            preprocessing='Upstream 2 m matched-filter proposals; 80 m four-channel stamps, nine offsets; raw CNN maximum',
            limitation='Adapted proposal classifier, not the upstream full Romanian fusion pipeline. Inference samples are 1 m, independent of native source resolution.')

    @staticmethod
    def adaf(model,dem,meta,threshold,cancel,progress):
        import torch
        from torchvision.ops import nms
        # ADAF adaf_vis.py: 10 m SLRM radius; fixed [-0.5,+0.5] normalisation.
        visual=np.clip(dem-uniform_filter(dem,size=21,mode='reflect')+.5,0,1).astype(np.float32)
        h,w=dem.shape; size=512
        def starts(length):
            if length<=size:return [0]
            return sorted(set([*range(0,length-size+1,384),length-size]))
        patches=[(x,y)for y in starts(h)for x in starts(w)]
        boxes=[];scores=[]
        for index,(x,y) in enumerate(patches):
            check(cancel)
            patch=visual[y:min(y+size,h),x:min(x+size,w)]
            patch=np.pad(patch,((0,size-patch.shape[0]),(0,size-patch.shape[1])),mode='reflect')
            tensor=torch.from_numpy(np.stack([patch]*3))
            with torch.inference_mode():
                prediction=model([tensor])[0]
            check(cancel)
            for box,score,label in zip(prediction['boxes'].numpy(),prediction['scores'].numpy(),prediction['labels'].numpy()):
                if label!=1 or score<threshold:continue
                x0,y0,x1,y1=map(float,box);x0+=x;x1+=x;y0+=y;y1+=y
                cx=(x0+x1)/2;cy=(y0+y1)/2
                if not (meta['halo']<=cx<meta['halo']+meta['widthM'] and meta['halo']<=cy<meta['halo']+meta['heightM']):continue
                if x0<0 or y0<0 or x1>w or y1>h or x1<=x0 or y1<=y0:continue
                boxes.append([x0,y0,x1,y1]);scores.append(float(score))
            progress(15+80*(index+1)/len(patches),f'ADAF patch {index+1}/{len(patches)}')
        results=[]
        if boxes:
            keep=nms(torch.tensor(boxes),torch.tensor(scores),.3).tolist()
            for k in keep:
                x0,y0,x1,y1=boxes[k]
                results.append(dict(score=round(scores[k]*100,1),cx=(x0+x1)/2,cy=(y0+y1)/2,
                    minX=x0,minY=y0,maxX=x1,maxY=y1,area=round((x1-x0)*(y1-y0)),relief=None,
                    footprint='ADAF object-detection bounding box'))
        return results,dict(patches=len(patches),preprocessing='10 m SLRM, fixed [-0.5,+0.5] stretch, three replicated channels; 512 px patches, overlap, IoU 0.3 NMS',
            limitation='CPU adapter for official ADAF Faster R-CNN v2 checkpoints. Geographic transfer to Belgium has not been accuracy-validated.')
