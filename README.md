# Loop by Loop

A 3D crochet stitch-along. Pick one of 150 amigurumi patterns, on seventeen shelves, watch it grow in a time-lapse, then
crochet along one stitch at a time while the model shows every strand of yarn. Animals, and things that are not:
a teapot, a quadcopter, Saturn, a campfire, a pickle with a face, Santa. Sixteen are big builds of 2,600 to 4,000 stitches.

**Live:** https://dustingamble.com/loop-by-loop/

(The site's build copies `index.html` in from this repo, so after pushing here the site has to rebuild: push a
commit to `dustin-gamble/dustingamble`, or retry its last build in Cloudflare. The github.io address forwards there.)

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

- Every pattern opens on its time-lapse with one big **Start crocheting** button (or **Carry on** if you
  were in the middle of it). That drops you into the close-up, where a large **Next** button sits over the
  bottom right of the model, with **Back** and **1 move** beside it, sized for a thumb on a phone or tablet.
- **Time-lapse / Slow / Step** set how the build plays. *Hook pace* sets seconds per stitch in Expert view
  (12 by default, remembered), and *This stitch* drags the hook through the stitch by hand. There is a short
  beat between the five moves.
- **The line-up** at the top of the gallery stands every pattern on one floor, to scale, smallest at the front,
  next to a sitting house cat (45 cm, 18 in) and a 30 cm (12 in) ruler for scale. The floor squares are 4 inches
  (or 10 cm). Drag to turn it; scroll to zoom toward the pointer (or pinch, or + and −); drag to move about once
  zoomed in. Point at one for its height and time; tap it to jump to its card. The wheel leaves the page alone
  when the page was already scrolling as the pointer came over, when there is nothing left to zoom out of, and
  when most of the line-up is off screen, so it never traps a scroll down the page.
- **Inches or centimetres:** *Sizes in* on the gallery page; inches unless you change it (`UNIT`, `fmtLen`).
- **Time:** every card says how long the pattern takes, and the studio says how long is left. *Your pace* on the
  gallery page sets the stitches a minute (8, 12 or 18). The estimate is the stitches at that pace plus the time
  that is not stitching: 2 minutes to start each piece, 2 to stuff or close one, 6 to sew one on (9 for a flat
  patch), 4 for each set of eyes or embroidery (`timing`).
- **How big?** on a pattern's page makes it ¼, ½, 1×, 2× or 3× the size: same stitches, thinner or thicker yarn
  and hook (`SIZES`). Each button shows the height and the time at that size, and the time left once you have
  started. Gauge is what really sets the size (ten stitches side by side = 7.5 cm at 1×); the yarn and hook named
  are a guide. The time factors are estimates, not measurements: thread and giant yarn are both taken to be slower
  per stitch than chunky (0.55 to 0.85 of the pace), and stuffing and sewing to take 0.8 to 2.4 times as long.
  The size you pick is remembered, shows on the card, and the pattern stands at that size in the line-up.
- **Style** on a pattern's page: colours (pastel, bright, Christmas, autumn, ocean, candy), an outside (stripes,
  dipped, speckled) and eyes (big, small, sleepy, happy). The model, the card picture and the line-up all wear it,
  and the list of what you need and the written pattern say what to do differently (`look`, `yarnOf`, `styleNote`).
- **Old-school pattern** opens the whole pattern as plain text, in the usual abbreviations, to copy or print
  (`classicText`). It follows the size and style you picked.
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
- Yarn should not pass through yarn. The stitch is shaped so the tops of one round's posts and the feet of
  the next sit side by side (`LEG`, `TEAR`); top loops that have been worked into sit back behind the legs
  wrapped around them (`uTuck`); and during the clip every point on the loose strands is pushed off the
  other strands, the fabric near by and the hook (`relax`). In tight fabric strands still press into each
  other by up to about a third of their width, as real yarn squashes.
- In the close-up a halo of fine fibres is drawn round the yarn near the stitch in hand (`fuzzMat`, `fuzzLive`).

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
- `cat` files a pattern on a shelf in the gallery: farm, woodland, pets, ocean, polar, safari, garden, makebelieve, veg, xmas,
  food, things, vehicles, space, home, camp, play.
- Safety eyes are drawn 1.4 times the `size` a pattern gives (`EYE`): big eyes are most of what makes one cute.
  A face reads best with the eyes about a sixth of the round apart (`apart` is in stitches of that round), on the
  round halfway down the body, cheeks a round lower and a little wider, and a smile about 18 degrees wide.
- `level` runs 1 to 4. Level 4 is a **big build**: 2,200 to 4,200 stitches, a separate head and neck, thick limbs,
  25-40 cm tall. The *Big builds* chip in the gallery shows just those. Past 1,800 stitches a pattern is drawn with
  lighter stitch geometry (`mkStitchGeo`), so the frame rate holds.
- `front:true` in `at` or in an extra measures angles from the side of the host that faces the viewer (`frontOf`),
  so a face lands on the front of a head however the head is tilted. `face:[x,y,z]` says which way the broad side
  of a flattened part looks: sails, wheels, petals, flippers.
- `tools/PATTERN-GUIDE.md` is the full guide to writing one. `node tools/validate.js <file>` checks a file of new
  patterns (stitch counts, attachments, sizes) before they go into the page, and `node tools/look.js <file>` builds
  them with the page's own code and prints front, side and top views as text, one letter per part
  (it needs three.js once: `npm i --no-save three@0.160.0` in `tools/`).

## Rendering notes

- The model sits on a turntable; the camera and lights never move, so the light always comes from the upper left.
- A depth pre-pass keeps the yarn shader to what is visible. If frames stay slow the page probes whether
  lower settings actually help before giving up resolution or the shadow pass (`govern`).
- The line-up has its own small renderer. Each pattern wears a skin with one corner per stitch (`skinGeo`), zipped
  round to round, and the skin wears a picture of the real stitch: real stitch geometry set out as fabric and
  photographed square-on, once, into a color map and a normal map (`wear`). So it has the yarn's look under the
  same studio light as the cards, for a few hundred thousand triangles instead of the tens of millions that 150
  patterns of real stitches would be. Up close it is a picture of stitches, not stitches: outlines stay smooth.
- Shapes are solved once each and shared (`SIM`): an arm or an egg that twenty patterns use is worked out once.
  Building every pattern takes about half a second on a laptop, and the line-up fills in as they arrive.
- `.claude/launch.json` serves the folder on port 5173 for previewing.
