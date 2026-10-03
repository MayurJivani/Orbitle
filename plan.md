# Orbit — "Where is this thing orbiting?"

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

Three log dials instead of one, since one scale from a low lunar orbit to
Voyager 1 is seven and a half factors of ten and makes the inner solar system a
smudge. Near Earth (surface to geostationary) and Earth system (geostationary to
past the Moon) are both read against Earth landmarks whatever the round is
about; Solar system (Mercury to Voyager 1) is the third. A round uses whichever
dial its answer lives on. Score is a point per 1% of that dial you miss by, so
the five rounds stay comparable across dials. Space theme: near-black, nebula
washes, seeded starfield. No backend.

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
