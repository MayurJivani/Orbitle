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
