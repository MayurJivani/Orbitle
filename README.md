# ORBIT

![Astro](https://img.shields.io/badge/Astro-6-BC52EE?style=flat-square&logo=astro&logoColor=white)
![Node](https://img.shields.io/badge/Node-22%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)
![No backend](https://img.shields.io/badge/backend-none-5eb8ff?style=flat-square)
![Tests](https://img.shields.io/badge/tests-11%20passing-success?style=flat-square)

A daily guessing game about orbits. Five things a day, one dial running from low
lunar orbit out past Voyager 1, and the only question is how far out it goes.

```sh
npm install
npm run dev
```

Drag the marker to the ring you think it orbits at, or use the arrow keys. The
angle is decoration: only the distance from the centre counts. Score is 100 per
round, minus 40 for every factor of ten you are out, so the game asks whether
you know the region, not the kilometre.

Everyone gets the same five objects on the same UTC day, picked by a seeded
shuffle, which is what makes a score worth sending to someone. There is no
server: the catalogue ships with the page and the scoring happens in the browser.

The reasoning (why log scale, why a seed instead of a backend, why distances are
measured from whatever the thing orbits) is in
**[HOW-IT-WORKS.md](HOW-IT-WORKS.md)**.

```sh
npm test
```
