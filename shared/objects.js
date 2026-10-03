/**
 * The catalogue. One entry per thing worth guessing.
 *
 * `km` is the distance from the centre of whatever it orbits:
 *   kind 'orbit'    -> semi-major axis (the honest average, not the altitude)
 *   kind 'distance' -> current distance from the Sun, for probes on escape
 *                      trajectories that have no semi-major axis to quote
 *
 * Values are rounded public figures (NASA/JPL fact sheets). Nothing here needs
 * to be precise to the kilometre: a guess is scored on a log scale where a 1%
 * error is invisible. Altitudes are converted to radii using the primary's mean
 * radius, so an ISS entry reads 6,790 km, not 420 km.
 */

const AU = 149_597_870

export const OBJECTS = [
	// --- Low Earth orbit: everything within a few hundred km of the surface ---
	{ id: 'iss', name: 'The ISS', primary: 'Earth', kind: 'orbit', km: 6_791, note: 'About 420 km up, which is why it crosses the sky in minutes.' },
	{ id: 'sputnik1', name: 'Sputnik 1', primary: 'Earth', kind: 'orbit', km: 6_948, note: 'The first one. A low, lopsided orbit that decayed in three months.' },
	{ id: 'tiangong', name: 'Tiangong station', primary: 'Earth', kind: 'orbit', km: 6_761, note: 'Slightly lower than the ISS, same band.' },
	{ id: 'hubble', name: 'Hubble', primary: 'Earth', kind: 'orbit', km: 6_906, note: 'Low enough that the Shuttle could reach it five times.' },
	{ id: 'starlink', name: 'A Starlink satellite', primary: 'Earth', kind: 'orbit', km: 6_921, note: 'The 550 km shell. Low on purpose: short round trips, fast decay.' },
	{ id: 'landsat9', name: 'Landsat 9', primary: 'Earth', kind: 'orbit', km: 7_076, note: 'Sun-synchronous, so every image is shot at the same local time.' },
	{ id: 'sentinel2', name: 'Sentinel-2', primary: 'Earth', kind: 'orbit', km: 7_157, note: 'Another sun-synchronous imager, a touch higher than Landsat.' },
	{ id: 'iridium', name: 'An Iridium satellite', primary: 'Earth', kind: 'orbit', km: 7_151, note: '780 km up, 66 of them, covering the poles that geostationary cannot.' },
	{ id: 'noaa', name: 'A NOAA weather satellite', primary: 'Earth', kind: 'orbit', km: 7_241, note: 'Polar orbit, two passes a day over any given spot.' },

	// --- Mid Earth orbit and out to the Moon ---
	{ id: 'vanguard1', name: 'Vanguard 1', primary: 'Earth', kind: 'orbit', km: 8_596, note: 'Dead since 1964 and still up there: the oldest object in orbit.' },
	{ id: 'glonass', name: 'A GLONASS satellite', primary: 'Earth', kind: 'orbit', km: 25_510, note: 'Navigation constellations sit far out so a few can see you at once.' },
	{ id: 'gps', name: 'A GPS satellite', primary: 'Earth', kind: 'orbit', km: 26_560, note: 'Twice a day round the Earth, 20,200 km up.' },
	{ id: 'molniya', name: 'A Molniya satellite', primary: 'Earth', kind: 'orbit', km: 26_600, note: 'A deliberately lopsided orbit that loiters over high latitudes.' },
	{ id: 'galileo', name: 'A Galileo satellite', primary: 'Earth', kind: 'orbit', km: 29_600, note: 'Europe’s navigation constellation, higher than GPS.' },
	{ id: 'geo', name: 'A TV broadcast satellite', primary: 'Earth', kind: 'orbit', km: 42_164, note: 'Geostationary: one orbit per day, so the dish never has to move.' },
	{ id: 'chandra', name: 'Chandra X-ray Observatory', primary: 'Earth', kind: 'orbit', km: 80_770, note: 'Flung far out to spend most of its time above the radiation belts.' },
	{ id: 'moon', name: 'The Moon', primary: 'Earth', kind: 'orbit', km: 384_400, note: 'The reference everyone actually has a feel for.' },

	// --- Things orbiting other moons and planets ---
	{ id: 'lro', name: 'Lunar Reconnaissance Orbiter', primary: 'the Moon', kind: 'orbit', km: 1_787, note: 'Fifty km above the lunar surface. The closest orbit in the catalogue.' },
	{ id: 'mro', name: 'Mars Reconnaissance Orbiter', primary: 'Mars', kind: 'orbit', km: 3_696, note: 'Mars is small, so a 300 km orbit is a small radius too.' },
	{ id: 'phobos', name: 'Phobos', primary: 'Mars', kind: 'orbit', km: 9_376, note: 'So close it rises twice a day and is slowly falling in.' },
	{ id: 'charon', name: 'Charon', primary: 'Pluto', kind: 'orbit', km: 19_591, note: 'Big enough, close enough, that the pair orbit each other.' },
	{ id: 'deimos', name: 'Deimos', primary: 'Mars', kind: 'orbit', km: 23_463, note: 'The small outer one, barely more than a captured rock.' },
	{ id: 'miranda', name: 'Miranda', primary: 'Uranus', kind: 'orbit', km: 129_900, note: 'Cliffs twenty km high on a moon 470 km across.' },
	{ id: 'mimas', name: 'Mimas', primary: 'Saturn', kind: 'orbit', km: 185_539, note: 'The one with the crater that makes it look like a battle station.' },
	{ id: 'enceladus', name: 'Enceladus', primary: 'Saturn', kind: 'orbit', km: 237_948, note: 'Venting water from the south pole, which is why anyone cares.' },
	{ id: 'triton', name: 'Triton', primary: 'Neptune', kind: 'orbit', km: 354_759, note: 'Orbits backwards, so it was almost certainly captured.' },
	{ id: 'io', name: 'Io', primary: 'Jupiter', kind: 'orbit', km: 421_700, note: 'Closest of the four Galileans, and the most volcanic place known.' },
	{ id: 'titania', name: 'Titania', primary: 'Uranus', kind: 'orbit', km: 435_910, note: 'Largest Uranian moon, and still smaller than our own.' },
	{ id: 'europa', name: 'Europa', primary: 'Jupiter', kind: 'orbit', km: 671_034, note: 'Ice shell, ocean underneath, the obvious place to look.' },
	{ id: 'ganymede', name: 'Ganymede', primary: 'Jupiter', kind: 'orbit', km: 1_070_412, note: 'Bigger than Mercury, and the only moon with its own magnetic field.' },
	{ id: 'titan', name: 'Titan', primary: 'Saturn', kind: 'orbit', km: 1_221_870, note: 'Thick atmosphere, methane lakes, rain.' },
	{ id: 'hyperion', name: 'Hyperion', primary: 'Saturn', kind: 'orbit', km: 1_481_009, note: 'Tumbles chaotically: its orientation is genuinely unpredictable.' },
	{ id: 'callisto', name: 'Callisto', primary: 'Jupiter', kind: 'orbit', km: 1_882_709, note: 'Outermost Galilean, far enough out to sit clear of the worst radiation.' },
	{ id: 'juno', name: 'The Juno probe', primary: 'Jupiter', kind: 'orbit', km: 4_100_000, note: 'A long loop that dives close, then retreats back out of the radiation.' },
	{ id: 'iapetus', name: 'Iapetus', primary: 'Saturn', kind: 'orbit', km: 3_560_820, note: 'One hemisphere bright, the other nearly black.' },

	// --- Around the Sun: planets and dwarf planets ---
	{ id: 'parker', name: 'Parker Solar Probe', primary: 'the Sun', kind: 'orbit', km: 0.39 * AU, note: 'Dips to 0.046 AU at perihelion, closer than anything else has flown.' },
	{ id: 'mercury', name: 'Mercury', primary: 'the Sun', kind: 'orbit', km: 0.387 * AU, note: '0.39 AU. A year there is 88 days.' },
	{ id: 'venus', name: 'Venus', primary: 'the Sun', kind: 'orbit', km: 0.723 * AU, note: '0.72 AU, and the hottest surface in the solar system.' },
	{ id: 'solarorbiter', name: 'Solar Orbiter', primary: 'the Sun', kind: 'orbit', km: 0.81 * AU, note: 'Tilted out of the ecliptic to photograph the Sun’s poles.' },
	{ id: 'earth', name: 'Earth', primary: 'the Sun', kind: 'orbit', km: AU, note: 'One astronomical unit, by definition.' },
	{ id: 'jwst', name: 'The James Webb telescope', primary: 'the Sun', kind: 'orbit', km: 1.01 * AU, note: 'Orbits the Sun, holding station 1.5 million km outside Earth at L2.' },
	{ id: 'roadster', name: 'Elon Musk’s Roadster', primary: 'the Sun', kind: 'orbit', km: 1.325 * AU, note: 'An Earth-crossing orbit that reaches past Mars.' },
	{ id: 'mars', name: 'Mars', primary: 'the Sun', kind: 'orbit', km: 1.524 * AU, note: '1.52 AU, which is why a signal takes minutes each way.' },
	{ id: 'encke', name: 'Comet Encke', primary: 'the Sun', kind: 'orbit', km: 2.22 * AU, note: 'A 3.3 year period: the shortest of any known comet.' },
	{ id: 'vesta', name: 'Vesta', primary: 'the Sun', kind: 'orbit', km: 2.36 * AU, note: 'Second heaviest thing in the asteroid belt.' },
	{ id: 'ceres', name: 'Ceres', primary: 'the Sun', kind: 'orbit', km: 2.77 * AU, note: 'Middle of the belt, and the only dwarf planet inside Neptune.' },
	{ id: 'tempel1', name: 'Comet Tempel 1', primary: 'the Sun', kind: 'orbit', km: 3.14 * AU, note: 'The one Deep Impact shot a copper slug into.' },
	{ id: 'churyumov', name: 'Comet 67P', primary: 'the Sun', kind: 'orbit', km: 3.46 * AU, note: 'Rosetta’s comet, the rubber duck.' },
	{ id: 'jupiter', name: 'Jupiter', primary: 'the Sun', kind: 'orbit', km: 5.204 * AU, note: '5.2 AU, and more mass than everything else in orbit combined.' },
	{ id: 'saturn', name: 'Saturn', primary: 'the Sun', kind: 'orbit', km: 9.583 * AU, note: '9.6 AU. Cassini needed seven years to get there.' },
	{ id: 'halley', name: 'Halley’s Comet', primary: 'the Sun', kind: 'orbit', km: 17.8 * AU, note: 'Averages out past Uranus, which is the 76 year wait.' },
	{ id: 'uranus', name: 'Uranus', primary: 'the Sun', kind: 'orbit', km: 19.19 * AU, note: '19 AU, tipped on its side.' },
	{ id: 'neptune', name: 'Neptune', primary: 'the Sun', kind: 'orbit', km: 30.07 * AU, note: '30 AU, found by arithmetic before anyone looked.' },
	{ id: 'pluto', name: 'Pluto', primary: 'the Sun', kind: 'orbit', km: 39.48 * AU, note: '39 AU average, though it does cut inside Neptune.' },
	{ id: 'haumea', name: 'Haumea', primary: 'the Sun', kind: 'orbit', km: 43.1 * AU, note: 'Spun so fast it is shaped like a flattened egg.' },
	{ id: 'quaoar', name: 'Quaoar', primary: 'the Sun', kind: 'orbit', km: 43.7 * AU, note: 'Kuiper belt, and it has a ring that should not be stable.' },
	{ id: 'arrokoth', name: 'Arrokoth', primary: 'the Sun', kind: 'orbit', km: 44.6 * AU, note: 'Two lobes stuck together. The furthest thing ever photographed close up.' },
	{ id: 'makemake', name: 'Makemake', primary: 'the Sun', kind: 'orbit', km: 45.4 * AU, note: 'Bright, cold, and out past the main Kuiper belt.' },
	{ id: 'eris', name: 'Eris', primary: 'the Sun', kind: 'orbit', km: 67.8 * AU, note: 'Heavier than Pluto, and the reason Pluto got reclassified.' },
	{ id: 'halebopp', name: 'Comet Hale-Bopp', primary: 'the Sun', kind: 'orbit', km: 186 * AU, note: 'Visible to the naked eye for 18 months, back in 1997.' },

	// --- On the way out: no closed orbit left to average ---
	{ id: 'newhorizons', name: 'New Horizons', primary: 'the Sun', kind: 'distance', km: 63 * AU, note: 'Past Pluto, still transmitting, on its way out of the system.' },
	{ id: 'voyager2', name: 'Voyager 2', primary: 'the Sun', kind: 'distance', km: 139 * AU, note: 'Left the heliosphere in 2018. The only probe to visit Uranus and Neptune.' },
	{ id: 'pioneer10', name: 'Pioneer 10', primary: 'the Sun', kind: 'distance', km: 140 * AU, note: 'Silent since 2003, still coasting outward.' },
	{ id: 'voyager1', name: 'Voyager 1', primary: 'the Sun', kind: 'distance', km: 167 * AU, note: 'The furthest human object. Roughly a day of light travel away.' },
]
