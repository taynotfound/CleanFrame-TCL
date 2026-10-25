"""Check that the widget manifest and its referenced files are present."""
from pathlib import Path
import json
import xml.etree.ElementTree as XML
import re
import subprocess

root = Path(__file__).resolve().parents[1]
app = root / 'app'
manifest = XML.parse(app / 'config.xml').getroot()
ns = {'w': 'http://www.w3.org/ns/widgets', 't': 'http://tizen.org/ns/widgets'}
identity = manifest.find('t:application', ns)
assert identity is not None, 'Missing application identity'
assert identity.get('package') == 'nClrkHome1', 'Keep the installed package identity stable'
assert identity.get('id') == 'nClrkHome1.FrameHome', 'Keep the installed application ID stable'
assert manifest.get('version') == json.loads((root / 'package.json').read_text())['version'], 'Manifest/package versions differ'
for tag in ['content', 'icon']:
    node = manifest.find('w:' + tag, ns)
    assert node is not None and (app / node.get('src', '')).is_file(), 'Missing ' + tag + ' file'
assert all((app / name).is_file() for name in ['main.js', 'style.css'])
for reference in ['assets/wallpapers/catalog.js', 'assets/adaptive-ink.js', 'assets/font-catalog.js']:
    assert (app / reference).is_file(), 'Missing runtime catalogue: ' + reference
for filename in ['index.html']:
    source = (app / filename).read_text()
    pattern = r'(?:src|href)=[\"\']([^\"\']+)' if filename.endswith('.html') else r'from\s+[\"\']([^\"\']+)'
    for reference in re.findall(pattern, source):
        if ':' in reference or reference.startswith('$'):
            continue
        assert (app / reference).is_file(), 'Missing bundled resource: ' + reference
        if filename.endswith('.js'):
            assert reference.startswith(('./', '../')), 'Module imports must be relative paths'
for css in app.rglob('*.css'):
    for reference in re.findall(r'url\([\"\']?([^\)\"\']+)', css.read_text()):
        if ':' not in reference:
            assert (css.parent / reference.split('?')[0]).is_file(), 'Missing CSS resource: ' + reference
# These resource names are constructed at runtime, so HTML/CSS reference checks cannot find them.
walls = json.loads((app / 'assets/wallpapers/SOURCES.json').read_text())
for wall in walls:
    for field in ['src', 'thumb']:
        assert (app / wall[field]).is_file(), 'Missing wallpaper: ' + wall[field]
    wall_id = wall['id']
    for suffix in ['study-soft', 'field-blur', 'field-frost', 'field-clear']:
        assert (app / ('assets/materials/' + wall_id + '-' + suffix + '.jpg')).is_file(), 'Missing registered material: ' + wall_id + '/' + suffix
    assert (app / ('assets/wallpapers/' + wall_id + '-panel.jpg')).is_file(), 'Missing panel backdrop: ' + wall_id
for icon in ['stremio', 'netflix', 'disneyplus', 'youtube', 'appletv', 'primevideo', 'abciview', 'sbs', 'applemusic', 'art', 'apps', 'settings']:
    assert (app / ('assets/icons/' + icon + '.svg')).is_file(), 'Missing icon: ' + icon
# Add-ons are fetched by name when switched on (main.js, ADDONS), so the startup page must not load them.
addon_files = sorted(set(re.findall(r"'(addons/[\w-]+\.(?:js|css))'", (app / 'main.js').read_text())))
assert addon_files, 'No add-on files found in main.js'
for reference in addon_files:
    assert (app / reference).is_file(), 'Missing add-on file: ' + reference
    assert reference not in (app / 'index.html').read_text(), 'Add-ons load on demand, not from index.html: ' + reference
for script in sorted((app / 'addons').glob('*.js')):
    assert 'addons/' + script.name in addon_files, 'Add-on file not listed in main.js ADDONS: ' + script.name
    subprocess.run(['node', '--check', str(script)], check=True)
print('Widget identity, version, bundled resources and ' + str(len(addon_files)) + ' add-on files are valid.')
