# ORBIT

[![Live](https://img.shields.io/website?url=https%3A%2F%2Forbit.futile.studio&label=orbit.futile.studio&style=flat-square)](https://orbit.futile.studio)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro&logoColor=white)
![Node](https://img.shields.io/badge/Node-22%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)
![No backend](https://img.shields.io/badge/backend-none-5eb8ff?style=flat-square)
![Tests](https://img.shields.io/badge/tests-11%20passing-success?style=flat-square)
[![Last commit](https://img.shields.io/github/last-commit/MayurJivani/Orbit?style=flat-square)](https://github.com/MayurJivani/Orbit/commits/main)

A daily guessing game about orbits. Five things a day, and the only question is
how far out it goes.

```sh
npm install
npm run dev
```

Drag the marker to the ring you think it orbits at, or use the arrow keys. The
angle is decoration: only the distance from the centre counts.

There are three dials, and a round is asked on whichever one its answer lives
on. Two of them are read against Earth whatever the round is about, because
knowing Phobos orbits Mars somewhere between geostationary and the GPS
constellation is the kind of answer worth having.

| Dial | Span |
| :--- | :--- |
| Near Earth | surface to geostationary |
| Earth system | geostationary to past the Moon |
| Solar system | Mercury to Voyager 1 |

Score is 100 a round, minus a point for every 1% of the dial you miss by. A
share of the dial rather than a flat penalty per factor of ten, so five rounds
on three different dials still add up to one comparable total.

Everyone gets the same five objects on the same UTC day, picked by a seeded
shuffle, which is what makes a score worth sending to someone. There is no
server: the catalogue ships with the page and the scoring happens in the browser.

The reasoning (why log scale, why a seed instead of a backend, why distances are
measured from whatever the thing orbits) is in
**[HOW-IT-WORKS.md](HOW-IT-WORKS.md)**.

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

The tunnel on that box is token-managed, so `orbit.futile.studio` also needs an
ingress pointing at `http://localhost:80` in the Cloudflare dashboard. Until
that exists the hostname has no DNS record and nothing reaches Caddy.
