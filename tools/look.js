#!/usr/bin/env node
// See what the patterns in a file will look like, without a browser.
//   node tools/look.js <file>.js            every pattern in the file
//   node tools/look.js <file>.js pony       just one
// It builds each pattern with the app's own code and prints:
//   - where every part ended up (base, tip, which way it points, what touches the floor)
//   - three text pictures: FRONT (as the viewer sees it), SIDE (from the viewer's right; the front of the model is on the LEFT),
//     and TOP (looking down; the front of the model is at the BOTTOM). One letter per part; @ eyes, * dots, ~ lines.
// Run validate.js first: this assumes the stitch counts add up.
const fs = require('fs'), path = require('path');
let THREE; try { THREE = require('three'); } catch (e) { console.error('look.js needs three.js for its vector maths. Once, in this folder:  npm i --no-save three@0.160.0'); process.exit(2); }
const APP = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(APP, 'utf8');
const cut = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); if (i < 0 || j < 0) throw new Error('cannot find engine code in index.html: ' + a); return html.slice(i, j); };
const NAMES = ['EGG', 'EGGP', 'HEAD_BODY', 'ARM', 'FOOT', 'STUB', 'BALL12', 'EAR_ROUND', 'EAR_POINT', 'LEAF', 'BIG_HEAD_BODY', 'QUAD_BODY', 'LIMB12'];
const E = new Function('THREE', 'V3', 'W', 'H', 'TAU', 'DEG', 'clamp',
  cut('const EGG = `', 'const CREATURES = [') + cut('function splitTop(', '/* =====================================================================\n   RENDERING') +
  `; return {${NAMES.join(',')},buildCreature};`)(THREE, THREE.Vector3, 1, 0.9, Math.PI * 2, Math.PI / 180, (x, a, b) => Math.max(a, Math.min(b, x)));

const file = process.argv[2], only = process.argv[3];
if (!file) { console.error('usage: node look.js <file.js> [id]'); process.exit(2); }
const defs = new Function(...NAMES, 'return (' + fs.readFileSync(file, 'utf8') + '\n);')(...NAMES.map(n => E[n]));
const f1 = v => (Math.abs(v) < .05 ? 0 : v).toFixed(1), P = v => `(${f1(v.x)}, ${f1(v.y)}, ${f1(v.z)})`;
const way = d => { const a = [['right', d.x], ['left', -d.x], ['up', d.y], ['down', -d.y], ['forward', d.z], ['back', -d.z]].sort((p, q) => q[1] - p[1]); return a[0][0] + (a[1][1] > .45 ? ' and ' + a[1][0] : ''); };

for (const def of defs) {
  if (only && def.id !== only) continue;
  console.log(`\n==================== ${def.id} (${def.name})`);
  let cr; try { cr = E.buildCreature(Object.assign({ extras: [] }, def)); } catch (e) { console.log('  CANNOT BUILD: ' + e.message); continue; }
  const box = cr.box, size = box.getSize(new THREE.Vector3()), floor = box.min.y;
  console.log(`  ${cr.insts.length} stitches. Size: ${f1(size.x)} wide (x), ${f1(size.y)} tall (y), ${f1(size.z)} deep (z), in stitch-widths. About ${cr.heightCm} cm tall in worsted yarn.`);
  console.log('  x: viewer\'s right. y: up. z: toward the viewer. Positions are stitch-widths from the middle of the root.\n');
  const letter = i => i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(97 + i - 26);
  const partOf = new Int16Array(cr.insts.length);
  for (const c of cr.copies) for (let k = c.first; k < c.last; k++) partOf[k] = c.info.pi;
  const onFloor = [];
  for (const c of cr.copies) {
    const info = c.info, a = c.first + info.rstart[info.N - 1], base = new THREE.Vector3(), tip = c.plugs[0].p;
    for (let k = a; k < c.last; k++) base.add(cr.insts[k].p); base.multiplyScalar(1 / (c.last - a));
    let lo = 1e9; for (let k = c.first; k < c.last; k++) lo = Math.min(lo, cr.insts[k].p.y);
    if (lo < floor + .8) onFloor.push(info.pd.name + (info.copies.length > 1 ? ' #' + (c.ci + 1) : ''));
    const d = tip.clone().sub(base), len = d.length();
    const label = `${letter(info.pi)} ${info.pd.name}${info.copies.length > 1 ? ' #' + (c.ci + 1) : ''}`;
    if (info.pd.root) console.log(`  ${label.padEnd(24)} ROOT   first round at ${P(tip)}, last round at ${P(base)}, lowest point y ${f1(lo)}`);
    else if (info.pd.conform) console.log(`  ${label.padEnd(24)} patch  centred at ${P(tip)}`);
    else console.log(`  ${label.padEnd(24)} sewn on at ${P(base)}, tip at ${P(tip)}: points ${len > .2 ? way(d.normalize()) : '?'}, ${f1(len)} long, lowest point y ${f1(lo)}`);
  }
  console.log(`\n  Floor is at y ${f1(floor)}. Touching it: ${onFloor.join(', ')}`);
  const marks = [];
  for (const x of cr.extras) { const ch = x.e.kind === 'eye' ? '@' : x.e.kind === 'dot' ? '*' : '~'; for (const s of x.pts) marks.push([s.p.clone().addScaledVector(s.n, .6), ch]); if (x.lines) for (const l of x.lines) for (const p of l) marks.push([p, ch]); }
  const seen = {};
  const draw = (title, hx, vy, dz, note) => {      // hx, vy, dz: functions of a point giving the horizontal, vertical (up is +) and depth (nearer is +) coordinate
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const s of cr.insts) { x0 = Math.min(x0, hx(s.p)); x1 = Math.max(x1, hx(s.p)); y0 = Math.min(y0, vy(s.p)); y1 = Math.max(y1, vy(s.p)); }
    const SX = 2, Wd = Math.ceil((x1 - x0) * SX) + 4, Ht = Math.ceil(y1 - y0) + 2;
    const g = Array.from({ length: Ht }, () => new Array(Wd).fill(' ')), z = Array.from({ length: Ht }, () => new Float32Array(Wd).fill(-1e9));
    const put = (p, ch, bias) => { const c = Math.round((hx(p) - x0) * SX) + 1, r = Ht - 1 - Math.round(vy(p) - y0), d = dz(p) + bias; for (const cc of [c, c + 1]) if (r >= 0 && r < Ht && cc >= 0 && cc < Wd && d > z[r][cc]) { z[r][cc] = d; g[r][cc] = ch; } };
    cr.insts.forEach((s, i) => put(s.p, letter(partOf[i]), 0));
    for (const [p, ch] of marks) put(p, ch, .3);
    for (const row of g) for (let c = 1; c < Wd - 1; c++) if (row[c] === ' ' && row[c - 1] !== ' ' && row[c + 1] !== ' ') row[c] = row[c - 1];
    const cnt = {}; for (const row of g) for (const ch of row) if (ch !== ' ') cnt[ch] = (cnt[ch] || 0) + 1; seen[title] = cnt;
    console.log(`\n  ${title}  ${note}`);
    for (const row of g) { const t = row.join('').replace(/\s+$/, ''); if (t) console.log('  | ' + t); }
  };
  draw('FRONT', p => p.x, p => p.y, p => p.z, 'as the viewer sees it: viewer\'s right is on the right');
  draw('SIDE', p => -p.z, p => p.y, p => p.x, 'from the viewer\'s right: the FRONT of the model is on the LEFT');
  draw('TOP', p => p.x, p => -p.z, p => p.y, 'looking down: the FRONT of the model is at the BOTTOM');
  console.log('\n  How much of each part shows (cells in FRONT / SIDE / TOP). A part showing 0 everywhere is buried:');
  cr.partInfo.forEach(info => { const L = letter(info.pi); console.log(`    ${L} ${info.pd.name.padEnd(20)} ${['FRONT', 'SIDE', 'TOP'].map(v => String(seen[v][L] || 0).padStart(4)).join(' /')}`); });
}
