"""Build the distributable module zip (module.json at the root)."""
import os
import zipfile

EXCLUDE_DIRS = {'.git', '.github', 'tests'}
EXCLUDE_FILES = {'.gitignore', 'more-color-mouse.zip', '参考.txt'}


def build() -> None:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, 'more-color-mouse.zip')

    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as archive:
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = sorted(d for d in dirnames if d not in EXCLUDE_DIRS)
            for filename in sorted(filenames):
                if filename in EXCLUDE_FILES:
                    continue
                full = os.path.join(dirpath, filename)
                rel = os.path.relpath(full, root)
                archive.write(full, rel)

    print(f'Built {out} ({os.path.getsize(out)} bytes)')


if __name__ == '__main__':
    build()
