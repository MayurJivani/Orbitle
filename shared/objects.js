/**
 * The catalogue. One entry per thing worth guessing.
 *
 * `km` is the distance from the centre of whatever it orbits:
 *   kind 'orbit'    -> semi-major axis (the honest average, not the altitude)
 *   kind 'distance' -> current distance from the Sun, for probes on escape
 *                      trajectories that have no semi-major axis to quote
 *
 * That one number plus the primary's mu is enough for all three questions: the
 * period and the mean speed are derived in orbit.js rather than curated here,
 * so they cannot disagree with the distance.
 *
 * `tags` are the subject categories a day draws across. `ring` marks the
 * handful of entries that double as landmark rings on their frame's dials,
 * labelled the short way a player would say them.
 *
 * Values are rounded public figures (NASA/JPL fact sheets). Nothing here needs
 * to be precise to the kilometre: a guess is scored on a log scale where a 1%
 * error is invisible. Altitudes are converted to radii using the primary's mean
 * radius, so an ISS entry reads 6,790 km, not 420 km.
 */

const AU = 149_597_870

export const OBJECTS = [
	// --- Low Earth orbit: everything within a few hundred km of the surface ---
	{ id: 'iss', name: 'The ISS', primary: 'Earth', kind: 'orbit', km: 6_791, tags: ['station'], ring: 'the ISS', note: 'About 420 km up, which is why it crosses the sky in minutes.' },
	{ id: 'sputnik1', name: 'Sputnik 1', primary: 'Earth', kind: 'orbit', km: 6_948, tags: ['dead', 'satellite'], note: 'The first one. A low, lopsided orbit that decayed in three months.' },
	{ id: 'tiangong', name: 'Tiangong station', primary: 'Earth', kind: 'orbit', km: 6_761, tags: ['station'], note: 'Slightly lower than the ISS, same band.' },
	{ id: 'skylab', name: 'Skylab', primary: 'Earth', kind: 'orbit', km: 6_806, tags: ['station', 'dead'], note: 'Came down over Western Australia in 1979, earlier than anyone planned.' },
	{ id: 'hubble', name: 'Hubble', primary: 'Earth', kind: 'orbit', km: 6_906, tags: ['observatory'], note: 'Low enough that the Shuttle could reach it five times.' },
	{ id: 'starlink', name: 'A Starlink satellite', primary: 'Earth', kind: 'orbit', km: 6_921, tags: ['comms'], note: 'The 550 km shell. Low on purpose: short round trips, fast decay.' },
	{ id: 'oneweb', name: 'A OneWeb satellite', primary: 'Earth', kind: 'orbit', km: 7_571, tags: ['comms'], note: 'Higher than Starlink, so fewer satellites cover the same ground.' },
	{ id: 'landsat9', name: 'Landsat 9', primary: 'Earth', kind: 'orbit', km: 7_076, tags: ['earth-watch'], note: 'Sun-synchronous, so every image is shot at the same local time.' },
	{ id: 'sentinel2', name: 'Sentinel-2', primary: 'Earth', kind: 'orbit', km: 7_157, tags: ['earth-watch'], note: 'Another sun-synchronous imager, a touch higher than Landsat.' },
	{ id: 'envisat', name: 'Envisat', primary: 'Earth', kind: 'orbit', km: 7_161, tags: ['dead', 'earth-watch'], note: 'Dead since 2012 and eight tonnes of it, which makes it a collision worry.' },
	{ id: 'kh11', name: 'A KH-11 spy satellite', primary: 'Earth', kind: 'orbit', km: 7_006, tags: ['spy'], note: 'Low and sun-synchronous, so it passes over the same place at the same hour.' },
	{ id: 'lacrosse', name: 'A Lacrosse radar satellite', primary: 'Earth', kind: 'orbit', km: 7_051, tags: ['spy'], note: 'Radar rather than cameras, so cloud and darkness do not matter.' },
	{ id: 'zenit', name: 'A Zenit spy satellite', primary: 'Earth', kind: 'orbit', km: 6_621, tags: ['spy', 'dead'], note: 'Soviet, and it returned its film by dropping the whole capsule.' },
	{ id: 'iridium', name: 'An Iridium satellite', primary: 'Earth', kind: 'orbit', km: 7_151, tags: ['comms'], note: '780 km up, 66 of them, covering the poles that geostationary cannot.' },
	{ id: 'noaa', name: 'A NOAA weather satellite', primary: 'Earth', kind: 'orbit', km: 7_241, tags: ['earth-watch'], note: 'Polar orbit, two passes a day over any given spot.' },
	{ id: 'explorer1', name: 'Explorer 1', primary: 'Earth', kind: 'orbit', km: 7_825, tags: ['dead', 'satellite'], note: 'America’s first satellite, and it found the radiation belts by flying through them.' },

	// --- Mid Earth orbit and out to the Moon ---
	{ id: 'vanguard1', name: 'Vanguard 1', primary: 'Earth', kind: 'orbit', km: 8_596, tags: ['dead', 'satellite'], note: 'Dead since 1964 and still up there: the oldest object in orbit.' },
	{ id: 'telstar1', name: 'Telstar 1', primary: 'Earth', kind: 'orbit', km: 9_813, tags: ['dead', 'comms'], note: 'Relayed the first live television across the Atlantic, for 20 minutes per pass.' },
	{ id: 'glonass', name: 'A GLONASS satellite', primary: 'Earth', kind: 'orbit', km: 25_510, tags: ['navigation'], note: 'Navigation constellations sit far out so a few can see you at once.' },
	{ id: 'gps', name: 'A GPS satellite', primary: 'Earth', kind: 'orbit', km: 26_560, tags: ['navigation'], ring: 'GPS', note: 'Twice a day round the Earth, 20,200 km up.' },
	{ id: 'molniya', name: 'A Molniya satellite', primary: 'Earth', kind: 'orbit', km: 26_600, tags: ['comms'], note: 'A deliberately lopsided orbit that loiters over high latitudes.' },
	{ id: 'beidou', name: 'A BeiDou satellite', primary: 'Earth', kind: 'orbit', km: 27_878, tags: ['navigation'], note: 'China’s navigation constellation, a little higher than GPS.' },
	{ id: 'galileo', name: 'A Galileo satellite', primary: 'Earth', kind: 'orbit', km: 29_600, tags: ['navigation'], note: 'Europe’s navigation constellation, higher again.' },
	{ id: 'geo', name: 'A TV broadcast satellite', primary: 'Earth', kind: 'orbit', km: 42_164, tags: ['comms'], ring: 'geostationary', note: 'Geostationary: one orbit per day, so the dish never has to move.' },
	{ id: 'chandra', name: 'Chandra X-ray Observatory', primary: 'Earth', kind: 'orbit', km: 80_770, tags: ['observatory'], note: 'Flung far out to spend most of its time above the radiation belts.' },
	{ id: 'moon', name: 'The Moon', primary: 'Earth', kind: 'orbit', km: 384_400, tags: ['moon'], ring: 'the Moon', note: 'The reference everyone actually has a feel for.' },

	// --- Things orbiting other moons and planets ---
	{ id: 'lro', name: 'Lunar Reconnaissance Orbiter', primary: 'the Moon', kind: 'orbit', km: 1_787, tags: ['probe'], note: 'Fifty km above the lunar surface. The closest orbit in the catalogue.' },
	{ id: 'mro', name: 'Mars Reconnaissance Orbiter', primary: 'Mars', kind: 'orbit', km: 3_696, tags: ['probe'], note: 'Mars is small, so a 300 km orbit is a small radius too.' },
	{ id: 'phobos', name: 'Phobos', primary: 'Mars', kind: 'orbit', km: 9_376, tags: ['moon'], note: 'So close it rises twice a day and is slowly falling in.' },
	{ id: 'charon', name: 'Charon', primary: 'Pluto', kind: 'orbit', km: 19_591, tags: ['moon'], note: 'Big enough, close enough, that the pair orbit each other.' },
	{ id: 'deimos', name: 'Deimos', primary: 'Mars', kind: 'orbit', km: 23_463, tags: ['moon'], note: 'The small outer one, barely more than a captured rock.' },
	{ id: 'proteus', name: 'Proteus', primary: 'Neptune', kind: 'orbit', km: 117_647, tags: ['moon'], note: 'About as big as a body can be and still not be round.' },
	{ id: 'miranda', name: 'Miranda', primary: 'Uranus', kind: 'orbit', km: 129_900, tags: ['moon'], note: 'Cliffs twenty km high on a moon 470 km across.' },
	{ id: 'amalthea', name: 'Amalthea', primary: 'Jupiter', kind: 'orbit', km: 181_400, tags: ['moon'], note: 'Red, lumpy, and inside Io’s orbit.' },
	{ id: 'mimas', name: 'Mimas', primary: 'Saturn', kind: 'orbit', km: 185_539, tags: ['moon'], note: 'The one with the crater that makes it look like a battle station.' },
	{ id: 'ariel', name: 'Ariel', primary: 'Uranus', kind: 'orbit', km: 190_900, tags: ['moon'], note: 'The brightest of the Uranian moons.' },
	{ id: 'enceladus', name: 'Enceladus', primary: 'Saturn', kind: 'orbit', km: 237_948, tags: ['moon'], note: 'Venting water from the south pole, which is why anyone cares.' },
	{ id: 'umbriel', name: 'Umbriel', primary: 'Uranus', kind: 'orbit', km: 266_000, tags: ['moon'], note: 'The dark one, for reasons nobody has settled.' },
	{ id: 'tethys', name: 'Tethys', primary: 'Saturn', kind: 'orbit', km: 294_619, tags: ['moon'], note: 'Ice, and a canyon that runs most of the way round it.' },
	{ id: 'triton', name: 'Triton', primary: 'Neptune', kind: 'orbit', km: 354_759, tags: ['moon'], note: 'Orbits backwards, so it was almost certainly captured.' },
	{ id: 'dione', name: 'Dione', primary: 'Saturn', kind: 'orbit', km: 377_396, tags: ['moon'], note: 'Almost exactly the Moon’s distance, around a much heavier planet.' },
	{ id: 'io', name: 'Io', primary: 'Jupiter', kind: 'orbit', km: 421_700, tags: ['moon'], note: 'Closest of the four Galileans, and the most volcanic place known.' },
	{ id: 'titania', name: 'Titania', primary: 'Uranus', kind: 'orbit', km: 435_910, tags: ['moon'], note: 'Largest Uranian moon, and still smaller than our own.' },
	{ id: 'rhea', name: 'Rhea', primary: 'Saturn', kind: 'orbit', km: 527_108, tags: ['moon'], note: 'Saturn’s second largest, and mostly ice.' },
	{ id: 'oberon', name: 'Oberon', primary: 'Uranus', kind: 'orbit', km: 583_520, tags: ['moon'], note: 'Outermost of the big Uranian moons.' },
	{ id: 'europa', name: 'Europa', primary: 'Jupiter', kind: 'orbit', km: 671_034, tags: ['moon'], note: 'Ice shell, ocean underneath, the obvious place to look.' },
	{ id: 'ganymede', name: 'Ganymede', primary: 'Jupiter', kind: 'orbit', km: 1_070_412, tags: ['moon'], note: 'Bigger than Mercury, and the only moon with its own magnetic field.' },
	{ id: 'titan', name: 'Titan', primary: 'Saturn', kind: 'orbit', km: 1_221_870, tags: ['moon'], ring: 'Titan', note: 'Thick atmosphere, methane lakes, rain.' },
	{ id: 'hyperion', name: 'Hyperion', primary: 'Saturn', kind: 'orbit', km: 1_481_009, tags: ['moon', 'oddity'], note: 'Tumbles chaotically: its orientation is genuinely unpredictable.' },
	{ id: 'callisto', name: 'Callisto', primary: 'Jupiter', kind: 'orbit', km: 1_882_709, tags: ['moon'], note: 'Outermost Galilean, far enough out to sit clear of the worst radiation.' },
	{ id: 'iapetus', name: 'Iapetus', primary: 'Saturn', kind: 'orbit', km: 3_560_820, tags: ['moon'], note: 'One hemisphere bright, the other nearly black.' },
	{ id: 'juno', name: 'The Juno probe', primary: 'Jupiter', kind: 'orbit', km: 4_100_000, tags: ['probe'], note: 'A long loop that dives close, then retreats back out of the radiation.' },
	{ id: 'nereid', name: 'Nereid', primary: 'Neptune', kind: 'orbit', km: 5_513_400, tags: ['moon', 'oddity'], note: 'One of the most lopsided orbits of any moon in the solar system.' },

	// --- Inner solar system: Mercury out to the asteroid belt ---
	{ id: 'parker', name: 'Parker Solar Probe', primary: 'the Sun', kind: 'orbit', km: 0.39 * AU, tags: ['probe'], note: 'Dips to 0.046 AU at perihelion, closer than anything else has flown.' },
	{ id: 'mercury', name: 'Mercury', primary: 'the Sun', kind: 'orbit', km: 0.387 * AU, tags: ['planet'], note: '0.39 AU. A year there is 88 days.' },
	{ id: 'venus', name: 'Venus', primary: 'the Sun', kind: 'orbit', km: 0.723 * AU, tags: ['planet'], note: '0.72 AU, and the hottest surface in the solar system.' },
	{ id: 'solarorbiter', name: 'Solar Orbiter', primary: 'the Sun', kind: 'orbit', km: 0.81 * AU, tags: ['probe'], note: 'Tilted out of the ecliptic to photograph the Sun’s poles.' },
	{ id: 'apophis', name: 'Apophis', primary: 'the Sun', kind: 'orbit', km: 0.922 * AU, tags: ['asteroid'], note: 'Passes inside the geostationary ring in 2029, and misses.' },
	{ id: 'earth', name: 'Earth', primary: 'the Sun', kind: 'orbit', km: AU, tags: ['planet'], ring: 'Earth', note: 'One astronomical unit, by definition.' },
	{ id: 'jwst', name: 'The James Webb telescope', primary: 'the Sun', kind: 'orbit', km: 1.01 * AU, tags: ['observatory'], note: 'Orbits the Sun, holding station 1.5 million km outside Earth at L2.' },
	{ id: 'bennu', name: 'Bennu', primary: 'the Sun', kind: 'orbit', km: 1.126 * AU, tags: ['asteroid'], note: 'A loose pile of rubble that OSIRIS-REx grabbed a sample of.' },
	{ id: 'roadster', name: 'Elon Musk’s Roadster', primary: 'the Sun', kind: 'orbit', km: 1.325 * AU, tags: ['oddity'], note: 'An Earth-crossing orbit that reaches past Mars.' },
	{ id: 'eros', name: 'Eros', primary: 'the Sun', kind: 'orbit', km: 1.458 * AU, tags: ['asteroid'], note: 'The first asteroid anything ever landed on.' },
	{ id: 'mars', name: 'Mars', primary: 'the Sun', kind: 'orbit', km: 1.524 * AU, tags: ['planet'], ring: 'Mars', note: '1.52 AU, which is why a signal takes minutes each way.' },
	{ id: 'encke', name: 'Comet Encke', primary: 'the Sun', kind: 'orbit', km: 2.22 * AU, tags: ['comet'], note: 'A 3.3 year period: the shortest of any known comet.' },
	{ id: 'vesta', name: 'Vesta', primary: 'the Sun', kind: 'orbit', km: 2.36 * AU, tags: ['asteroid'], note: 'Second heaviest thing in the asteroid belt.' },
	{ id: 'ceres', name: 'Ceres', primary: 'the Sun', kind: 'orbit', km: 2.77 * AU, tags: ['dwarf'], note: 'Middle of the belt, and the only dwarf planet inside Neptune.' },
	{ id: 'pallas', name: 'Pallas', primary: 'the Sun', kind: 'orbit', km: 2.77 * AU, tags: ['asteroid'], note: 'Belt neighbour of Ceres on a steeply tilted orbit.' },
	{ id: 'psyche', name: 'Psyche', primary: 'the Sun', kind: 'orbit', km: 2.92 * AU, tags: ['asteroid'], note: 'Metal-rich, which is why a mission is on the way to it.' },
	{ id: 'tempel1', name: 'Comet Tempel 1', primary: 'the Sun', kind: 'orbit', km: 3.14 * AU, tags: ['comet'], note: 'The one Deep Impact shot a copper slug into.' },
	{ id: 'churyumov', name: 'Comet 67P', primary: 'the Sun', kind: 'orbit', km: 3.46 * AU, tags: ['comet'], note: 'Rosetta’s comet, the rubber duck.' },

	// --- Outer solar system: Jupiter out through the Kuiper belt ---
	{ id: 'achilles', name: 'Achilles', primary: 'the Sun', kind: 'orbit', km: 5.19 * AU, tags: ['trojan'], note: 'A Jupiter Trojan: it shares Jupiter’s orbit, 60 degrees ahead.' },
	{ id: 'patroclus', name: 'Patroclus', primary: 'the Sun', kind: 'orbit', km: 5.22 * AU, tags: ['trojan'], note: 'Two Trojans the same size orbiting each other, trailing Jupiter.' },
	{ id: 'eurybates', name: 'Eurybates', primary: 'the Sun', kind: 'orbit', km: 5.2 * AU, tags: ['trojan'], note: 'A Lucy mission target, and the leftover of a Trojan that broke up.' },
	{ id: 'jupiter', name: 'Jupiter', primary: 'the Sun', kind: 'orbit', km: 5.204 * AU, tags: ['planet'], ring: 'Jupiter', note: '5.2 AU, and more mass than everything else in orbit combined.' },
	{ id: 'saturn', name: 'Saturn', primary: 'the Sun', kind: 'orbit', km: 9.583 * AU, tags: ['planet'], note: '9.6 AU. Cassini needed seven years to get there.' },
	{ id: 'chiron', name: 'Chiron', primary: 'the Sun', kind: 'orbit', km: 13.7 * AU, tags: ['centaur'], note: 'Classed as an asteroid until it grew a coma.' },
	{ id: 'chariklo', name: 'Chariklo', primary: 'the Sun', kind: 'orbit', km: 15.8 * AU, tags: ['centaur'], note: 'A 250 km body with its own rings, which nobody expected.' },
	{ id: 'pholus', name: 'Pholus', primary: 'the Sun', kind: 'orbit', km: 20.4 * AU, tags: ['centaur'], note: 'One of the reddest things in the solar system, and nobody is sure why.' },
	{ id: 'halley', name: 'Halley’s Comet', primary: 'the Sun', kind: 'orbit', km: 17.8 * AU, tags: ['comet'], note: 'Averages out past Uranus, which is the 76 year wait.' },
	{ id: 'uranus', name: 'Uranus', primary: 'the Sun', kind: 'orbit', km: 19.19 * AU, tags: ['planet'], note: '19 AU, tipped on its side.' },
	{ id: 'neptune', name: 'Neptune', primary: 'the Sun', kind: 'orbit', km: 30.07 * AU, tags: ['planet'], ring: 'Neptune', note: '30 AU, found by arithmetic before anyone looked.' },
	{ id: 'orcus', name: 'Orcus', primary: 'the Sun', kind: 'orbit', km: 39.4 * AU, tags: ['kbo'], note: 'Locked to Neptune the same way Pluto is, half an orbit out of step.' },
	{ id: 'pluto', name: 'Pluto', primary: 'the Sun', kind: 'orbit', km: 39.48 * AU, tags: ['dwarf'], note: '39 AU average, though it does cut inside Neptune.' },
	{ id: 'haumea', name: 'Haumea', primary: 'the Sun', kind: 'orbit', km: 43.1 * AU, tags: ['dwarf'], note: 'Spun so fast it is shaped like a flattened egg.' },
	{ id: 'quaoar', name: 'Quaoar', primary: 'the Sun', kind: 'orbit', km: 43.7 * AU, tags: ['kbo'], note: 'Kuiper belt, and it has a ring that should not be stable.' },
	{ id: 'varuna', name: 'Varuna', primary: 'the Sun', kind: 'orbit', km: 42.9 * AU, tags: ['kbo'], note: 'Spins in under seven hours, which has stretched it out of round.' },
	{ id: 'arrokoth', name: 'Arrokoth', primary: 'the Sun', kind: 'orbit', km: 44.6 * AU, tags: ['kbo'], note: 'Two lobes stuck together. The furthest thing ever photographed close up.' },
	{ id: 'makemake', name: 'Makemake', primary: 'the Sun', kind: 'orbit', km: 45.4 * AU, tags: ['dwarf'], note: 'Bright, cold, and out past the main Kuiper belt.' },

	// --- Deep space: past Eris, and the things on their way out ---
	{ id: 'eris', name: 'Eris', primary: 'the Sun', kind: 'orbit', km: 67.8 * AU, tags: ['dwarf'], ring: 'Eris', note: 'Heavier than Pluto, and the reason Pluto got reclassified.' },
	{ id: 'gonggong', name: 'Gonggong', primary: 'the Sun', kind: 'orbit', km: 67.3 * AU, tags: ['dwarf'], note: 'Red, slow, and one of the largest things out there.' },
	{ id: 'farfarout', name: 'Farfarout', primary: 'the Sun', kind: 'orbit', km: 132 * AU, tags: ['kbo'], note: 'The most distant object ever confirmed in orbit around the Sun.' },
	{ id: 'halebopp', name: 'Comet Hale-Bopp', primary: 'the Sun', kind: 'orbit', km: 186 * AU, tags: ['comet'], note: 'Visible to the naked eye for 18 months, back in 1997.' },
	{ id: 'sedna', name: 'Sedna', primary: 'the Sun', kind: 'orbit', km: 506 * AU, tags: ['kbo'], ring: 'Sedna', note: 'Takes over eleven thousand years to go round once.' },
	{ id: 'newhorizons', name: 'New Horizons', primary: 'the Sun', kind: 'distance', km: 63 * AU, tags: ['probe'], note: 'Past Pluto, still transmitting, on its way out of the system.' },
	{ id: 'pioneer11', name: 'Pioneer 11', primary: 'the Sun', kind: 'distance', km: 125 * AU, tags: ['probe', 'dead'], note: 'Silent since 1995, heading for Aquila.' },
	{ id: 'voyager2', name: 'Voyager 2', primary: 'the Sun', kind: 'distance', km: 139 * AU, tags: ['probe'], note: 'Left the heliosphere in 2018. The only probe to visit Uranus and Neptune.' },
	{ id: 'pioneer10', name: 'Pioneer 10', primary: 'the Sun', kind: 'distance', km: 140 * AU, tags: ['probe', 'dead'], note: 'Silent since 2003, still coasting outward.' },
	{ id: 'voyager1', name: 'Voyager 1', primary: 'the Sun', kind: 'distance', km: 167 * AU, tags: ['probe'], note: 'The furthest human object. Roughly a day of light travel away.' },
]
