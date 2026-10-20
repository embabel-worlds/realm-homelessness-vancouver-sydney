/*
 * Runs EVERY view this realm ships against a LIVE appliance and fails on any the engine refuses,
 * any that returns no rows with its defaults, and any figure that differs from tests/expected.json
 * (written by tests/ground_truth.py from the sources themselves). Exact equality, not "some rows".
 *
 *   python3 tests/ground_truth.py
 *   EMBABEL_USER=… EMBABEL_PASSWORD=… node tests/views.smoke.mjs        (APPLIANCE_URL defaults to localhost:11043)
 *
 * Exits non-zero if any check failed.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.env.APPLIANCE_URL ?? 'http://localhost:11043';
const user = process.env.EMBABEL_USER ?? process.env.APPLIANCE_USER;
const password = process.env.EMBABEL_PASSWORD ?? process.env.APPLIANCE_PASSWORD;
if (!user || !password) { console.error('Set EMBABEL_USER and EMBABEL_PASSWORD.'); process.exit(2); }
const expected = JSON.parse(readFileSync(new URL('./expected.json', import.meta.url), 'utf8'));

const auth = 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64');
async function invoke(name, args) {
  const res = await fetch(`${base}/api/v1/views/${encodeURIComponent(name)}/invoke`, {
    method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ args }),
  });
  const body = await res.json().catch(() => ({}));
  const problem = res.status !== 200 || body.status !== 'SUCCEEDED'
    ? `${res.status} ${body.status ?? ''} ${body.error?.message?.slice(0, 160) ?? ''}` : null;
  return { problem, rows: body.data ?? [] };
}

let failures = 0;
const report = (ok, line) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${line}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const viewsDir = new URL('../views/', import.meta.url).pathname;
const names = readdirSync(viewsDir).filter(f => f.endsWith('.yml'))
  .flatMap(f => [...readFileSync(join(viewsDir, f), 'utf8').matchAll(/^- name:\s*(\S+)/gm)].map(m => m[1]));

console.log(`== every view, with its defaults (${names.length})`);
for (const name of names) {
  const { problem, rows } = await invoke(name, {});
  report(!problem && rows.length, `${name.padEnd(26)} ${String(rows.length).padStart(4)} rows${problem ? '  ' + problem : ''}`);
}

console.log('\n== exact figures');
{
  const { rows } = await invoke('LatestComparison', {});
  const got = rows.map(r => ({ compareAs: r.compareAs, place: r.place, source: r.source, period: r.period, people: r.people, per10k: r.per10k ?? null }))
    .sort((a, b) => (a.compareAs + a.place + a.source).localeCompare(b.compareAs + b.place + b.source));
  const want = expected.latestComparison.map(r => ({ ...r, per10k: r.per10k ?? null }));
  report(same(got, want), `LatestComparison: ${got.length} rows${same(got, want) ? '' : '\n   got  ' + JSON.stringify(got) + '\n   want ' + JSON.stringify(want)}`);
}
{
  const { rows } = await invoke('VancouverSubregions', { year: 2025 });
  const got = Object.fromEntries(rows.map(r => [r.subregion, r.total]));
  report(same(Object.keys(got).sort().map(k => [k, got[k]]), Object.keys(expected.vancouverSubregions2025).sort().map(k => [k, expected.vancouverSubregions2025[k]])),
    `VancouverSubregions 2025: ${JSON.stringify(got)}`);
}
{
  const { rows } = await invoke('SydneyStreetCount', {});
  report(rows.length === expected.sydneyStreetCountPeriods, `SydneyStreetCount: ${rows.length} counts, want ${expected.sydneyStreetCountPeriods}`);
}
{
  const { rows } = await invoke('GreaterSydneyStreetCount', {});
  const got = Object.fromEntries(rows.map(r => [String(r.year), r.greaterSydney]));
  report(same(got, Object.fromEntries(Object.keys(got).map(k => [k, expected.greaterSydneyStreetCount[k]]))) && rows.length === 7,
    `GreaterSydneyStreetCount: ${JSON.stringify(got)}`);
}
{
  const { rows } = await invoke('AbsHomelessGroups', { placeId: 'syd-metro', year: 2021 });
  const top = rows[0] ?? {};
  report(rows.length === 6 && top.people === 12163 && top.allHomeless === 25141, `AbsHomelessGroups Greater Sydney 2021: ${rows.length} groups, largest ${top.operationalGroup} ${top.people}`);
}
{
  const { rows } = await invoke('HomelessnessPlaces', {});
  report(rows.length === expected.places, `HomelessnessPlaces: ${rows.length} places, want ${expected.places}`);
}

console.log('\n== must be empty');
for (const [name, args] of [['VancouverSubregions', { year: 2019 }], ['CountBreakdown', { sourceId: 'hsabc-pit', placeId: 'syd-city', period: '2025-03' }]]) {
  const { problem, rows } = await invoke(name, args);
  report(!problem && rows.length === 0, `${name} ${JSON.stringify(args)}: ${rows.length} rows${problem ? '  ' + problem : ''}`);
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall passed');
process.exit(failures ? 1 : 0);
