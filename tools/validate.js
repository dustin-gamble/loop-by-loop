#!/usr/bin/env node
// Check a file of Loop by Loop patterns.   node validate.js out/<name>.js
// The file must contain ONLY a JavaScript array literal of pattern objects: [ {...}, {...} ]
// It may use these constants: EGG, EGGP, HEAD_BODY, ARM, FOOT, STUB, BALL12, EAR_ROUND, EAR_POINT, LEAF, BIG_HEAD_BODY, QUAD_BODY, LIMB12, and Math.
const fs = require('fs');
const APP = require('path').join(__dirname, '..', 'index.html');
const CATS = ['farm', 'woodland', 'pets', 'ocean', 'polar', 'safari', 'garden', 'makebelieve', 'food', 'things', 'vehicles', 'cars', 'space', 'home', 'camp', 'play', 'veg', 'xmas'];
const html = fs.readFileSync(APP, 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); if (i < 0 || j < 0) throw new Error('cannot find engine code in index.html: ' + a); return html.slice(i, j); };
const NAMES = ['EGG', 'EGGP', 'HEAD_BODY', 'ARM', 'FOOT', 'STUB', 'BALL12', 'EAR_ROUND', 'EAR_POINT', 'LEAF', 'BIG_HEAD_BODY', 'QUAD_BODY', 'LIMB12'];
const E = new Function('W', 'H', 'TAU', cut('const EGG = `', 'const CREATURES = [') + cut('function splitTop(', '/* =====================================================================\n   BUILD A CREATURE') +
  `; return {${NAMES.join(',')},expandRows,parseSeq,mkProfile};`)(1, 0.9, Math.PI * 2);
const existing = new Set([...html.matchAll(/\{ id:'([a-z0-9]+)'/g)].map(m => m[1]));

const file = process.argv[2]; if (!file) { console.error('usage: node validate.js <file.js>'); process.exit(2); }
let defs;
try { defs = new Function(...NAMES, 'return (' + fs.readFileSync(file, 'utf8') + '\n);')(...NAMES.map(n => E[n])); }
catch (e) { console.error('CANNOT READ FILE as an array literal: ' + e.message); process.exit(1); }
if (!Array.isArray(defs)) { console.error('The file must evaluate to an array of patterns.'); process.exit(1); }

let errors = 0, warns = 0; const seenIds = new Set();
for (const def of defs) {
  const err = m => { errors++; console.log('  ERROR  ' + m); }, warn = m => { warns++; console.log('  warn   ' + m); };
  console.log(`\n== ${def.id} (${def.name})`);
  if (!/^[a-z][a-z0-9]*$/.test(def.id || '')) err('id must be lowercase letters/digits');
  if (existing.has(def.id)) err(`id '${def.id}' already exists in the app`);
  if (seenIds.has(def.id)) err(`id '${def.id}' used twice in this file`); seenIds.add(def.id);
  if (!def.name) err('name missing'); if (!def.blurb) err('blurb missing'); else if (def.blurb.length > 44) warn('blurb is long (keep it under ~40 characters)');
  if (![1, 2, 3, 4].includes(def.level)) err('level must be 1, 2, 3 or 4 (4 is a big build)');
  if (!CATS.includes(def.cat)) err(`cat must be one of ${CATS.join(', ')}`);
  if (typeof def.view !== 'number') warn('view (camera angle in radians) missing; 0.3 is a good default');
  const yarn = def.yarn || {}; if (!Object.keys(yarn).length) err('yarn missing');
  for (const k in yarn) if (!Array.isArray(yarn[k]) || !/^#[0-9a-fA-F]{6}$/.test(yarn[k][1] || '')) err(`yarn.${k} must be ['Name', '#rrggbb']`);
  const parts = def.parts || [], byName = {}; let total = 0;
  if (!parts.length || !parts[0].root) err('the first part must be the root (root:true)');
  if (parts.filter(p => p.root).length !== 1) err('exactly one part must have root:true');
  parts.forEach((pd, pi) => {
    const tag = `part '${pd.name}'`;
    if (!pd.name) err('a part has no name'); if (byName[pd.name]) err(`${tag}: name used twice`);
    if (!yarn[pd.color]) err(`${tag}: color '${pd.color}' is not in yarn`);
    let rounds, notes;
    try { ({ rounds, notes } = E.expandRows(pd.rows || '', pd.color)); } catch (e) { err(`${tag}: ${e.message}`); return; }
    if (!rounds.length) { err(`${tag}: no rounds`); return; }
    let prev = 0, ok = true; const counts = [];
    rounds.forEach((rd, i) => {
      if (!yarn[rd.color]) { err(`${tag}, round ${i + 1}: color '${rd.color}' is not in yarn`); ok = false; }
      const ops = []; try { E.parseSeq(rd.src, ops, null); } catch (e) { err(`${tag}, round ${i + 1}: ${e.message}`); ok = false; return; }
      let c = 0, n = 0; for (const op of ops) { if (op.t === 'mr') n++; else if (op.t === 'sc') { c++; n++; } else if (op.t === 'inc') { c++; n += 2; } else { c += 2; n++; } }
      if (i === 0 && !/^mr/.test(rd.src)) { err(`${tag}: round 1 must be a magic ring (mr N)`); ok = false; }
      if (c !== prev) { err(`${tag}, round ${i + 1} "${rd.src}" works into ${c} stitches but the round before has ${prev}`); ok = false; }
      prev = n; counts.push(n);
    });
    if (!ok) return;
    const N = counts.length, closed = notes.some(n => n.key === 'close');
    if (closed && counts[N - 1] > 8) warn(`${tag}: closes on ${counts[N - 1]} stitches; finish with dec rounds down to 6 before !close:`);
    let L = 0, maxR = Math.max(...counts) / (Math.PI * 2);
    if (!pd.conform) { const prof = E.mkProfile(counts, closed, pd.stuff ?? (pd.root ? 1 : 0)); L = prof.L; }
    else { for (let i = 1; i < N; i++) if (counts[i] - counts[i - 1] !== 6 && counts[i] !== counts[i - 1]) warn(`${tag}: a conform patch should be a flat circle (add 6 per round)`); if (closed) err(`${tag}: a conform patch cannot be closed`); }
    let copies = 1;
    if (!pd.root) {
      const at = pd.at; if (!at) { err(`${tag}: needs at:{round, angle} or at:{round, angles:[...]} or at:{spots:[[round, angle], ...]}`); return; }
      const host = at.on ? byName[at.on] : byName[parts[0].name];
      if (at.on && !host) err(`${tag}: at.on '${at.on}' must name a part defined earlier`);
      if (host && host.conform) err(`${tag}: cannot attach to a conform patch`);
      const spots = at.spots || (at.angles || [at.angle ?? 0]).map(a => [at.round, a]); copies = spots.length;
      for (const [r, a] of spots) { if (typeof r !== 'number' || typeof a !== 'number') err(`${tag}: every spot needs a numeric round and angle`); else if (host && (r < 0 || r > host.N + 1.2)) err(`${tag}: round ${r} is off the host '${host.name}' (it has ${host.N} rounds)`); }
      if (!pd.sew) warn(`${tag}: add a short sew: '...' instruction`);
      if (!pd.conform && !closed && (pd.sink ?? .3) > L * .75) warn(`${tag}: sink ${pd.sink} buries most of a part only ${L.toFixed(1)} long`);
      if (pd.conform && (pd.flat || pd.bend || pd.aim || pd.aimRel)) warn(`${tag}: conform patches ignore flat/bend/aim`);
    }
    byName[pd.name] = { name: pd.name, N, conform: !!pd.conform, counts, notes };
    const sts = counts.reduce((a, b) => a + b, 0) * copies; total += sts;
    console.log(`  ${(pd.root ? 'ROOT ' : '') + pd.name}`.padEnd(26) + `rounds ${String(N).padStart(2)}  widest ${String(Math.max(...counts)).padStart(2)} sts (radius ${maxR.toFixed(1)})  length ${pd.conform ? 'flat' : L.toFixed(1)}  x${copies}  ${closed ? 'closed' : 'open'}  ${sts} sts`);
  });
  const root = byName[parts[0] && parts[0].name], ids = new Set();
  for (const e of def.extras || []) {
    const tag = `extra '${e.id}'`;
    if (!e.id) err('an extra has no id'); if (ids.has(e.id)) err(`${tag}: id used twice`); ids.add(e.id);
    if (!['eye', 'dot', 'line'].includes(e.kind)) { err(`${tag}: kind must be eye, dot or line`); continue; }
    const host = e.on ? byName[e.on] : root;
    if (e.on && !host) { err(`${tag}: on '${e.on}' is not a part`); continue; }
    if (host && host.conform) err(`${tag}: cannot sit on a conform patch; place it on the part underneath and use lift:.35`);
    const chk = r => { if (typeof r !== 'number' || (host && (r < 0 || r > host.N + 1.2))) err(`${tag}: round ${r} is off '${host ? host.name : '?'}' (${host ? host.N : '?'} rounds)`); };
    if (e.kind === 'line') { const ls = e.lines || (e.pts ? [e.pts] : null); if (!ls) err(`${tag}: needs pts or lines`); else for (const l of ls) { if (l.length < 2) err(`${tag}: a line needs at least 2 points`); for (const q of l) chk(q[0]); } }
    else if (e.spots) for (const q of e.spots) chk(q[0]);
    else { chk(e.round); if (e.apart == null && e.angle == null) err(`${tag}: needs apart (stitches between a pair) or angle, or spots`); }
    if (e.kind !== 'eye' && !e.color) err(`${tag}: needs a color '#rrggbb'`);
    if (e.kind !== 'eye' && !e.text) err(`${tag}: needs text (the instruction shown to the crocheter)`);
    if (e.kind === 'eye' && !e.text && host && !host.notes.some(n => n.key === e.id)) warn(`${tag}: no !${e.id}: note in '${host.name}', so the eyes are fitted last; add the note where they go in, or give text`);
  }
  if (def.level === 4) { if (total < 2000) warn(`${total} stitches is small for a big build; aim for 2,200 to 4,200`); if (total > 4600) warn(`${total} stitches is too many; keep a big build under about 4,200`); }
  else if (total > 1500) warn(`${total} stitches in all is a lot; aim for under about 1300`);
  console.log(`  total ${total} stitches`);
}
console.log(`\n${defs.length} patterns, ${errors} errors, ${warns} warnings`);
process.exit(errors ? 1 : 0);
