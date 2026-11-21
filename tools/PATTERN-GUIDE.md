# Writing a Loop by Loop pattern

Loop by Loop is a 3D crochet (amigurumi) stitch-along. A pattern is a JavaScript object. The app works out the 3D
shape from the stitch counts alone, so the counts ARE the shape. Read a few patterns in the `CREATURES` array of `index.html` first: those are
real patterns from the app that are known to look right.

## Your output

One file containing ONLY an array literal: `[ {...}, {...} ]`. No `const`, no `module.exports`, no trailing semicolon.
Check it with `node tools/validate.js <yourfile>.js` and fix every ERROR. Read the size table it prints.

## The object

```js
{ id:'cow', name:'Cow', cat:'farm', level:2, blurb:'Patches sewn on flat',
  yarn:{A:['Milk','#f7f5f0'], B:['Ink','#34313b']},      // any letters; ['Name shown to the crocheter', '#rrggbb']
  view:.3,                                              // camera angle, radians. .3 is a three-quarter front view
  parts:[ ... ],                                        // the FIRST part is the body: root:true
  extras:[ ... ] }                                      // eyes and embroidery
```

`level`: 1 beginner, 2 easy, 3 a bit more. `blurb`: under 40 characters, says what is distinctive about making it.
`cat` is given to you.

## Rounds

`rows` is a string, one round per line. Every piece starts with a magic ring.

```
mr 6                 magic ring of 6 stitches
inc*6                6 increases (12 stitches)
(sc 2, inc)*6        repeat the bracket 6 times
sc 30 | x3           three rounds the same
sc 30 | B            this round in yarn B (default is the part's color)
sc 30 | x2 | B       both
(sc 3, dec)*6        dec = two stitches worked into one
!stuff:              a note between rounds. Keys with built-in text: stuff, close, eyes. "!stuff: your own text" also works.
! Any sentence.      a free note
!close:              the piece is closed (last round must be down to about 6 stitches)
```

A round must use up exactly the stitches of the round before: `sc` uses 1 makes 1, `inc` uses 1 makes 2, `dec` uses 2
makes 1. The validator checks this.

### How counts become shape

- Radius of a round is about `stitches / 6.28` stitch-widths. A round is about 0.9 tall.
- Adding 6 per round (6, 12, 18, 24...) makes a flat circle, which stuffing rounds into a dome. Adding fewer makes a
  cone. Rounds of plain `sc` make a straight tube. Decreasing by 6 per round closes it back up.
- The root is stuffed, so it bulges into rounded forms. Other parts are unstuffed unless you give `stuff:.5`-`1`.
- A body 36 stitches around is about 11 stitch-widths across. A 6-stitch tube is 2 across. Keep parts in proportion.

Ready-made rows you can use by name:
`EGG` (19 rounds, widest 36: one-piece egg body with `!eyes:`), `EGGP` (the same without the eyes note),
`HEAD_BODY` (26 rounds: head rounds 1-15 widest 36, neck at 15-16, body 16-26 widest 30, has `!eyes:`),
`ARM` (6-stitch tube, 6 rounds), `FOOT` (9 stitches, 4 rounds), `STUB` (6-stitch tube, 4 rounds),
`BALL12` (small closed ball), `EAR_ROUND` (12-stitch cup), `EAR_POINT` (pointed, 4 to 10), `LEAF`.

Useful positions on `EGG`: eyes round 8.4, cheeks 9.6, wings 11.5 at angles +-80, feet 17.2 at +-24, ears 3.5.
On `HEAD_BODY`: eyes round 7.6-8.6, muzzle 10.4, ears 3-4, arms 17.2 at +-62, feet 23.6 at +-28, tail 21.6 at 180.

## Parts and where they go

The root is worked top-down: round 1 is the top, the last round is the bottom.

Every other part needs `at`, a place on its host (the root unless `at.on:'Part name'`):

```js
at:{round:11.5, angle:0}                       // one copy
at:{round:11.5, angles:[80,-80]}               // a pair
at:{spots:[[3.2,60],[3.2,-60],[8,180]]}        // copies at different rounds: [round, angle]
```

`round` counts down the host (0.4 is the very top, 9.5 is between rounds 9 and 10, host rounds + 0.5 is the very bottom).
`angle` is in degrees around the host: 0 is the front (toward the viewer), 90 the viewer's right, 180 the back.

A part's FIRST round is its far tip; its last round is sewn to the host. By default it points straight out from the
host's surface. To steer it:

- `aim:[x,y,z]` a world direction: x right, y up, z toward the viewer. For a pair, x is mirrored for the negative angle.
- `aimRel:[out,up]` relative to the host: `[1,-1]` is out and down, `[.2,1]` nearly straight up.
- `mix:` 0-1, how much the aim overrides "straight out" (default .7).
- `sink:` how far the open end is pushed into the host (default .3; .5-.9 for limbs; 1-1.7 for closed balls).
- `flat:.3`-`.6` squashes it flat: ears, wings, fins, feet.
- `bend:` curls it, in radians (try 1 for a curl, -1 for the other way; you cannot see it, so keep it modest).
- `stuff:.6`-`1` plumps it.
- `conform:true` makes it a flat patch sewn onto the host's surface (belly, spot, eye patch). Its rows must be a flat
  circle (`mr 6`, `inc*6`, `(sc, inc)*6`...). Nothing can attach to a patch.
- `sew:'...'` one sentence telling the crocheter how to attach it. Every non-root part needs one.

A closed part (ends `!close:`) is a ball that sits on the host: head on a body, tail, cherry.

Lying down: `rot:[Math.PI/2,0,0]` on the root lays it on its side, round 1 (the nose) toward the viewer. Then angle 0
is the BELLY, 180 is the TOP of the back, +-90 the sides, and `view` should be about .95. See the whale example.

On a part used as a host (`at.on`), small rounds are near its tip and angle 0 is its upper side.

## Extras

```js
{id:'eyes', kind:'eye', round:8.4, apart:8}                    // a pair of safety eyes, 8 stitches apart, centered on the front
{id:'eyes', kind:'eye', round:6.6, apart:16, center:180}       // centered on the top instead (lying-down bodies)
{id:'eyes', kind:'eye', on:'Head', round:3, apart:5, size:.42} // on another part. That part's rows need "!eyes:" where they go in
{id:'nose', kind:'dot', color:'#e9718f', round:9.7, angle:0, size:.45, text:'Embroider a pink nose.'}
{id:'cheeks', kind:'dot', color:'#f39ab0', round:9.6, apart:13, size:.5, text:'Add two pink cheeks.'}
{id:'spots', kind:'dot', color:'#fff', spots:[[5,30],[7,-40]], size:.3, text:'...'}     // many at once
{id:'smile', kind:'line', color:'#2b2233', pts:[[10.2,-11],[10.7,0],[10.2,11]], text:'Embroider a small smile.'}
{id:'ribs', kind:'line', color:'#c8601a', lines:[[[1,30],[9,30]],[[1,90],[9,90]]], text:'...'}   // several lines
```

Points are `[round, angle]` on the host. Every `dot` and `line` needs `text`. Eyes on the root use the `!eyes:` note
in the root's rows as the moment they are fitted, so use `EGGP` or leave the note out if the eyes go on another part.
Eyes default to size .58; use .42-.5 on small heads. Eyes over a patch need `lift:.35`.

## What makes one look right

- Two or three signature features do the work: a cow is patches, horns and a pink muzzle. Do not add ten parts.
- Usually 2-6 kinds of part, 500-1300 stitches in all.
- Put the face on the upper half of the head, eyes 7-12 stitches apart, with a small feature between or below them.
- Ears go near the top (rounds 2.5-4.5) at angles +-35 to +-60. Limbs come in pairs with mirrored angles.
- Pick yarn colors that read at a glance and name them plainly ('Butter', 'Moss', 'Coal').
- If the validator prints a part with a length under 2 and a sink over 1, it is buried. If a limb is longer than the
  body is wide, it is too long.

