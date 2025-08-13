import os
from PIL import Image

ROOT = os.path.dirname(__file__)

# Config
teacher_src = os.path.join(ROOT, 'photo_2023-02-05_21-22-56.jpg')
teacher_sizes = [320, 420, 600]

hero_src = os.path.join(ROOT, 'assets', 'hero', 'hero-a-plus.webp')
hero_sizes = [560, 800]

WEBP_QUALITY = 82
WEBP_METHOD = 6


def ensure_dir(path: str) -> None:
	os.makedirs(path, exist_ok=True)


def resize_and_save(src_path: str, out_path: str, width: int | None = None) -> None:
	with Image.open(src_path) as im:
		im = im.convert('RGB') if im.mode in ('P', 'RGBA') else im
		if width:
			w, h = im.size
			if w <= width:
				# Do not upscale
				im_out = im.copy()
			else:
				h_new = int(h * (width / w))
				im_out = im.resize((width, h_new), Image.LANCZOS)
		else:
			im_out = im.copy()
		im_out.save(out_path, 'WEBP', quality=WEBP_QUALITY, method=WEBP_METHOD)


def process_teacher():
	if not os.path.isfile(teacher_src):
		print('Teacher source not found, skip')
		return
	base = os.path.splitext(os.path.basename(teacher_src))[0]
	for w in teacher_sizes:
		out = os.path.join(ROOT, f'{base}-{w}.webp')
		resize_and_save(teacher_src, out, width=w)
	print('Teacher images generated')


def process_hero():
	if not os.path.isfile(hero_src):
		print('Hero source not found, skip')
		return
	dirname = os.path.dirname(hero_src)
	base = os.path.splitext(os.path.basename(hero_src))[0]
	for w in hero_sizes:
		out = os.path.join(dirname, f'{base}-{w}.webp')
		resize_and_save(hero_src, out, width=w)
	print('Hero images generated')


if __name__ == '__main__':
	ensure_dir(os.path.join(ROOT, 'assets', 'hero'))
	process_teacher()
	process_hero()
	print('Done')
