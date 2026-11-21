#!/usr/bin/env node
// Make blobby parts rounder by reworking their stitch counts.
// A cap that climbs one step a round and then runs straight is a drum: flat on top, square at the shoulder.
// This spends some of the straight rounds on slower shoulders, so the cap becomes a dome.
// The number of rounds never changes, so every round a limb, an eye or a note refers to is still that round.
//   node round.js <index.html>                      report what would change
//   node round.js <index.html> --write              rewrite the file
//   node round.js <index.html> --only chick,pig     only these patterns (and no shared rows)
//   --bottom=1|.5|0                                 how much of the dome the closing end gets (default 1)
//   --skip=id,id                                    patterns to leave alone (default: the ones whose straight sides are the point)
// It was run once over the whole catalog on 2026-11-21. Run it with --only on new patterns: a second pass over a
// pattern it has already rounded can round it a little more.
const fs = require('fs');
const APP = process.argv[2], WRITE = process.argv.includes('--write');
const arg = n => { const a = process.argv.find(x => x.startsWith('--' + n + '=')); return a ? a.split('=')[1] : null; };
const ONLY = arg('only') ? arg('only').split(',') : null, BOTTOM = arg('bottom') == null ? 1 : +arg('bottom'), VERBOSE = process.argv.includes('--verbose');
// patterns whose straight sides or flat faces are the point, and parts that are discs, wheels or lids whatever they are on
const SKIP_ID = new Set((arg('skip') || 'pencil,car,tractor,train,satellite,candle,mug,cottage,yarnbasket,backpack,drum,present,sunflower,robot,broccoli').split(','));
const SKIP_PART = /wheel|saucer|brim|lid|base|plate|disc|ring|tier|roof|shell|cap\b|hat|bun|patty|pot|rim|sail|wing|fin|flipper|frill|tail|nose cone|cone|horn|beak|bill|snout|trunk/i;
let html = fs.readFileSync(APP, 'utf8');

// ---- the pattern language, as the app reads it
function splitTop(s) { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; }
function made(src, prev) {      // stitches a round uses and makes
  let use = 0, make = 0;
  const walk = s => { for (const term of splitTop(s)) { let m = term.match(/^\((.*)\)\s*\*\s*(\d+)$/); if (m) { for (let i = 0; i < +m[2]; i++) walk(m[1]); continue; } m = term.match(/^(mr|sc|inc|dec)(?:\s+(\d+))?(?:\s*\*\s*(\d+))?$/); if (!m) throw new Error('bad term ' + term); const k = +(m[2] || m[3] || 1); if (m[1] === 'mr') make += k; else if (m[1] === 'sc') { use += k; make += k; } else if (m[1] === 'inc') { use += k; make += 2 * k; } else { use += 2 * k; make += k; } } };
  walk(src); return { use, make };
}
function parse(text) {
  const rounds = [], notes = [];
  for (let line of text.split('\n')) {
    line = line.trim(); if (!line) continue;
    if (line[0] === '!') { notes.push({ after: rounds.length, raw: line }); continue; }
    const bits = line.split('|').map(s => s.trim()); let rep = 1, color = null;
    for (const b of bits.slice(1)) { const m = b.match(/^x(\d+)$/); if (m) rep = +m[1]; else color = b; }
    for (let i = 0; i < rep; i++) rounds.push({ src: bits[0], color });
  }
  let prev = 0; for (const r of rounds) { const m = made(r.src, prev); r.n = m.make; prev = r.n; }
  return { rounds, notes, closed: notes.some(n => /^!close:/.test(n.raw)) };
}
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const line = (p, c, q) => c === p ? `sc ${c}` : c > p ? (p === c - p ? `inc*${p}` : p / (c - p) === 2 ? `(sc, inc)*${c - p}` : `(sc ${p / (c - p) - 1}, inc)*${c - p}`) : (c === p - c ? `dec*${c}` : c / (p - c) === 2 ? `(sc, dec)*${p - c}` : `(sc ${c / (p - c) - 1}, dec)*${p - c}`);

// ---- the reshaping. c: counts per round. Returns new counts, or null when there is nothing to round.
// Each hump (pole to pole, or pole to neck) is given the outline of a ball, or of a capsule if it is longer than a ball:
// the count at each round follows the sine of how far round the curve it is. A cap that was already shaped by hand
// (anything but one plain step every round) is kept as it was.
function rounder(c, closed) {
  const N = c.length, out = c.slice(), q = c.reduce(gcd);
  if (q < 3) return null;
  if (!closed && c[N - 1] > .8 * Math.max(...c)) return null;      // an open tube or bowl (a leg, a neck, a dish): its closed end is a sole or a base, and stays flat
  const segs = []; let a = 0, falling = false;
  for (let i = 1; i < N; i++) { if (!falling && c[i] < c[i - 1]) falling = true; else if (falling && c[i] > c[i - 1]) { segs.push([a, i - 1]); a = i - 1; falling = false; } }
  segs.push([a, N - 1]);
  for (const [s, e] of segs) {
    const M = Math.max(...c.slice(s, e + 1)); if (M < 24) continue;
    let p1 = s; while (c[p1] < M) p1++; let p2 = e; while (c[p2] < M) p2--;
    if (p2 - p1 + 1 < 3) continue;      // no straight rounds to spend
    const pure = (end, top, dir) => { for (let j = 1; j <= Math.abs(top - end); j++) if (c[end + dir * j] - c[end + dir * (j - 1)] !== q) return false; return true; };
    const sides = [{ end: s, top: p1, dir: 1, pole: s === 0, k: 1 }, { end: e, top: p2, dir: -1, pole: e === N - 1 && closed, k: (e === N - 1 && closed) ? BOTTOM : 1 }];
    for (const d of sides) {
      d.old = Math.abs(d.top - d.end); d.pure = pure(d.end, d.top, d.dir) && d.k > 0;
      d.phi = d.pole ? 0 : Math.asin(Math.min(1, c[d.end] / M));
      const ideal = (Math.PI / 2 - d.phi) * M / 5.655;      // rounds a quarter of a ball of this girth takes
      d.need = d.pure ? d.old + Math.max(0, ideal - d.old) * d.k : d.old;
    }
    if (!sides[0].pure && !sides[1].pure) continue;
    const room = (e - s) - 1, fixed = sides.reduce((t, d) => t + (d.pure ? 0 : d.old), 0), flex = sides.reduce((t, d) => t + (d.pure ? d.need : 0), 0), k = Math.min(1, (room - fixed) / flex);
    for (const d of sides) d.n = d.pure ? Math.max(d.old, d.need * k) : d.old;
    const mid = Math.max(p1, Math.min(p2 - 1, Math.round(s + (e - s) * sides[0].n / (sides[0].n + sides[1].n))));
    sides[0].len = mid - s; sides[1].len = e - (mid + 1);
    for (const d of sides) {
      if (!d.pure) continue;
      const off = d.pole ? .5 : 0, c0 = c[d.end], floorq = Math.floor(.6 * M / q + 1e-6) * q; let prev = c0;
      for (let j = 1; j <= d.len; j++) {
        const t = M * Math.sin(d.phi + (Math.PI / 2 - d.phi) * Math.min(1, (j + off) / (d.n + off)));
        let x = Math.round(t / q + 1e-6) * q;
        if (d.pole) x = Math.max(x, Math.min(c0 + j * q, floorq));      // the usual quick start, so the tip is not a nub
        x = Math.max(x, prev, M - (d.len - j) * q); x = Math.min(x, prev + q, M); out[d.end + d.dir * j] = x; prev = x;
      }
    }
  }
  for (let i = 1; i < N; i++) { const d = out[i] - out[i - 1]; if (d && Math.abs(d) !== q) return null; }      // every round must still be one plain step
  return out.some((x, i) => x !== c[i]) ? out : null;
}
function rewrite(text) {      // rows text in, rows text out (or null)
  const { rounds, notes, closed } = parse(text), c = rounds.map(r => r.n), nc = rounder(c, closed);
  if (!nc) return null;
  const q = c.reduce(gcd), L = [];
  rounds.forEach((r, i) => { if (i && (nc[i] !== c[i] || nc[i - 1] !== c[i - 1])) r.src = line(nc[i - 1], nc[i], q); });
  let i = 0;
  while (i <= rounds.length) {
    for (const n of notes) if (n.after === i) L.push(n.raw);
    if (i === rounds.length) break;
    let j = i; while (j + 1 < rounds.length && rounds[j + 1].src === rounds[i].src && rounds[j + 1].color === rounds[i].color && !notes.some(n => n.after === j + 1)) j++;
    L.push(rounds[i].src + (j > i ? ` | x${j - i + 1}` : '') + (rounds[i].color ? ` | ${rounds[i].color}` : ''));
    i = j + 1;
  }
  // check it still adds up
  const back = parse(L.join('\n')); let prev = 0;
  back.rounds.forEach((r, k) => { const m = made(r.src, prev); if (k && m.use !== prev) throw new Error(`round ${k + 1} "${r.src}" uses ${m.use}, has ${prev}`); if (r.n !== nc[k]) throw new Error('count mismatch'); prev = r.n; });
  return { text: '\n' + L.join('\n'), from: c, to: nc };
}
const rle = a => { const o = []; for (let i = 0; i < a.length;) { let j = i; while (a[j + 1] === a[i]) j++; o.push(j > i ? `${a[i]}x${j - i + 1}` : a[i]); i = j + 1; } return o.join(' '); };

// ---- every rows string in the file: the shared ones, then each part's own
const edits = [], report = [];
const reShared = /^const ([A-Z0-9_]+) = `([^`]*)`;/gm; let m;
if (!ONLY) while ((m = reShared.exec(html))) { const r = rewrite(m[2]); if (r) { edits.push([m.index + m[0].indexOf('`') + 1, m[2].length, r.text]); report.push(`shared ${m[1]}\n    ${rle(r.from)}\n -> ${rle(r.to)}`); } }
const start = html.indexOf('const CREATURES = ['), end = html.indexOf('\n];\n', start);
const reRows = /rows:`([^`]*)`/g; reRows.lastIndex = start; let touched = new Set(), skipped = [];
while ((m = reRows.exec(html)) && m.index < end) {
  const before = html.slice(start, m.index), id = (before.match(/\{ id:'([a-z0-9]+)'[^]*$/) || [])[1], idAt = before.lastIndexOf("{ id:'"), ids = before.slice(idAt).match(/\{ id:'([a-z0-9]+)'/)[1];
  const nameAt = before.lastIndexOf("{name:'"), name = before.slice(nameAt).match(/\{name:'([^']+)'/)[1];
  if (ONLY && !ONLY.includes(ids)) continue;
  const r = rewrite(m[1]); if (!r) continue;
  if (SKIP_ID.has(ids) || SKIP_PART.test(name)) { skipped.push(`${ids} / ${name}`); continue; }
  edits.push([m.index + 6, m[1].length, r.text]); touched.add(ids);
  report.push(`${ids} / ${name}\n    ${rle(r.from)}\n -> ${rle(r.to)}`);
}
if (VERBOSE || !WRITE) console.log(report.join('\n'));
console.log(`\n${edits.length} parts rounder, in ${touched.size} patterns of their own${ONLY ? '' : ' plus the shared rows'}. Left alone on purpose: ${skipped.length}${VERBOSE ? '\n  ' + skipped.join('\n  ') : ''}`);
if (WRITE) { edits.sort((a, b) => b[0] - a[0]); for (const [at, len, text] of edits) html = html.slice(0, at) + text + html.slice(at + len); fs.writeFileSync(APP + '.tmp', html); fs.renameSync(APP + '.tmp', APP); console.log('written'); }
