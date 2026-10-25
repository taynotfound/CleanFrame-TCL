"""Check that the app and the resources it references are present."""
from pathlib import Path
import json
import re
import subprocess

root = Path(__file__).resolve().parents[1]
app = root / 'app'
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
# A player button gets the class pl-<id> (prev, toggle, next, ...), so a bare .pl-<id> rule would restyle the button.
player_ids = re.search(r"var PB = \[([^\]]*)\]", (app / 'addons/player.js').read_text()).group(1)
for button in re.findall(r"'(\w+)'", player_ids):
    for selector in re.findall(r"(?<![\w-])\.pl-" + button + r"(?![\w-])", (app / 'addons/player.css').read_text()):
        raise AssertionError('player.css has a bare .pl-' + button + ' rule that also matches the ' + button + ' button; name the class differently')
print('Bundled resources and ' + str(len(addon_files)) + ' add-on files are valid.')
