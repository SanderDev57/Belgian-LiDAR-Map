"""Fixed model registry. No caller-controlled checkpoint paths or download URLs."""
from pathlib import Path
import hashlib

ROOT = Path(__file__).resolve().parent
MODELS = {
    'tumulus': dict(name='Tumulus CNN · burial mounds', file='tumulus-multichannel.pt',
        sha256='08df9120a68bada89105229a1c07f8ed5c50fe9108409e8dc23b1574975af376',
        license='CC BY 4.0', author='Chiper-Leferman Andrei',
        source='https://github.com/ObuObuHub/tumulus-lidar-detector',
        revision='70ea999bc274db9aab11798737eb68a4c4a31352', types=['mound']),
    'adaf-barrow': dict(name='ADAF · burial mounds', file='OD_barrow.tar',
        md5='b9afba2246821035ea7007e08a64ab80', size=517823445, types=['mound']),
    'adaf-enclosure': dict(name='ADAF · enclosures', file='OD_enclosure.tar',
        md5='8f3eebec97a3a0a5b821a9934eb73142', size=517822511, types=['enclosure']),
    'adaf-ringfort': dict(name='ADAF · ringfort-like earthworks', file='OD_ringfort.tar',
        md5='4518e1966cafa0544bd3ea78be3b711a', size=517823445, types=['enclosure']),
}
for key, spec in MODELS.items():
    if key.startswith('adaf-'):
        spec.update(license='CC BY-SA 4.0', author='ADAF authors / ZRC SAZU and Bias Variance Labs',
            source='https://zenodo.org/records/15848663', revision='Zenodo 15848663 v1.0.0',
            url=f"https://zenodo.org/records/15848663/files/{spec['file']}?download=1")

def model_path(key):
    if key not in MODELS:
        raise ValueError('Unknown model. Choose an installed model from the list.')
    return ROOT / 'models' / MODELS[key]['file']

def verified_path(key):
    spec = MODELS[key]; path = model_path(key)
    if not path.is_file():
        raise ValueError(f'Model is not installed. Run: python companion/setup_models.py {key}')
    algorithm = 'sha256' if 'sha256' in spec else 'md5'
    digest = hashlib.new(algorithm)
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    if digest.hexdigest() != spec[algorithm]:
        raise ValueError('Model checksum mismatch. Reinstall the official model; it will not be loaded.')
    return path

def catalog():
    return [dict(id=key, installed=model_path(key).is_file(), **{
        k: value for k, value in spec.items() if k in ('name','license','author','source','revision','types')
    }) for key, spec in MODELS.items()]
