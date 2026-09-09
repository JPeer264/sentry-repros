"""Write gist/01-V11-CHECKLIST.md: the getting-started and manual-setup docs changes, grouped by runtime and tiered for the v11 release."""
import json, os, re
OUT=os.path.dirname(os.path.abspath(__file__)); GIST=os.path.join(OUT,'gist')
items=json.load(open(os.path.join(OUT,'_items.json')))
by={i['id']:i for i in items}
for n,i in enumerate(items,1): i['n']=n
def slug(h): return re.sub(r'[^a-z0-9_\-]','',h.lower().replace(' ','-'))
def link(i): return '[%s](#%s)' % (i['title'], slug('%d. %s' % (i['n'], i['title'])))
OWNER={'X2':'owned by JS-2599','DOC-R20':'owned by SDK-1351','DOC-C1':'v11-gated, under SDK-1296','DOC-C4':'v11-gated, under SDK-1296','DOC-C5':'v11-gated, under SDK-1296','DOC-C3':'v11-gated, under SDK-1296'}
PLAN=[
 ('Every runtime guide', [
   ('must','DOC-R1','the stream-mode includes call static the default'),
   ('must','DOC-Q1','the verify step and the stream-mode includes describe the static lifecycle as the default'),
   ('must','DOC-Q3','nothing on the four guides says where a route name comes from'),
   ('should','X1','"Tracing is enabled by default" on the first page of all three guides'),
 ]),
 ('Migration to v11', [
   ('must','X2','the v10-to-v11 page has no Bun plugin section and no Deno hook paragraph'),
   ('must','DOC-R20','the Bun OpenTelemetry setup includes import a package and exports that no longer exist'),
   ('later','DOC-R8','v7 migration tables name removed integrations'),
 ]),
 ('Next.js', [
   ('must','DOC-Q86','every next.config snippet imports withSentryConfig from an entry that no longer exports it'),
   ('must','DOC-Q87','the Pages Router page has no working client init under Turbopack and no instrumentation step'),
   ('should','DOC-Q88','the pages misattribute which errors the error components capture'),
   ('later','DOC-Q89','SaaS-only tunnelRoute, deleted source maps, an undeclared function, a 10% verify sample, plugin telemetry'),
 ]),
 ('SvelteKit', [
   ('must','DOC-Q92','every vite.config snippet imports sentrySvelteKit from an entry that no longer exports it'),
   ('should','DOC-Q93','the custom handleErrorWithSentry handler marks every server error handled'),
   ('later','DOC-Q94','unknown-route spans, segment status on 500, an outdated load rationale, a stale Vite prerequisite'),
 ]),
 ('Remix', [
   ('must','DOC-Q95','two snippets fail the build: a doubled handleError export and an uninstalled Vite plugin package'),
   ('should','DOC-Q96','the start command does not work with a Vite build'),
   ('should','DOC-Q97','the captureActionFormDataKeys claim describes data that never appears on errored actions'),
   ('later','DOC-Q98','transactions wording, a missing import, served source maps, the sanitized boundary event, no release'),
 ]),
 ('Nuxt', [
   ('should','DOC-Q90','the pages still make --import the crucial step; the server config is bundled into the Nitro build'),
   ('later','DOC-Q91','deprecated inject modes documented as current, Nuxt 4 missing, a verify button that creates a second issue'),
 ]),
 ('Cloudflare Pages', [
   ('must','DOC-Q83','the Pages tracing verify snippet uses Sentry without importing it'),
   ('later','DOC-Q84','the nodejs_compat requirement depends on the date, method-named spans, waitUntil on Pages'),
 ]),
 ('Browser', [
   ('must','DOC-Q7','the tracing verify snippet is a SyntaxError: await in a non-async function'),
   ('should','DOC-Q8','the CDN tab names the tracing bundle and adds replayIntegration(), which records nothing'),
   ('should','DOC-Q9','Sentry.logger is a silent no-op on the CDN bundles and no page says which bundle has logs'),
   ('later','DOC-Q10','the sample tracePropagationTargets drops headers on 127.0.0.1'),
   ('later','DOC-Q11','the verify-flow replay is discarded within the first five seconds'),
 ]),
 ('React', [
   ('must','DOC-Q12','three React Router v6 and v7 snippets do not run on React 19'),
   ('should','DOC-Q13','on React 19 the root error hooks silence the ErrorBoundary features'),
   ('should','DOC-Q14','the denylist claim does not cover Redux or Pinia state'),
   ('should','DOC-Q15','the Profiler span ops are named wrong'),
   ('later','DOC-Q16','the routing snippet uses the deprecated V7 API'),
   ('later','DOC-Q17','the verify step says transactions and its test span ends before the error'),
   ('later','DOC-Q18','sessions need a release, on the Vue, Angular, Svelte, Solid and WebAssembly guides too'),
 ]),
 ('Angular', [
   ('must','DOC-Q32','three snippets do not compile under the tsconfig ng new generates'),
   ('should','DOC-Q33','no working registration for a subclassed SentryErrorHandler'),
   ('should','DOC-Q34','the component tracking span ops are named wrong'),
   ('later','DOC-Q35','transactions wording and a 0 ms verify span'),
   ('later','DOC-Q36','deprecated bootstrap call, missing logs option, stray line'),
 ]),
 ('Svelte', [
   ('must','DOC-Q41','the Svelte v5 verify snippet binds onClick, which compiles to nothing'),
   ('should','DOC-Q42','old span ops, the wrong trackUpdates default and no runes caveat on the component tracking page'),
   ('later','DOC-Q43','transactions wording, a 0 ms test span and a placeholder that is a syntax error'),
 ]),
 ('Solid', [
   ('must','DOC-Q48','the tracing snippet needs @solidjs/router, which the guide never installs'),
   ('should','DOC-Q49','the DEV guard skips init under vite dev, so the verify step sends nothing'),
   ('should','DOC-Q50','no navigation spans without withSentryRouterRouting'),
   ('later','DOC-Q51','TypeScript in a javascript fence and transactions wording'),
 ]),
 ('Vue', [
   ('must','DOC-Q19','the Vue Router page\'s only full example is Vue 2 code that fails on Vue 3'),
   ('must','DOC-Q20','the tracingOptions.hooks snippet is a syntax error'),
   ('should','DOC-Q21','wrong default hooks, wrong span ops and a duplicate-key snippet on the component tracking page'),
   ('later','DOC-Q22','the pages say transactions'),
   ('later','DOC-Q23','the late-init and multiple-apps snippets miss their imports'),
   ('later','DOC-Q24','the dev build reports the verify error without component context'),
 ]),
 ('Browser WebAssembly', [
   ('should','DOC-Q63','debug IDs need a build_id section and a streaming loader the guide never mentions'),
 ]),
 ('Google Cloud Functions', [
   ('must','DOC-Q69','three exports that do not exist: wrapBackgroundFunction, pgIntegration, ioredisIntegration'),
   ('later','DOC-Q70','callback handlers lose the function span, HTTP functions split into two traces, no run step, no logs option'),
 ]),
 ('AWS Lambda', [
   ('must','DOC-Q71','two snippets do not parse: a stray parenthesis and Promise.rejected'),
   ('should','DOC-Q72','the ESM tab creates instrument.mjs and the load step imports instrument.js'),
   ('should','DOC-Q73','the wrapper options are overridden by the v11 automatic wrapping'),
   ('later','DOC-Q74','verify tabs, a broken anchor, request data, awslambda-auto outside Lambda, transactions comment'),
 ]),
 ('Azure Functions', [
   ('should','DOC-Q81','request data attached with a metadata key the SDK never reads'),
   ('later','DOC-Q82','the wrong SDK in the frontmatter, no invocation span, v3-only snippets, transactions, a hidden logs option'),
 ]),
 ('Effect', [
   ('must','DOC-Q75','the metrics layer breaks the whole program on Effect v3'),
   ('should','DOC-Q76','the verify step promises an issue that nothing captures'),
   ('later','DOC-Q77','a missing install, an unshown file, the span op, annotations, integrations off'),
 ]),
 ('Nitro', [
   ('must','DOC-Q78','the install fails on current Nitro betas and the config never registers the verify route'),
   ('should','DOC-Q79','the error and span claims do not match the build'),
   ('later','DOC-Q80','source maps deleted without a token, an untyped option, the dev double init, $fetch'),
 ]),
 ('Mastra', [
   ('should','DOC-Q67','the built-in mastraIntegration is undocumented and combining it with the exporter duplicates every span'),
   ('later','DOC-Q68','wrong attribute names, unnamed defaults and the trace shape on the Mastra pages'),
 ]),
 ('Elysia', [
   ('should','DOC-Q64','the verify route is added after listen() and is never served'),
   ('should','DOC-Q65','unmatched routes and status() throws are captured by default, the guide says otherwise'),
   ('later','DOC-Q66','a browser paragraph, old ops, a function-name claim and no run command'),
 ]),
 ('Node, Express, Fastify, Koa, Hapi, Connect, Hono and NestJS', [
   ('should','DOC-Q5','--require banner, and a first-line ESM import equals --import'),
   ('must','DOC-Q85','the Node install pages do not reflect the v11 install-method decision: --import main, bundler plus top-level import, @sentry/node/import with late init, no CommonJS option'),
   ('must','DOC-Q25','the Express, Fastify, Koa, Hapi and Connect ESM tabs import the instrument file without its extension'),
   ('must','DOC-Q26','the late-initialization page rests on the removed @sentry/node/preload entry'),
   ('should','DOC-Q27','the Express and Connect async verify snippets hang on Express 4 and Connect 3'),
   ('should','DOC-Q28','the esm-without-import page says a first-line import cannot instrument frameworks; Express, Fastify, Hapi and Hono are'),
   ('later','DOC-Q29','the Express, Fastify, Koa and Hapi guides teach deprecated error handler calls'),
   ('later','DOC-Q30','no expressIntegration page'),
   ('later','DOC-Q31','empty, orphaned and unreachable includes on the Express, Fastify, Koa and Connect guides'),
   ('must','DOC-Q37','the Fastify error handler page imports from a package that does not exist'),
   ('should','DOC-Q38','the Fastify error handler options object is silently ignored'),
   ('should','DOC-Q39','the Fastify supported versions exclude 5'),
   ('later','DOC-Q40','the Fastify integration page names the wrong mechanism and no behaviour'),
   ('must','DOC-Q44','the Koa verify snippet uses a router the guide never creates'),
   ('should','DOC-Q45','with a direct import Koa still needs setupKoaErrorHandler, the migration page says otherwise'),
   ('should','DOC-Q46','the Koa integration page names the wrong mechanism, enablement rule and version range'),
   ('should','DOC-Q47','the Hapi integration page names the wrong mechanism and no option, and its table row says no errors'),
   ('must','DOC-Q52','the Connect guide and integration page describe a removed instrumentation; every printed app crashes'),
   ('should','DOC-Q53','the Connect verify route never reaches Sentry without an error middleware'),
   ('should','DOC-Q54','the Hono tracing verify snippet uses Sentry without importing it, and the package root exports nothing'),
   ('should','DOC-Q55','the install pages initialize Hono from @sentry/node, which the guide forbids'),
   ('later','DOC-Q56','Hono guide details: GET /* grouping, options sentence, filter semantics, node-server dependency'),
   ('must','DOC-Q57','the NestJS tracing verify snippet kills the process'),
   ('must','DOC-Q58','the NestJS ESM start script is not a runnable command'),
   ('should','DOC-Q59','no NestJS error reaches Sentry without SentryGlobalFilter; the guide says otherwise'),
   ('should','DOC-Q60','the Nest integration page names the wrong mechanism, enablement rule and Nest 4'),
   ('should','DOC-Q62','the Node prerequisites include says Node 18 while the v11 packages declare 20.19 and later'),
   ('later','DOC-Q61','NestJS details: the module adds nothing observable, transactions wording, doubled Express spans'),
 ]),
 ('Bun', [
   ('must','DOC-B1','the instrumentation step is backwards and never names the plugin'),
   ('should','DOC-B2','the integrations table does not match what the SDK installs'),
   ('should','DOC-Q4','two warnings on the documented path that no page explains'),
   ('should','DOC-B4','no Bun version floor, npm install in the Hono tab, no breadcrumbs page'),
 ]),
 ('Deno', [
   ('must','DOC-D1','no instrumentation step; the import hook is undocumented'),
   ('must','DOC-D3','the documented permission flags crash the app under the hook, and silently degrade without it'),
   ('must','DOC-R2','the crons page recommends an integration that crashes init on Deno 2.9'),
   ('should','DOC-D2','the integrations table lists 8 of 39'),
   ('should','DOC-D6','install shows only the npm: specifier; deno add and the import map are missing'),
   ('later','DOC-R17','deno serve is never mentioned'),
 ]),
 ('Cloudflare Workers', [
   ('should','DOC-Q2','a wrangler config resolved to the wrong file instruments nothing and logs nothing'),
   ('must','DOC-C1','the nodejs_compat entrypoint the guide documents is gone on develop'),
   ('must','DOC-C5','wrapRequestHandler is imported from an entry that no longer exports it'),
   ('must','DOC-C4','the Vite plugin page documents options that no longer exist and calls the plugin a no-op'),
   ('should','DOC-R14','errors inside ctx.waitUntil() are never captured; the page covers spans only'),
   ('should','DOC-C8','bare Sentry.init snippets, a browser integration, two compatibility dates without a rule'),
   ('should','DOC-Q6','wrangler dev stack traces have no context lines until source maps are uploaded'),
   ('should','DOC-C3','enableRpcTracePropagation is replaced; five options have no entry'),
 ]),
 ('Frameworks whose page contradicts a verified run', [
   ('must','DOC-F50','Remix on Workers: the documented import captures nothing'),
   ('must','DOC-F36','Elysia on Workers: runtime list says Bun or Node only'),
   ('must','DOC-F19','Elysia on Deno: the documented init loses isolation and route names'),
   ('must','DOC-F11','Nuxt on Bun: presets page says out of the box'),
   ('must','DOC-F28','Nuxt on Deno: the deno_server preset has no request instrumentation'),
   ('must','DOC-F13','Astro on Bun: the runtime alert says not supported'),
   ('must','DOC-F30','Astro on Deno: the runtime alert says not supported'),
   ('must','DOC-F29','SvelteKit on Deno: the adapter note says not supported'),
 ]),
 ('Frameworks whose page misses the wiring or the limits', [
   ('should','DOC-F1','Hono on Bun'),('should','DOC-F2','Elysia on Bun'),('should','DOC-F18','Hono on Deno'),('should','DOC-F35','Hono on Workers'),
   ('should','DOC-F44','Next.js on Workers'),('should','DOC-F45','Nuxt on Workers'),('should','DOC-F46','SvelteKit on Workers'),('should','DOC-F49','TanStack Start on Workers: no Configure Vite step'),
 ]),
]
TIER={'must':'Must land with v11','should':'Should land with v11','later':'After the release'}
out=['# v11 docs minimum: getting started and manual setup','',
 'The docs changes a new user hits on the way from install to the first event, on Node, Bun, Deno, Cloudflare Workers and in the browser, plus the framework pages that contradict a verified run. Every line links to its draft in [P0](#file-p0-md), [P1](#file-p1-md) or [P2](#file-p2-md). Tiers: **must** blocks or misleads the first setup on develop; **should** is wrong or incomplete for something most users do next; **later** is hygiene. Items owned by a Linear ticket are marked; they still belong in the release, only filed elsewhere.','']
counts={'must':0,'should':0,'later':0}
for group, rows in PLAN:
    out+=['## %s' % group,'']
    for tier,iid,why in rows:
        i=by[iid]; counts[tier]+=1
        own=(' · '+OWNER[iid]) if iid in OWNER else ''
        out.append('- [ ] **%s** · %s · %s%s. %s: %s' % (TIER[tier], i['prio'], iid, own, why[0].upper()+why[1:], link(i)))
    out.append('')
out+=['## Not in this list','','The 34 framework pages that do not exist yet (DOC-F3 to DOC-F10, DOC-F12, DOC-F14 to DOC-F17, DOC-F20 to DOC-F27, DOC-F31 to DOC-F34, DOC-F37 to DOC-F43, DOC-F48, DOC-F51), the generated integrations tables and the runtime matrix (X3, DOC-R6), the feature pages (D1, bindings, Durable Objects, Workflows, Agents SDK), and the remaining completeness items. They improve coverage after the release and do not block a first setup.','',
 'Counts: %d must, %d should, %d later.' % (counts['must'],counts['should'],counts['later']),'']
open(os.path.join(GIST,'01-V11-CHECKLIST.md'),'w').write('\n'.join(out))
print('checklist written', counts)
