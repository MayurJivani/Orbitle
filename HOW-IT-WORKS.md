# How Orbit works

Orbit asks one question five times a day: how far out does this thing orbit?
You drag a marker on a radial dial, the dial is logarithmic, and the score is
about factors of ten rather than kilometres. This document covers the decisions
that are not obvious from the diff.

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

## Why the dial is logarithmic

The catalogue spans the Lunar Reconnaissance Orbiter at 1,787 km from the Moon's
centre to Voyager 1 at 167 AU, which is twenty-five billion km. That is seven
and a half factors of ten. On a linear dial every satellite, every moon and
every inner planet would sit in the same pixel at the centre, and the game would
be "is it Voyager, yes or no".

So the radius is `log10`, mapped over a fixed window of 1,000 km to 200 AU. The
window is deliberately a little wider than the catalogue at both ends: a target
sitting exactly on a stop would be a free answer, since the stop is the one ring
a player can find without knowing anything. `tests/orbit.test.js` asserts that
every entry lands strictly inside it, so adding an entry that breaks the rule
fails the test rather than quietly making a round trivial.

Scoring follows the same logic: `100 - 40 * |log10(guess) - log10(actual)|`,
floored at zero. A factor of ten out costs 40, a factor of two costs about 12,
and the absolute kilometre error is irrelevant. Being 400 km out matters
enormously for the ISS and not at all for Jupiter, and a score that treats those
the same would be scoring arithmetic rather than knowledge.

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
its own: the scale, the scoring, the seeded daily pick, the formatting and the
dial's geometry. `src/pages/index.astro` renders the rings from that geometry at
build time, `src/scripts/client.js` only moves the marker and reveals answers,
and `tests/orbit.test.js` tests the module directly. One source for the rings
and the pointer maths means the ring a player aims at is the ring the score is
computed from, which a second copy of the constants would eventually break.

Two things in the client that are less obvious than they look:

- Pointer position comes from the SVG's own `getScreenCTM()` rather than from
  arithmetic on the bounding rect. The element's box is not square once
  `max-height` clips it on a wide screen, and the viewBox letterboxes inside it,
  so a hand-rolled conversion aims at the wrong ring. That was a real bug, found
  by aiming at the Moon's ring and reading back 87 million km.
- The dial is a `role="slider"` with keyboard handling, not drag-only. Arrows
  move a fifth of a factor of ten, shift-arrow or page up/down a whole one, home
  and end hit the stops, and enter locks the guess in. A game whose only input
  is a drag is a game some people cannot play.

## The catalogue

`shared/objects.js`, about sixty entries, rounded public figures from NASA and
JPL fact sheets. Rounding is fine: the scoring cannot see a 1% error. A test
checks every entry for a unique id, a distance on the dial, a known `kind` and
the copy the panel needs, and asserts the catalogue stays above fifty entries,
which is roughly ten days of play before the pool starts repeating.

Growing it is the cheapest way to improve the game, and it is the only part of
this repo that needs no code.
