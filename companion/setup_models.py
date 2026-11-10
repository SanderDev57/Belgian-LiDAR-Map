"""Explicit, resumable download of official ADAF weights with published checksums."""
import argparse
import os
import urllib.request
from registry import MODELS, model_path, verified_path


def install(key):
    spec = MODELS[key]; target = model_path(key)
    if target.exists():
        verified_path(key)
        print(f'Verified {target.name}')
        return
    if 'url' not in spec:
        raise ValueError('The small Tumulus model is bundled. Restore it from the Git repository.')
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(target.suffix + '.part')
    start = partial.stat().st_size if partial.exists() else 0
    request = urllib.request.Request(spec['url'], headers={'User-Agent':'Belgian-LiDAR-Map-model-setup/1', **({'Range':f'bytes={start}-'} if start else {})})
    print(f"Downloading {spec['name']} ({spec['size']/1e6:.0f} MB). Licence: {spec['license']}", flush=True)
    with urllib.request.urlopen(request, timeout=60) as response:
        resume = start and response.status == 206
        if resume and not response.headers.get('Content-Range','').startswith(f'bytes {start}-'):
            raise ValueError('Incorrect partial download response. Delete the .part file and retry.')
        with partial.open('ab' if resume else 'wb') as stream:
            for block in iter(lambda: response.read(1024 * 1024), b''):
                stream.write(block)
    if partial.stat().st_size != spec['size']:
        raise ValueError('Incomplete download; rerun the same command to resume.')
    os.replace(partial, target)
    try:
        verified_path(key)
    except ValueError:
        target.unlink()
        raise
    print(f'Installed and checksum-verified: {target.name}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model', choices=MODELS)
    args = parser.parse_args()
    try:
        install(args.model)
    except Exception as error:
        parser.exit(1, f'Setup failed: {error}\n')
