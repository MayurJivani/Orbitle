# How Orbitle works

Orbitle asks three questions, five times a day: how far out does this thing
orbit, how long does one orbit take, how fast is it going. All three are asked
the same way, by placing a marker on a logarithmic dial, and all three are
scored on how much of that dial you missed by. This document covers the
decisions that are not obvious from the diff.

## The shape: the relay shape, minus the relay

`~/Projects/FRC/GUIDELINES.md` gives two shapes to pick from. This is the relay
shape (Astro static pages, state that may die with the session) with the Node
process left out entirely, because there is nothing for it to do:

- The catalogue is roughly sixty hand-curated entries. It ships in the page.
- Scoring is pure arithmetic over those entries, so it runs in the browser.
- The day's five objects come from a seeded shuffle of the UTC date, so every
  device computes the same hand without asking anyone.
- Your guesses live in `localStorage`, because a day of guesses is not worth a
  database and losing it costs a player one puzzle.

That leaves a static build with no server, no sessions, no cookies and no user
input crossing a trust boundary, which is why there is no `env.ts`, no Zod and
no rate limiter here. The day that changes is the day scores are compared across
people rather than across days: that needs a relay, and the shape is already
written down in Noggin and Patina to copy from.

## Three questions, one mechanic

There is one interaction in this game: put a marker on a ring. The questions
differ only in what quantity sits under the marker, so the dial, the scoring,
the keyboard handling and the zoom are written once and `QUESTIONS` carries the
three differences (how to get the value, how to say it, what "too high" is
called). Adding a fourth question is a table entry, not a feature.

Only the distance is curated. The period is Kepler's third law and the mean
speed is a square root, both over the same semi-major axis and the primary's
standard gravitational parameter, of which there are nine. That is nine numbers
instead of two more hand-typed columns on ninety-nine entries, and it means the
period can never disagree with the distance it was derived from. The tests check
the derivation against published figures for the ISS, the Moon, Earth, Charon
and Jupiter, so an arithmetic slip fails loudly rather than teaching somebody
the wrong orbital period.

Probes on escape trajectories have no period and no orbital speed at all, so
`supports()` excludes them from two of the three questions, and the daily deal
only ever asks a question an object can answer.

## Why there are five frames, and why each dial is logarithmic

The catalogue spans the Lunar Reconnaissance Orbiter at 1,787 km from the Moon's
centre to Sedna at 506 AU. That is eight factors of ten. On one linear dial
every satellite, every moon and every inner planet sits in the same pixel at the
centre; on one log dial they are legible but cramped into the first fifth of it.

So distances are banded into five frames, and a round is asked on whichever
band its answer lives in:

| Frame | Range |
| :--- | :--- |
| Near Earth | 1,500 km to 95,000 km |
| Earth system | 95,000 km to 6 million km |
| Inner solar system | 0.2 AU to 4.5 AU |
| Outer solar system | 4.5 AU to 55 AU |
| Deep space | 55 AU to 600 AU |

They are distance bands rather than bodies (no "Jupiter system") on purpose. The
first two are then read against Earth's own landmarks whatever the round is
about: a round on Io puts Jupiter at the hub and the Moon's ring around it, and
the answer you keep is that Io orbits a little further out than our own Moon.
A dial labelled in Jupiter radii would be more precise and teach nobody
anything.

Bands share their boundaries rather than overlapping, so a distance belongs to
exactly one frame, nothing needs a stored hint that could drift away from its
distance, and the tests assert exactly that for all ninety-nine entries.

## Fifteen dials, none of them hand-tuned

Three questions times five frames is fifteen dials. Hand-tuning fifteen ranges
would be fifteen things to re-tune every time the catalogue grows, so `dialFor`
derives each one: take the entries that land on that frame and can answer that
question, and run from the smallest value to the largest, padded by a factor of
1.8 at both ends.

The padding is the point. An answer sitting on a stop would be a free guess,
because a stop is the one ring a player can find without knowing anything. The
tests assert every answer sits between 2% and 98% along its dial, that every
dial spans between 0.4 and 4 decades, and that no (question, frame) pair has
fewer than five things to ask about.

Landmark rings come from the catalogue too: a handful of entries carry a `ring`
label, and their value for the current question becomes the ring. So the Near
Earth period dial is labelled with the ISS at 1.5 hours and geostationary at 24
hours without a single number being typed twice. The one exception is Earth's
surface, which is a ring and not an orbit, so it only appears on distance
dials.

## Scoring on a share of the dial

`100 - 100 * |t_guess - t_actual|`, floored at zero, where `t` is the position
along the round's own dial. In plain terms: a point for every 1% of the dial you
miss by.

The obvious alternative, a flat penalty per factor of ten, was the first version
and is wrong here. Forty points per decade is a fair price on a three-decade
dial and nearly free on a two-decade one, and it is nonsense on a speed dial,
which is half a decade wide because speed goes as one over the root of the
distance. Five rounds across different dials have to add up to one number, so
the price of a miss is denominated in the dial it happened on.

What survives from the per-decade version is the thing that matters: the measure
is logarithmic, so the absolute error is irrelevant. Being 400 km out matters
enormously for the ISS and not at all for Jupiter.

## Zoom narrows the range, it does not magnify the drawing

Zooming is for precision: at 1x the Outer solar system dial runs from 2.9 to 82
AU, and placing Pluto rather than Neptune is a few pixels of difference.

The obvious implementation, scaling the SVG about the dial's centre, does not
work on a diagram of concentric rings. Scaling about the centre only ever
spreads out the innermost ring, and keeping an outer ring in view means panning
the hub off the screen. So zoom narrows the dial's *visible range* instead,
centred on the marker: at 4x the dial shows a quarter of its decades and the
rings the player is working between spread across the full radius.

Two consequences worth stating:

- The score is always computed on the whole dial, never on the window. Zooming
  in must not quietly change the marking, and there is a test that says so.
- The rings have to be redrawn per window, so they are drawn by the client
  rather than at build time, and the step they use depends on the window. A
  window wider than a factor of five gets 1-2-5 steps per decade, which spread
  evenly on a log axis. A narrower one gets nice linear steps, the way a map
  scale bar does it, because 1-2-5 across a window from 12 to 19 AU leaves
  exactly one ring and nothing to orient by. A test walks every zoom level of
  every dial and asserts at least two rings survive.

## Distance from what, exactly

Mixing geocentric and heliocentric distances on one dial is a real problem: the
ISS at 6,791 km and Earth at 1 AU are not measured from the same place.

The choice here is to measure every entry from the centre of whatever it orbits,
and to say which body that is, per round, on the hub at the centre of the dial
and in the panel ("orbits Saturn"). The rings are then a distance scale rather
than a map of the solar system, and the landmark rings (Earth's surface,
geostationary, the Moon, Earth's orbit, Jupiter, Neptune, Voyager 1) are there
to make that scale legible rather than to claim everything orbits the Sun.

Two consequences worth knowing:

- Altitudes are converted to radii before they go in the catalogue, so the ISS
  reads 6,791 km rather than 420 km. Quoting an altitude for one entry and a
  semi-major axis for another would make the dial a lie.
- Probes on escape trajectories (Voyager 1 and 2, Pioneer 10, New Horizons) have
  no semi-major axis to average, so they carry `kind: 'distance'` and a current
  distance from the Sun instead. The panel says "heading away from the Sun" for
  those rather than "orbits", because they are not coming back.

## Where the rules live

Everything the game knows is in `shared/orbit.js`, with no DOM and no clock of
its own: the frames, the questions, the physics, the dial derivation, the
scoring, the zoom window, the seeded daily deal, the formatting and the dial's
geometry. `src/scripts/client.js` draws what that module says and moves one
marker; it decides nothing. `tests/orbit.test.js` tests the module directly,
which is most of why it can cover fifteen dials and four zoom levels without a
browser.

One source for the rings and the pointer maths means the ring a player aims at
is the ring the score is computed from. A second copy of the constants would
eventually break that, and it would break it silently.

Three things in the client that are less obvious than they look:

- Pointer position comes from the SVG's own `getScreenCTM()` rather than from
  arithmetic on the bounding rect. The element's box is not square once
  `max-height` clips it on a wide screen, and the viewBox letterboxes inside it,
  so a hand-rolled conversion aims at the wrong ring. That was a real bug, found
  by aiming at the Moon's ring and reading back 87 million km.
- Anything inside the dial is shown and hidden with a class, never the `hidden`
  attribute. `hidden` is HTML-only: setting it on an SVG group parses fine,
  reads back fine, and does nothing at all. That was the second real bug, and it
  had all three dials drawing on top of each other while the code that set it
  reported success.
- The dial is a `role="slider"` with keyboard handling, not drag-only. Arrows
  move a fifth of a factor of ten, shift-arrow or page up/down a whole one, home
  and end hit the stops, and enter locks the guess in. A game whose only input
  is a drag is a game some people cannot play.

## The look

Near-black, two cold nebula washes and a starfield, rather than the studio's
blueprint theme (the graph-paper grid and drafting-table plates that Patina
uses). The subject here is the sky, not a plan of it, and a grid behind a dial
of orbits reads as a second set of rings competing with the real ones.

The stars are 220 SVG circles generated in the page's frontmatter from the same
seeded PRNG the daily pick uses, with `sqrt(random())` for the radius so they
scatter evenly over the disc instead of clumping at the centre. Seeded means
every build puts them in the same place, and generating them at build time means
no script, no layout shift and nothing to recompute on resize.

## The catalogue

`shared/objects.js`, ninety-nine entries, rounded public figures from NASA and
JPL fact sheets. Rounding is fine: the scoring cannot see a 1% error.

Each entry carries `tags`, the subject categories a day draws across: stations,
comms and spy satellites, dead missions, probes, moons, planets, dwarfs,
asteroids, Trojans, centaurs, Kuiper belt objects, comets and a handful of
oddities. The panel shows the category with the round, and a test asserts no
category has fewer than three members, since a category with one is a label and
not a category.

The tests also check every entry for a unique id, a frame, a known `kind`, a mu
for whatever it orbits, and the copy the panel needs.

Growing it is the cheapest way to improve the game, and it is the only part of
this repo that needs no code.
