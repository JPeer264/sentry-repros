import json, urllib.request, sys
d = json.load(urllib.request.urlopen(sys.argv[1]))
for r in d:
    if r['header'].get('type') != 'span':
        continue
    for it in r['payload'].get('items', []):
        a = it.get('attributes', {})
        g = lambda k: (a.get(k) or {}).get('value')
        print(json.dumps({'name': it['name'], 'is_segment': it.get('is_segment'), 'op': g('sentry.op'),
                          'http.route': g('http.route'),
                          'source': g('sentry.segment.name.source') or g('sentry.source'),
                          'origin': g('sentry.origin')}))
