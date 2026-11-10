# Model assets

`tumulus-single.pt` and `tumulus-multichannel.pt` are the unmodified pretrained
`combined_cnn.pt` and `multichannel_cnn.pt` from ObuObuHub/tumulus-lidar-detector,
commit 70ea999bc274db9aab11798737eb68a4c4a31352.
Author: Chiper-Leferman Andrei. Weights: CC BY 4.0; see
`../../licenses/Tumulus-MIT-and-CC-BY-4.0.txt`.

ADAF weights are installed on explicit request by `python companion/setup_models.py
adaf-barrow` (or `adaf-enclosure`, `adaf-ringfort`). They are not committed because
of their size. Official source: https://zenodo.org/records/15848663 .
Weights: CC BY-SA 4.0, confirmed in the record's API metadata. Original authors:
Ana Kostovska, Dragi Kocev, Nejc Čož, Žiga Kokalj, Susan Curran, Anthony Corns.

Never load an arbitrary uploaded checkpoint. Only fixed, checksum-verified model
files are used, with PyTorch's `weights_only=True`. No unsafe pickle fallback.
