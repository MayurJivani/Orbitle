# ORBITLE

[![Live](https://img.shields.io/website?url=https%3A%2F%2Forbitle.futile.studio&label=orbitle.futile.studio&style=flat-square)](https://orbitle.futile.studio)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro&logoColor=white)
![Node](https://img.shields.io/badge/Node-22%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)
![No backend](https://img.shields.io/badge/backend-none-5eb8ff?style=flat-square)
![Tests](https://img.shields.io/badge/tests-26%20passing-success?style=flat-square)
[![Last commit](https://img.shields.io/github/last-commit/MayurJivani/Orbitle?style=flat-square)](https://github.com/MayurJivani/Orbitle/commits/main)

A daily guessing game about orbits. Five rounds a day: how far out something
orbits, how long one orbit takes, how fast it is going.

```sh
npm install
npm run dev
```

Drag the marker to the ring you think is right, or use the arrow keys. The angle
is decoration: only the distance from the centre counts. Zoom with the wheel, or
`+` and `-`, to spread the rings out when you want to be precise. Zooming never
changes the marking.

## The three questions

| Question | Asked as | Dial |
| :--- | :--- | :--- |
| How far out | distance from whatever it orbits | km, millions of km, AU |
| How long | one orbit, start to finish | hours, days, years |
| How fast | mean speed along the orbit | km/s |

Only the distance is curated. The period and the speed are Kepler's third law
and a square root over the same number, so they cannot disagree with it.

## The five frames

A round is asked on whichever frame its answer lives in. The first two are read
against Earth whatever the round is about, because knowing Io orbits Jupiter a
little further out than our own Moon is the kind of answer worth having.

| Frame | Span |
| :--- | :--- |
| Near Earth | surface to just past geostationary |
| Earth system | geostationary to past the Moon |
| Inner solar system | Mercury to the asteroid belt |
| Outer solar system | Jupiter to the Kuiper belt |
| Deep space | past Eris, out to Sedna |

## Three difficulties

| Mode | What changes |
| :--- | :--- |
| Easy | landmark rings shown, gentle marking |
| Medium | landmark rings shown, a point per 1% of the dial missed |
| Hard | no landmarks, no frame named, and the dial covers the whole sky |

Score is 100 a round on the share of the dial you missed by, so five rounds
across different dials still add up to one comparable total. Easy and Hard bend
that line with an exponent rather than a gentler slope, so exact is 100 and a
full miss is 0 whichever mode you played. The mode is a choice for the day and
locks when you place your first answer, since it is what the earlier rounds were
scored on.

## What you learn when the answer lands

Every round ends with a fact sheet: how wide the thing is and what that is a
fraction of, how far above its host's surface it actually sits, how many orbits
a year that works out to, how long light takes to cross the distance, plus a
line about the thing and a line about whose orbit it is (what the host is, how
wide, how heavy, and one fact about it).

None of that is written out per entry. Each entry carries one distance and one
width; the host contributes a radius, a mass and a note; everything else is
arithmetic over those. Ninety-nine entries would otherwise need ninety-nine
paragraphs, and most of them would go stale.

Ninety-nine things to be asked about, in eighteen categories: stations, spy
satellites, dead missions, moons, Trojans, centaurs, Kuiper belt objects,
comets and the rest. Growing that list is the cheapest way to improve the game,
and it is the only part of this repo that needs no code.

## On a phone

The question sits above the dial, the readout and the one button that matters
are a fixed bar at the bottom, pinching the dial zooms it, and the marker's
touch target is 57 px across. The dial's labels are set in SVG user units, so
they are scaled up on a narrow screen to land at a readable size rather than
the five pixels they would otherwise render at.

The reasoning (why log dials, why five frames, why no backend) is in
**[HOW-IT-WORKS.md](HOW-IT-WORKS.md)**. What comes next, including a 3D mode, is
in [plan.md](plan.md).

```sh
npm test
```

## Deploying

A static build, so Jinx serves `dist/` off the disk and there is nothing to
restart. The box has no node, so it pulls this branch from GitHub and builds in
a throwaway `node:22-alpine` container.

```sh
sudo sh deploy/install.sh   # once, as root: app directory and the Caddy block
deploy/deploy.sh            # every time after that, from a dev box, not Jinx
```

The tunnel on that box is token-managed, so the hostname's ingress points at
`http://localhost:80` in the Cloudflare dashboard, which is the one part of the
route that cannot be set from the box.
