# Loop by Loop

A 3D crochet stitch-along. Pick one of 41 amigurumi patterns, watch it grow in a time-lapse, then
crochet along one stitch at a time while the model shows every strand of yarn.

**Live:** https://dustin-gamble.github.io/loop-by-loop/

The whole thing is one self-contained page, `index.html`. It needs internet once, for three.js 0.160.0
from jsDelivr and two Google Fonts. Nothing is sent anywhere; progress is kept in the browser.

These are original beginner patterns in the single-crochet-in-the-round style. The stitch counts are
checked to add up, but the patterns have not been test-crocheted.

## Using it

| Key | What it does |
| --- | --- |
| **Space** | Next stitch (in Step). In Expert view the hook makes it in slow motion. |
| **←** | Back one stitch |
| **↓** / **↑** | One hook move forward / back: insert, yarn over, pull up a loop, yarn over, pull through |
| **E** | Expert view on and off |
| **R** | Replay the stitch |

- **Time-lapse / Slow / Step** set how the build plays. *Hook pace* sets seconds per stitch in Expert view,
  and *This stitch* drags the hook through the stitch by hand.
- **Tracking:** one dot per stitch of the round in hand (grouped by repeat, colored by increase and decrease),
  a running stitch total, a checklist of pieces, and checked-off rounds in the written pattern.
  A teal marker in the model sits in the first stitch of the round. The gallery remembers how far you got
  on each pattern and which ones you have made.

## What a stitch is made of

Each stitch is drawn as the yarn really runs (`stitchGeo`), in a local frame where x is to the right
(work travels left, as for a right-handed crocheter), y is toward the next round and z is out of the fabric:

- **the post**: two legs (`LEG`) that come out from under the top loops of the stitch below and spread into a V;
- **the top loops**: one flat loop (`TEAR`) along the top edge. Its near strand is the front loop, its far strand the back loop;
- a pad of shadowed fabric and one wrong-side bar, so the piece is solid from inside too.

The yarn is a four-ply strand: a normal map and a shading map generated at load (`yarnMaps`) wrap every tube.
In the vertex shader each post's foot is pulled over to the stitch it was actually worked into (`aBase`), so the
two stitches of an increase share a foot and a decrease straddles two.

## Expert view

A close-up from the crocheter's side: working edge up, hook coming in from the right, one piece at a time.

- Loops that have not been worked into yet are tinted, front loop one color and back loop another
  (the pair is picked to stand off from the yarn in hand). The two loops the hook goes under are labeled.
- Each stitch is a clip, `t` = 0…1, in five moves. The hook, three loose strands (the old working loop, the
  pulled-up loop, the new working loop) and the yarn from the ball are all a function of `t`
  (`prepStitch` / `hookAt` / `evalStitch`), so the clip can be played, stopped after any move, or dragged.
  At `SWAP` the finished stitch takes over.
- A pink arrow shows what happens next: the path of the hook, or the way the yarn goes over it. The strand
  that is moving glows, the fabric gives way around the hook (`HOOK_PUSH`), and the view tips further over
  the edge while the hook is behind the fabric.

## Writing patterns

Patterns live in the `CREATURES` array near the top of the script. One round per line:

```
mr 6                 magic ring of 6
(sc 2, inc)*6        repeat six times
sc 30 | x3           three rounds the same
sc 30 | B            this round in yarn B
!stuff: Stuff it.    a note between rounds (keys: stuff, close, eyes, or your own)
```

- A round that does not use up exactly the stitches of the round before throws on load.
- Shapes are solved from the stitch counts in `simulate()`; every stitch is one instance, in build order.
- Parts attach to a host with `at:{round, angle}`, `at:{round, angles:[…]}` or `at:{spots:[[round, angle], …]}`,
  and are aimed with `aim` / `aimRel`, `mix`, `flat`, `bend`, `sink`, `stuff`. `conform:true` sews a flat
  circle onto the host. `at.on` names another part as the host.
- `extras` add safety eyes, embroidered dots (`spots` for many) and lines (`lines` for many).
- `kind:'object'` files a pattern under Things in the gallery.

## Rendering notes

- The model sits on a turntable; the camera and lights never move, so the light always comes from the upper left.
- A depth pre-pass keeps the yarn shader to what is visible. If frames stay slow the page probes whether
  lower settings actually help before giving up resolution or the shadow pass (`govern`).
- `.claude/launch.json` serves the folder on port 5173 for previewing.
