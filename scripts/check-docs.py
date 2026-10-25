#!/usr/bin/env python3
"""Offline documentation checks: Markdown links, anchors, images and the wiki.

Checks every relative link and image in the Markdown files, links from the wiki to wiki pages and
their headings, links to repository files on github.com/.../blob|tree/main and raw.githubusercontent.com,
that every wiki page is in the sidebar, and that the wiki has a Home page. External sites are not contacted.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = 'taynotfound/shore'
WIKI = ROOT / 'docs' / 'wiki'
problems = []


def slug(heading):
    heading = re.sub(r'`|\*|_|\[|\]|\(.*?\)', '', heading.strip().lower())
    return re.sub(r'\s', '-', re.sub(r'[^\w\- ]', '', heading))


def anchors(path):
    text = re.sub(r'```.*?```', '', path.read_text(encoding='utf-8'), flags=re.S)
    return {slug(h) for h in re.findall(r'^#{1,6}\s+(.*)$', text, re.M)}


pages = {p.stem: p for p in WIKI.glob('*.md')}
page_anchors = {name: anchors(path) for name, path in pages.items()}
tracked = [p for p in ROOT.rglob('*.md') if not any(part in ('node_modules', '.git', '.local', 'dist') for part in p.parts)]
LINK = re.compile(r'!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)|(?:src|href)="([^"]+)"')

for path in sorted(tracked):
    rel = path.relative_to(ROOT)
    text = re.sub(r'```.*?```', '', path.read_text(encoding='utf-8'), flags=re.S)
    in_wiki = path.parent == WIKI
    for match in LINK.finditer(text):
        url = match.group(1) or match.group(2)
        if url.startswith(('mailto:', 'data:')):
            continue
        base, _, fragment = url.partition('#')
        wiki_url = re.match(r'https://github\.com/' + REPO + r'/wiki(?:/([^#?]+))?', base)
        raw = re.match(r'https://raw\.githubusercontent\.com/' + REPO + r'/main/(.+)', base)
        blob = re.match(r'https://github\.com/' + REPO + r'/(?:blob|tree)/main/(.+)', base)
        if wiki_url or (in_wiki and base and not base.startswith(('http', '/'))):
            name = (wiki_url.group(1) if wiki_url else base) or 'Home'
            if name not in pages:
                problems.append(f'{rel}: no wiki page "{name}" ({url})')
            elif fragment and fragment not in page_anchors[name]:
                problems.append(f'{rel}: no heading "#{fragment}" on wiki page {name}')
        elif raw or blob:
            target = ROOT / (raw or blob).group(1)
            if not target.exists():
                problems.append(f'{rel}: {url} does not exist in the repository')
        elif base.startswith('http'):
            continue
        elif not base:
            current = page_anchors.get(path.stem) if in_wiki else anchors(path)
            if fragment and current is not None and fragment not in current:
                problems.append(f'{rel}: no heading "#{fragment}" in this file')
        else:
            target = (ROOT / base.lstrip('/')) if base.startswith('/') else (path.parent / base)
            if not target.resolve().exists():
                problems.append(f'{rel}: broken link {url}')
            elif fragment and target.suffix == '.md' and fragment not in anchors(target):
                problems.append(f'{rel}: no heading "#{fragment}" in {base}')

sidebar = (WIKI / '_Sidebar.md').read_text(encoding='utf-8')
for name in sorted(pages):
    if not name.startswith('_') and name != 'Home' and f']({name})' not in sidebar:
        problems.append(f'docs/wiki/_Sidebar.md: page "{name}" is not listed')
if 'Home' not in pages:
    problems.append('docs/wiki has no Home.md')

for problem in problems:
    print('FAIL', problem)
print(f'{len(tracked)} Markdown files, {len(pages)} wiki pages: {len(problems)} problem(s).')
sys.exit(1 if problems else 0)
