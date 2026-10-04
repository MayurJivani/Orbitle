# Orbitle — "Where is this thing orbiting?"

## One-liner
Place an object (satellite, planet, comet) on a simplified solar-system diagram at the orbit you think it belongs to.

## Core mechanic
Drag a marker onto a radial orbit diagram (Earth shown as reference). Score = distance from correct orbital radius (log scale, since orbits span ISS-altitude to Voyager-1 distance).

## Novelty
No direct existing game. Closest relative: "Size It Up" but for orbital distance instead of physical size.

## Engagement potential
Medium. Good as a quick daily, less infinite than distance/size games since the pool of "interesting orbiting things" is finite (~50-100 good entries before repeats).

## Data needs
- Orbital radius (semi-major axis) for: planets, moons, notable satellites (ISS, Starlink, GPS, geostationary), comets, probes (Voyager 1/2, JWST, New Horizons).
- Public, well-known values (NASA/JPL). No licensing issue — small hand-curated JSON, ~100 entries is enough for V1.

## MVP build plan
1. Hand-curate a JSON of ~60 objects with orbital radius (AU or km) + short label/emoji.
2. Render a log-scale radial diagram (SVG, concentric rings) with Earth's orbit marked as the reference ring.
3. Drag-to-place interaction → compare placed radius vs actual on log scale.
4. Score = `100 - k * |log(guess) - log(actual)|`, clamp at 0.
5. Daily mode: fixed seed picks 5 objects/day; async multiplayer = compare score against friends' same-day score.

## Difficulty & risks
Low-medium. No backend needed for V1 (static JSON + client scoring). Main work is making the log-scale diagram legible at both ISS-scale and Voyager-scale in the same view.

## Verdict
Solid low-risk filler project. Good first build to validate the "drag onto a scaled diagram" interaction pattern you'll reuse in Scale-of-Things and How-Far.

## Built (V1)

Named Orbitle. Live at orbitle.futile.studio.

Three questions over one mechanic (place a marker on a log dial): how far out,
how long one orbit takes, how fast it is going. Only the distance is curated;
period and speed are derived from it with Kepler and nine gravitational
parameters.

Five frames by distance, because one scale from a low lunar orbit to Sedna is
eight factors of ten and makes everything inside Jupiter a smudge. Near Earth
and Earth system are read against Earth's own landmarks whatever the round is
about. Three questions times five frames is fifteen dials, all derived from the
catalogue rather than hand-tuned.

Zoom narrows the dial's visible range around the marker (1x to 8x) rather than
magnifying the drawing, which on concentric rings only ever helps the innermost
one. Scoring is always on the whole dial, so zooming cannot change the marking.

Score is a point per 1% of the dial missed, so five rounds on different dials
add up to one comparable total. Ninety-nine entries in eighteen subject
categories. Space theme: near-black, nebula washes, seeded starfield. No
backend.

## Next iteration: 3D mode

A real 3D view alongside the dial, in the spirit of **Universe Sandbox 2**, with
**Celestia** and the **Gravity Simulator at orbitsimulator.com** as the other
two references. Celestia is the one to study for how it handles the scale
problem this game is entirely about (exaggerated body sizes, log-ish camera
distance, labels that survive a 10-order-of-magnitude zoom), and Gravity
Simulator for how little UI an orbit editor actually needs.

Shape it would take, to be decided when it is built:

- Guess by placing a body in a 3D scene and letting it orbit, rather than by
  dragging a radius on a flat dial. The scoring stays the same question: how far
  out, on a log scale.
- Reveal becomes an animation: the guessed orbit and the real one running
  together, which is a far better answer than two rings.
- Needs a renderer, which means the first real dependency in this repo (Three.js
  is the obvious one) and a decision about whether the dial stays as the default
  with 3D as a mode, or 3D becomes the game. Keep the dial: it is the
  accessible, keyboard-playable, instant-loading path, and a daily game cannot
  require a GPU.
- Bodies and orbital elements beyond semi-major axis (eccentricity,
  inclination) would need adding to the catalogue, which is currently one
  distance per entry on purpose.
