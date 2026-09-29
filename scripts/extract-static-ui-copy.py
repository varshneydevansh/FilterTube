#!/usr/bin/env python3
"""Regenerate the English source inventory for dashboard markup only.

This inventories text present in the packaged HTML before dashboard scripts run.
It does not translate or rewrite the HTML, and it never inventories runtime data.
"""

import json
import runpy
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
CopyInventory = runpy.run_path(str(ROOT / "scripts/audit-ui-copy.py"))["CopyInventory"]
SOURCE = ROOT / "html/tab-view.html"
OUTPUT = ROOT / "data/ui_locales/en_static.json"


def main():
    inventory = CopyInventory("html/tab-view.html")
    inventory.feed(SOURCE.read_text(encoding="utf-8"))
    entries = {}
    for entry in inventory.entries:
        text = entry["text"]
        if text not in entries:
            entries[text] = {"kind": entry["kind"], "line": entry["line"]}
    OUTPUT.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(entries)} unique dashboard copy fragments -> {OUTPUT}")


if __name__ == "__main__":
    main()
