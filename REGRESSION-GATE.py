from pathlib import Path
import re, json, sys
R=Path(__file__).parent
v=json.loads((R/'version.json').read_text())
b=v['build']; app=(R/'releases'/b/'app.js').read_text(); idx=(R/'index.html').read_text(); sw=(R/'sw.js').read_text(); css=(R/'releases'/b/'style.css').read_text()
checks=[]
def ck(name, ok): checks.append((name,bool(ok)))
# Update/build alignment
ck('index-build-aligned', idx.count(b)>=8)
ck('sw-build-aligned', f'const BUILD = "{b}";' in sw)
ck('app-build-tag-aligned', f'const APP_BUILD_TAG = "{b}";' in app)
ck('stable-sw-registration', 'navigator.serviceWorker.register("sw.js"' in idx)
# Protected five-page contract markers
ck('calculate-lazy-cache', 'calculatorEngine: new Map()' in app)
ck('nav-no-placeholder', 'PRO NAV IDLE — first visit renders the real page immediately' in app)
ck('ai-nav-cache-only', 'navigation/render is cache-only; no AI/P19 recovery is started here' in app)
ck('analysis-nav-cache-only', 'UI refresh never starts missing-AI recovery' in app)
ck('settings-version-visible', 'settings-app-version' in app)
# Save root invariant: inspect from primary committed marker through History return.
a=app.find('primaryCommitted=true;'); z=app.find('returnToHistoryHubAfterMutation(profileId',a); segment=app[a:z]
ck('save-history-return-found', a>=0 and z>a)
for bad in ['await rebuildWalkForwardExactActualRow','refreshUnifiedAIHistoryAfterMutation','hydrateUnifiedAIProfile','patternV19Build','x3Build']:
    ck('no-foreground-'+bad.replace(' ','-'), bad not in segment)
ck('save-touch-guard', 'MASTER STABLE — iPhone Save Tap Guard' in app and 'saveBtn.addEventListener("touchend"' in app)
ck('save-touch-manipulation-css', 'touch-action:manipulation' in css)
# Background exact-row must remain.
post=app.find('function scheduleActualDrawPostCommitEnrichment')
ck('background-exact-row-kept', post>=0 and 'rebuildWalkForwardExactActualRow' in app[post:post+10000])
# Old polling regressions must stay gone.
ck('no-hidden-700-self-poll', 'setTimeout(()=>scheduleActualDrawPostCommitEnrichment' not in app)
# Ordinary stats-later must not do full profile-wide refresh.
st=app.find('function scheduleHistoryStatsAfterRows'); en=app.find('\nfunction ',st+20)
seg2=app[st:en if en>st else st+12000]
ck('stats-no-profile-wide-refresh', 'refreshUnifiedAIHistoryAfterMutation' not in seg2)
# No data wiping.
ck('no-localstorage-clear', 'localStorage.clear(' not in app)
ck('no-indexeddb-delete', 'indexedDB.deleteDatabase' not in app)
failed=[n for n,o in checks if not o]
for n,o in checks: print(('PASS' if o else 'FAIL')+' '+n)
print(f'RESULT {len(checks)-len(failed)}/{len(checks)} PASS')
sys.exit(1 if failed else 0)
