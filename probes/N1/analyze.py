#!/usr/bin/env python3
"""Print the N1 flag-by-flag table from out2/<label>/items.json."""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))

for label in sys.argv[1:]:
    path = os.path.join(HERE, 'out2', label, 'items.json')
    try:
        items = json.load(open(path))
    except Exception as e:
        print(f'{label}: unreadable ({e})')
        continue
    ev = next((i for i in items if i.get('type') == 'event' and i.get('exception')), None)
    spans = [i for i in items if i.get('type') == 'span']
    print(f'--- {label} ---')
    if ev is None:
        print('  no exception event in sink')
    else:
        boom = [f for f in ev.get('frames', []) if f.get('in_app')]
        print('  ' + json.dumps({
            'exception': ev.get('exception'),
            'mechanism': ev.get('mechanism'),
            'sdk': ev.get('sdk'),
            'server_name': ev.get('server_name'),
            'ctx_os': ev.get('ctx_os'),
            'ctx_runtime': ev.get('ctx_runtime'),
            'release': ev.get('release'),
            'environment': ev.get('environment'),
            'hasContextLine': ev.get('hasContextLine'),
            'frameCount': ev.get('frameCount'),
            'boomFrames': [{'filename': f['filename'], 'line': f['line'],
                            'hasCtxLine': f['hasCtxLine'], 'preCount': f['preCount']} for f in boom],
        }))
    for s in spans:
        for name, attrs in zip(s.get('items', []), s.get('attrs', [])):
            print(f'  span [{name!r}] attrs= ' + json.dumps(attrs))
