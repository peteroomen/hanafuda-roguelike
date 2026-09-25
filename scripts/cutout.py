"""
Cut a painted portrait out of its flat paper background and write the game's 512px webp.

Only paper connected to the image border is removed, so paper-coloured areas inside the
figure (a belly, a face, fur) survive as long as an outline encloses them.

    python3 scripts/cutout.py art-source/yokai/tengu.png src/ui/art/portraits/tengu.webp
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

TOLERANCE = 34  # max colour distance from the sampled paper colour


def cutout(src: str, dst: str) -> None:
    im = Image.open(src).convert('RGBA')
    a = np.asarray(im).astype(np.int32)
    rgb = a[..., :3]
    h, w = rgb.shape[:2]
    # The paper colour: the median of a thin border strip.
    border = np.concatenate([rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3), rgb[:, :6].reshape(-1, 3), rgb[:, -6:].reshape(-1, 3)])
    paper = np.median(border, axis=0)
    near = np.sqrt(((rgb - paper) ** 2).sum(axis=2)) < TOLERANCE
    labels, _ = ndimage.label(near)
    edge = set(np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))) - {0}
    bg = np.isin(labels, list(edge))
    # Grow the background by a pixel to eat the paper-tinted fringe, then soften the edge.
    bg = ndimage.binary_dilation(bg, iterations=1)
    alpha = np.where(bg, 0, 255).astype(np.float32)
    alpha = ndimage.gaussian_filter(alpha, 0.8)
    out = a.copy()
    out[..., 3] = np.minimum(a[..., 3], alpha).astype(np.int32)
    img = Image.fromarray(out.astype(np.uint8), 'RGBA').resize((512, 512), Image.LANCZOS)
    img.save(dst, 'WEBP', quality=86, method=6)
    print(f'{dst}: paper {paper.astype(int).tolist()}, removed {bg.mean():.0%}')


if __name__ == '__main__':
    cutout(sys.argv[1], sys.argv[2])
