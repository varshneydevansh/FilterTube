#!/usr/bin/env python3
"""Inventory literal extension HTML copy before declaring a locale complete.

Packaged dashboard text is covered by the early static-copy capture and its
English inventory. This audit subtracts only those exact known fragments.
This is a source audit, not a translator. Dynamic JavaScript copy, release
notes, manifests, and installed-browser checks are separate release gates.
"""

import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SURFACES = ("html/tab-view.html", "html/popup.html")
SCRIPT_SURFACES = (
    "js/popup.js", "js/tab-view.js", "js/render_engine.js",
    "js/ui_components.js", "js/background.js",
    "js/content/admission_overlay.js", "js/content/external_youtube_guard.js",
)
COPY_ATTRIBUTES = ("title", "placeholder", "aria-label", "alt")
IGNORED_TAGS = {"script", "style", "svg", "path", "noscript"}
VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}


class CopyInventory(HTMLParser):
    def __init__(self, filename):
        super().__init__(convert_charrefs=True)
        self.filename = filename
        self.stack = []
        self.entries = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        keyed = attributes.get("data-ft-i18n")
        ignored = tag in IGNORED_TAGS or any(item["ignored"] for item in self.stack)
        if not ignored:
            for name in COPY_ATTRIBUTES:
                value = (attributes.get(name) or "").strip()
                if value and not attributes.get(f"data-ft-i18n-{name}"):
                    self.entries.append({
                        "file": self.filename, "line": self.getpos()[0],
                        "kind": name, "text": value,
                    })
        if tag not in VOID_TAGS:
            self.stack.append({"tag": tag, "keyed": bool(keyed), "ignored": ignored})

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index]["tag"] == tag:
                del self.stack[index:]
                break

    def handle_data(self, data):
        value = " ".join(data.split())
        if not value or not self.stack:
            return
        if any(item["ignored"] or item["keyed"] for item in self.stack):
            return
        self.entries.append({
            "file": self.filename, "line": self.getpos()[0],
            "kind": "text", "text": value,
        })


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print every uncovered literal")
    parser.add_argument("--require-complete", action="store_true", help="Fail if copy remains")
    args = parser.parse_args()

    entries = []
    static_covered = 0
    dashboard = (ROOT / "html/tab-view.html").read_text(encoding="utf-8")
    # Do not treat a catalog entry as runtime wiring if capture is absent or
    # runs after the controller can insert user-written text.
    capture = dashboard.find('src="../js/ui_static_copy_capture.js"')
    controller = dashboard.find('src="../js/tab-view.js"')
    static_copy = {}
    if 0 <= capture < controller:
        static_copy = json.loads((ROOT / "data/ui_locales/en_static.json").read_text(encoding="utf-8"))
    for filename in SURFACES:
        inventory = CopyInventory(filename)
        inventory.feed((ROOT / filename).read_text(encoding="utf-8"))
        for entry in inventory.entries:
            if filename == "html/tab-view.html" and entry["text"] in static_copy:
                static_covered += 1
            else:
                entries.append(entry)
    # Heuristic lower bound only: template HTML, ternaries and function calls
    # require a source-aware migration, so these findings are not auto-keyed.
    literal_assignment = re.compile(
        r"\.(?:textContent|placeholder|title)\s*=\s*(['\"`])([^\n]*?)\1"
    )
    for filename in SCRIPT_SURFACES:
        source = (ROOT / filename).read_text(encoding="utf-8")
        for match in literal_assignment.finditer(source):
            value = " ".join(match.group(2).split())
            if value and not value.startswith("<"):
                entries.append({
                    "file": filename,
                    "line": source.count("\n", 0, match.start()) + 1,
                    "kind": "js-literal", "text": value,
                })

    if args.json:
        print(json.dumps(entries, ensure_ascii=False, indent=2))
    else:
        print(f"html/tab-view.html: {static_covered} exact packaged fragments covered by early static capture")
        for filename in (*SURFACES, *SCRIPT_SURFACES):
            source = [entry for entry in entries if entry["file"] == filename]
            print(f"{filename}: {len(source)} candidate unkeyed fragments")
            for entry in source[:5]:
                print(f"  {entry['line']} {entry['kind']}: {entry['text'][:100]}")
        print("JS counts are a lower-bound heuristic; JSX, manifests, release notes, templates, dynamic expressions and browser review remain separate.")
    if args.require_complete and entries:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
