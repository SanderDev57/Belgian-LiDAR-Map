"""Evaluate independent confirmed reference labels against exported detection GeoJSON."""
import argparse
import json
import math

TYPES=('mound','enclosure','trench','crater','building','road')


def center(feature):
    geometry=feature.get('geometry',{})
    if geometry.get('type')=='Point':
        point=geometry['coordinates']
    elif geometry.get('type')=='Polygon':
        ring=geometry['coordinates'][0]
        point=[(min(p[0]for p in ring)+max(p[0]for p in ring))/2,(min(p[1]for p in ring)+max(p[1]for p in ring))/2]
    else:raise ValueError('Reference/prediction geometry must be Point or Polygon')
    if len(point)<2 or not all(isinstance(v,(int,float)) and math.isfinite(v)for v in point[:2]) or not(-180<=point[0]<=180 and -85<=point[1]<=85):raise ValueError('Invalid WGS84 coordinates')
    return point[:2]


def distance(a,b):
    lat=math.radians((a[1]+b[1])/2)
    return math.hypot(math.radians(a[0]-b[0])*math.cos(lat),math.radians(a[1]-b[1]))*6371008.8


def evaluate(truth,predictions,match_m=20,area_km2=None):
    if not 0<match_m<=100:raise ValueError('Match distance must be 0–100 m')
    refs=truth.get('features',[])
    if not refs:raise ValueError('No independently confirmed reference objects')
    for ref in refs:
        if ref.get('properties',{}).get('verified') is not True:raise ValueError('Reference objects need properties.verified=true; user suggestions are not confirmed ground truth')
        if ref['properties'].get('type')not in TYPES:raise ValueError('Unknown reference type')
        center(ref)
    detections=[f for f in predictions.get('features',[]) if f.get('properties',{}).get('engine')!='manual']
    engines=sorted(set(predictions.get('scanEngines',[]))|{f.get('properties',{}).get('engine','rules')for f in detections})
    if not engines:raise ValueError('An empty prediction file must declare scanEngines so missed objects can be counted')
    report={}
    for engine in engines:
        records=[f for f in detections if f.get('properties',{}).get('engine','rules')==engine]
        kinds={f.get('properties',{}).get('scoreKind','shape')for f in records}
        if len(kinds)>1:raise ValueError('Do not mix model and shape scores within one engine')
        supported=['mound']if engine in ('tumulus','adaf-barrow')else ['enclosure']if engine in ('adaf-enclosure','adaf-ringfort')else list(TYPES)
        engine_refs=[r for r in refs if r['properties']['type']in supported]
        matched=set();tp=0;fp=0;by_type={t:dict(tp=0,fp=0,fn=sum(r['properties']['type']==t for r in engine_refs))for t in supported}
        for prediction in sorted(records,key=lambda f:-float(f['properties'].get('score',0))):
            kind=prediction['properties'].get('type')
            if kind not in supported:raise ValueError('Prediction type outside this engine scope')
            pos=center(prediction)
            options=[(distance(pos,center(ref)),i)for i,ref in enumerate(engine_refs)if i not in matched and ref['properties']['type']==kind]
            best=min(options) if options else (math.inf,-1)
            if best[0]<=match_m:
                matched.add(best[1]);tp+=1;by_type[kind]['tp']+=1;by_type[kind]['fn']-=1
            else:fp+=1;by_type[kind]['fp']+=1
        fn=len(engine_refs)-tp
        def metrics(a,b,c):
            precision=a/(a+b)if a+b else 0;recall=a/(a+c)if a+c else 0
            return dict(tp=a,fp=b,fn=c,precision=precision,recall=recall,f1=2*precision*recall/(precision+recall)if precision+recall else 0)
        report[engine]={**metrics(tp,fp,fn),'supportedTypes':supported,'referenceObjects':len(engine_refs),'byType':{t:metrics(**{'a':v['tp'],'b':v['fp'],'c':v['fn']})for t,v in by_type.items()},
            'falsePositivesPerKm2':fp/area_km2 if area_km2 else None}
    return dict(matchDistanceMetres=match_m,referenceObjects=len(refs),engines=report,
        warning='Metrics require independently checked, complete reference labels and matching evaluation extents. Do not use training areas as held-out tests.')


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('truth');p.add_argument('predictions');p.add_argument('--match-metres',type=float,default=20);p.add_argument('--area-km2',type=float);p.add_argument('--output')
    args=p.parse_args()
    if args.area_km2 is not None and args.area_km2<=0:p.error('Area must be positive')
    try:
        report=evaluate(json.load(open(args.truth,encoding='utf-8')),json.load(open(args.predictions,encoding='utf-8')),args.match_metres,args.area_km2)
        text=json.dumps(report,indent=2,allow_nan=False)
        if args.output:
            with open(args.output,'w',encoding='utf-8')as f:f.write(text+'\n')
        print(text)
    except (ValueError,KeyError,TypeError) as error:p.exit(1,f'Evaluation failed: {error}\n')
