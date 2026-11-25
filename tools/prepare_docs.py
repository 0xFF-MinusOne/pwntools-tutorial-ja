#!/usr/bin/env python3
"""ビルド用に Markdown を .site-src/ へコピーする。元のファイルは変更しない。"""
import shutil
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = root / ".site-src"
if out.exists():
    shutil.rmtree(out)
out.mkdir()

for p in sorted(root.glob("*.md")):
    shutil.copy2(p, out / p.name)
for p in sorted(root.glob("walkthrough/*/README.md")):
    dst = out / p.relative_to(root)
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(p, dst)
# 画像などの資産があればコピーする
for ext in ("png", "jpg", "jpeg", "gif", "svg"):
    for p in root.glob(f"**/*.{ext}"):
        rel = p.relative_to(root)
        if rel.parts[0].startswith(".") or rel.parts[0] in ("tools", "node_modules"):
            continue
        dst = out / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, dst)
print(f"prepared {sum(1 for _ in out.rglob('*') if _.is_file())} files in {out}")
