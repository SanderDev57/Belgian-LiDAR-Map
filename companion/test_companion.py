import json
import os
import sys
import threading
import time
import unittest
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from unittest.mock import patch
import numpy as np
from server import Jobs,make_server,validate_grid
from engines import Engines,Cancelled
from evaluate import evaluate
from registry import verified_path


def fixture():
    n=320;y,x=np.mgrid[:n,:n]
    dem=(100+.01*x+.02*y+2*np.exp(-((x-160)**2+(y-160)**2)/(2*7**2))).astype(np.float32)
    return dem,dict(width=n,height=n,halo=104,widthM=112,heightM=112,cellSize=1)


class FakeEngine:
    def run(self,key,dem,meta,threshold,cancel,progress):
        progress(25,'Working')
        if key=='wait':
            if cancel.wait(2):raise Cancelled()
        return dict(results=[],model=key)


class GridAndJobsTests(unittest.TestCase):
    def test_grid_validation_and_missing_values(self):
        dem,meta=fixture();self.assertTrue(np.array_equal(dem,validate_grid(meta,dem.astype('<f4').tobytes())))
        for changed in ({**meta,'halo':16},{**meta,'width':True},{**meta,'widthM':601},{**meta,'cellSize':.5}):
            with self.assertRaises(ValueError):validate_grid(changed,dem.tobytes())
        dem[0,0]=np.nan
        with self.assertRaisesRegex(ValueError,'complete'):validate_grid(meta,dem.tobytes())

    def test_jobs_cancel_upload_race_busy_and_failure(self):
        jobs=Jobs(FakeEngine());dem,meta=fixture()
        try:
            request='a'*32;jobs.cancel(request)
            self.assertEqual(jobs.submit(dem,{**meta,'requestId':request},'tumulus',.6)['id'],request)
            self.assertEqual(jobs.get(request)['state'],'cancelled')
            key=jobs.submit(dem,meta,'wait',.6)['id']
            with self.assertRaises(RuntimeError):jobs.submit(dem,meta,'tumulus',.6)
            jobs.cancel(key)
            for _ in range(200):
                if jobs.get(key)['state']!='running':break
                time.sleep(.005)
            self.assertEqual(jobs.get(key)['state'],'cancelled');self.assertNotIn('result',jobs.get(key))
        finally:jobs.executor.shutdown()


class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server=make_server(0,Jobs(FakeEngine()));cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start();cls.base=f'http://127.0.0.1:{cls.server.server_port}'
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.server.jobs.executor.shutdown()
    def request(self,path,method='GET',data=None,headers=None):
        return urlopen(Request(self.base+path,data=data,headers=headers or {},method=method),timeout=10)
    def test_serves_map_and_models_but_not_private_files(self):
        with self.request('/')as response:self.assertIn(b'scanEngine',response.read())
        with self.request('/api/models')as response:self.assertEqual(json.load(response)['service'],'belgian-lidar-models')
        for path in ['/.git/config','/companion/models/tumulus-multichannel.pt','/js/../../.git/config']:
            with self.assertRaises(HTTPError)as raised:self.request(path)
            self.assertEqual(raised.exception.code,404)
    def test_rejects_cross_origin_and_rebinding(self):
        for headers in [{'Origin':'https://evil.example'},{'Host':'evil.example'},{'Sec-Fetch-Site':'cross-site'}]:
            with self.assertRaises(HTTPError)as raised:self.request('/api/models',headers=headers)
            self.assertEqual(raised.exception.code,403)
    def test_binary_upload_progress_result_and_bad_input(self):
        dem,meta=fixture();meta.update(model='tumulus',threshold=.6,requestId='b'*32)
        with self.request('/api/scans','POST',dem.astype('<f4').tobytes(),{'Content-Type':'application/octet-stream','X-Scan-Metadata':json.dumps(meta)})as response:
            self.assertEqual(response.status,202);key=json.load(response)['id']
        for _ in range(100):
            with self.request('/api/scans/'+key)as response:job=json.load(response)
            if job['state']!='running':break
            time.sleep(.005)
        self.assertEqual(job['state'],'complete');self.assertEqual(job['result']['model'],'tumulus')
        for metadata in ('[]',json.dumps({**meta,'model':'../../evil'})):
            with self.assertRaises(HTTPError)as raised:self.request('/api/scans','POST',b'x',{'Content-Type':'application/octet-stream','X-Scan-Metadata':metadata})
            self.assertEqual(raised.exception.code,400)


class EvaluationTests(unittest.TestCase):
    def feature(self,x,kind='mound',engine='rules',verified=True,score=70):
        return dict(type='Feature',geometry=dict(type='Point',coordinates=[5+x,50]),properties=dict(type=kind,engine=engine,verified=verified,score=score,scoreKind='shape'))
    def test_empty_model_results_still_count_misses_in_supported_classes(self):
        truth=dict(features=[self.feature(0),self.feature(.001,'trench')])
        report=evaluate(truth,dict(features=[],scanEngines=['tumulus']))['engines']['tumulus']
        self.assertEqual(report['fn'],1);self.assertEqual(report['recall'],0);self.assertEqual(report['supportedTypes'],['mound'])

    def test_independent_class_aware_one_to_one_matching(self):
        truth=dict(features=[self.feature(0),self.feature(.001)])
        predictions=dict(features=[self.feature(0),self.feature(.00001),self.feature(.001,'road')])
        r=evaluate(truth,predictions,20,1)['engines']['rules']
        self.assertEqual((r['tp'],r['fp'],r['fn']),(1,2,1));self.assertEqual(r['falsePositivesPerKm2'],2)
        with self.assertRaisesRegex(ValueError,'verified'):evaluate(dict(features=[self.feature(0,verified=False)]),predictions)


@unittest.skipUnless(os.environ.get('RUN_MODEL_SMOKE')=='1','Set RUN_MODEL_SMOKE=1 to exercise installed pretrained weights')
class RealModelTests(unittest.TestCase):
    def test_real_tumulus_and_adaf_mound_checkpoints(self):
        engine=Engines();dem,meta=fixture()
        for key in ('tumulus','adaf-barrow'):
            verified_path(key)
            output=engine.run(key,dem,meta,.35,threading.Event(),lambda *args:None)
            self.assertEqual(output['model'],key)
            self.assertTrue(all(r['engine']==key and r['scoreKind']=='model'for r in output['results']))
            if key=='adaf-barrow':self.assertTrue(any(r['type']=='mound'for r in output['results']))
            else:self.assertGreater(output['details']['proposals'],0)
        if os.path.exists('companion/models/OD_enclosure.tar'):
            y,x=np.mgrid[:320,:320];r=np.hypot(x-160,y-160);ring=(100+.01*x+.02*y+1.5*np.exp(-((r-18)**2)/8)).astype(np.float32)
            out=engine.run('adaf-enclosure',ring,meta,.35,threading.Event(),lambda *args:None)
            self.assertTrue(any(r['type']=='enclosure'for r in out['results']))
        flat=np.full_like(dem,100)
        out=engine.run('tumulus',flat,meta,.6,threading.Event(),lambda *args:None)
        self.assertEqual(out['results'],[])

if __name__=='__main__':unittest.main(verbosity=2)
