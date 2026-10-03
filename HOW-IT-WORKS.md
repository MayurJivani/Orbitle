# How Orbit works

Orbit asks one question five times a day: how far out does this thing orbit?
You drag a marker on a radial dial, there are three dials and each is
logarithmic, and the score is about factors of ten rather than kilometres. This
document covers the decisions that are not obvious from the diff.

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

## Why there are three dials, and why each is logarithmic

The catalogue spans the Lunar Reconnaissance Orbiter at 1,787 km from the Moon's
centre to Voyager 1 at 167 AU, which is twenty-five billion km: seven and a half
factors of ten. On one linear dial every satellite, every moon and every inner
planet sits in the same pixel at the centre, and the game becomes "is it
Voyager, yes or no". A single log dial fixes that but is still seven and a half
decades wide, which makes every ring in the inner half unreadable.

So there are three, each two or three decades wide, and a round is asked on
whichever one its answer lives on:

| Dial | Range | Read against |
| :--- | :--- | :--- |
| Near Earth | 1,500 km to 120,000 km | Earth's surface, GPS, geostationary |
| Earth system | 100,000 km to 6 million km | the Moon, Webb at L2, the Moon x10 |
| Solar system | 0.2 AU to 250 AU | Earth's orbit, Jupiter, Neptune, Voyager 1 |

The first two are deliberately Earth-referenced whatever the round is about. A
round on Phobos puts Mars at the hub and Earth's landmark rings around it, so
the answer you walk away with is "Phobos orbits Mars between geostationary and
GPS". That comparison is the point; a dial labelled in Mars radii would be
precise and teach nobody anything.

`scaleFor(km)` returns the first dial whose range contains a distance. The
ranges do not overlap anywhere the catalogue sits, so no entry needs a stored
hint that could drift away from its distance, and the tests assert both halves
of that: every entry lands on exactly one dial, and no entry falls in a gap
between two.

Each range is also a little wider than the entries on it at both ends. An answer
sitting exactly on a stop would be a free guess, since the stop is the one ring
a player can find without knowing anything.

## Scoring on a share of the dial

`100 - 100 * |t_guess - t_actual|`, floored at zero, where `t` is the position
along the round's own dial. In plain terms: a point for every 1% of the dial you
miss by.

The obvious alternative, a flat penalty per factor of ten, was the first version
and is wrong here. Forty points per decade is a fair price on the solar dial,
which is three decades wide, and nearly free on Near Earth, which is under two:
the same 40 points would cover most of the whole dial. Five rounds spread across
three dials have to add up to one number, so the price of a miss has to be
denominated in the dial it happened on.

What this keeps from the per-decade version is the thing that matters: the
measure is logarithmic, so the absolute kilometre error is irrelevant. Being
400 km out matters enormously for the ISS and not at all for Jupiter.

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
its own: the three scales, the scoring, the seeded daily pick, the formatting
and the dial's geometry. `src/pages/index.astro` renders all three sets of rings
from that geometry at build time, `src/scripts/client.js` only shows the round's
own set and moves the marker, and `tests/orbit.test.js` tests the module
directly. One source for the rings and the pointer maths means the ring a player
aims at is the ring the score is computed from, which a second copy of the
constants would eventually break.

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

`shared/objects.js`, about sixty entries, rounded public figures from NASA and
JPL fact sheets. Rounding is fine: the scoring cannot see a 1% error. A test
checks every entry for a unique id, a distance on the dial, a known `kind` and
the copy the panel needs, and asserts the catalogue stays above fifty entries,
which is roughly ten days of play before the pool starts repeating.

Growing it is the cheapest way to improve the game, and it is the only part of
this repo that needs no code.
