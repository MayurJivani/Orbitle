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
 * Two lines of copy, and the difference between them is a game rule:
 *   `brief` is shown before the answer is placed, so it may not contain the
 *           distance, the period or the speed. Any one of those gives away the
 *           other two, since they are derivable from each other given the host.
 *   `note`  is shown after, and is free to say "about 420 km up".
 * A test formats all three quantities for every entry and fails if either the
 * brief or the host line contains one of them.
 *
 * Values are rounded public figures (NASA/JPL fact sheets). Nothing here needs
 * to be precise to the kilometre: a guess is scored on a log scale where a 1%
 * error is invisible. Altitudes are converted to radii using the primary's mean
 * radius, so an ISS entry reads 6,790 km, not 420 km.
 */

const AU = 149_597_870

export const OBJECTS = [
	// --- Low Earth orbit: everything within a few hundred km of the surface ---
	{ id: 'iss', name: 'The ISS', primary: 'Earth', kind: 'orbit', km: 6_791, tags: ['station'], ring: 'the ISS', size: 0.109, brief: 'Five space agencies, one truss, and somebody living aboard since 2000.', note: 'About 420 km up, which is why it crosses the sky in minutes.' },
	{ id: 'sputnik1', name: 'Sputnik 1', primary: 'Earth', kind: 'orbit', km: 6_948, tags: ['dead', 'satellite'], size: 0.00058, brief: 'A polished metal sphere with four whip antennas and a radio beep.', note: 'The first one. A low, lopsided orbit that decayed in three months.' },
	{ id: 'tiangong', name: 'Tiangong station', primary: 'Earth', kind: 'orbit', km: 6_761, tags: ['station'], size: 0.055, brief: 'China’s station: three modules, a robotic arm, crews of three.', note: 'Slightly lower than the ISS, same band.' },
	{ id: 'skylab', name: 'Skylab', primary: 'Earth', kind: 'orbit', km: 6_806, tags: ['station', 'dead'], size: 0.026, brief: 'Built from a spare Saturn V stage, and roomy enough to jog around inside.', note: 'Came down over Western Australia in 1979, earlier than anyone planned.' },
	{ id: 'hubble', name: 'Hubble', primary: 'Earth', kind: 'orbit', km: 6_906, tags: ['observatory'], size: 0.0132, brief: 'A mirror ground to the wrong shape, then given spectacles by a shuttle crew.', note: 'Low enough that the Shuttle could reach it five times.' },
	{ id: 'starlink', name: 'A Starlink satellite', primary: 'Earth', kind: 'orbit', km: 6_921, tags: ['comms'], size: 0.009, brief: 'Flat-packed, mass produced, and launched sixty at a time.', note: 'The 550 km shell. Low on purpose: short round trips, fast decay.' },
	{ id: 'oneweb', name: 'A OneWeb satellite', primary: 'Earth', kind: 'orbit', km: 7_571, tags: ['comms'], size: 0.004, brief: 'A smaller constellation aimed at ships, planes and remote ground stations.', note: 'Higher than Starlink, so fewer satellites cover the same ground.' },
	{ id: 'landsat9', name: 'Landsat 9', primary: 'Earth', kind: 'orbit', km: 7_076, tags: ['earth-watch'], size: 0.0043, brief: 'The ninth of a line that has photographed the same ground since 1972.', note: 'Sun-synchronous, so every image is shot at the same local time.' },
	{ id: 'sentinel2', name: 'Sentinel-2', primary: 'Earth', kind: 'orbit', km: 7_157, tags: ['earth-watch'], size: 0.0035, brief: 'Europe’s crop and coastline camera, thirteen spectral bands of it.', note: 'Another sun-synchronous imager, a touch higher than Landsat.' },
	{ id: 'envisat', name: 'Envisat', primary: 'Earth', kind: 'orbit', km: 7_161, tags: ['dead', 'earth-watch'], size: 0.026, brief: 'Eight tonnes of radar and spectrometers, and Europe’s largest ever satellite.', note: 'Dead since 2012 and eight tonnes of it, which makes it a collision worry.' },
	{ id: 'kh11', name: 'A KH-11 spy satellite', primary: 'Earth', kind: 'orbit', km: 7_006, tags: ['spy'], size: 0.019, brief: 'A classified telescope the size of Hubble, pointed down instead of up.', note: 'Low and sun-synchronous, so it passes over the same place at the same hour.' },
	{ id: 'lacrosse', name: 'A Lacrosse radar satellite', primary: 'Earth', kind: 'orbit', km: 7_051, tags: ['spy'], size: 0.015, brief: 'Radar imaging, so cloud cover and darkness make no difference to it.', note: 'Radar rather than cameras, so cloud and darkness do not matter.' },
	{ id: 'zenit', name: 'A Zenit spy satellite', primary: 'Earth', kind: 'orbit', km: 6_621, tags: ['spy', 'dead'], size: 0.005, brief: 'A converted Vostok capsule carrying film instead of a cosmonaut.', note: 'Soviet, and it returned its film by dropping the whole capsule.' },
	{ id: 'iridium', name: 'An Iridium satellite', primary: 'Earth', kind: 'orbit', km: 7_151, tags: ['comms'], size: 0.004, brief: 'Handset-to-satellite calls, from a constellation that cross-links in space.', note: '780 km up, 66 of them, covering the poles that geostationary cannot.' },
	{ id: 'noaa', name: 'A NOAA weather satellite', primary: 'Earth', kind: 'orbit', km: 7_241, tags: ['earth-watch'], size: 0.0042, brief: 'The source of the cloud imagery on most weather forecasts.', note: 'Polar orbit, two passes a day over any given spot.' },
	{ id: 'explorer1', name: 'Explorer 1', primary: 'Earth', kind: 'orbit', km: 7_825, tags: ['dead', 'satellite'], size: 0.002, brief: 'A pencil of a satellite whose Geiger counter found the radiation belts.', note: 'America’s first satellite, and it found the radiation belts by flying through them.' },

	// --- Mid Earth orbit and out to the Moon ---
	{ id: 'vanguard1', name: 'Vanguard 1', primary: 'Earth', kind: 'orbit', km: 8_596, tags: ['dead', 'satellite'], size: 0.00016, brief: 'A grapefruit with six antennas, and the first thing to run on solar cells.', note: 'Dead since 1964 and still up there: the oldest object in orbit.' },
	{ id: 'telstar1', name: 'Telstar 1', primary: 'Earth', kind: 'orbit', km: 9_813, tags: ['dead', 'comms'], size: 0.00088, brief: 'The first commercial relay, and the inspiration for a number one single.', note: 'Relayed the first live television across the Atlantic, for 20 minutes per pass.' },
	{ id: 'glonass', name: 'A GLONASS satellite', primary: 'Earth', kind: 'orbit', km: 25_510, tags: ['navigation'], size: 0.0074, brief: 'Russia’s answer to GPS, with its own design lineage and ground network.', note: 'Navigation constellations sit far out so a few can see you at once.' },
	{ id: 'gps', name: 'A GPS satellite', primary: 'Earth', kind: 'orbit', km: 26_560, tags: ['navigation'], ring: 'GPS', size: 0.0055, brief: 'An atomic clock in a box, broadcasting the time to anyone who listens.', note: 'Twice a day round the Earth, 20,200 km up.' },
	{ id: 'molniya', name: 'A Molniya satellite', primary: 'Earth', kind: 'orbit', km: 26_600, tags: ['comms'], size: 0.0042, brief: 'Named for the lightning-bolt path it flies to keep Siberia in view.', note: 'A deliberately lopsided orbit that loiters over high latitudes.' },
	{ id: 'beidou', name: 'A BeiDou satellite', primary: 'Earth', kind: 'orbit', km: 27_878, tags: ['navigation'], size: 0.009, brief: 'China’s navigation system, built out in three generations.', note: 'China’s navigation constellation, a little higher than GPS.' },
	{ id: 'galileo', name: 'A Galileo satellite', primary: 'Earth', kind: 'orbit', km: 29_600, tags: ['navigation'], size: 0.0027, brief: 'Europe’s navigation system, and the only major one under civilian control.', note: 'Europe’s navigation constellation, higher again.' },
	{ id: 'geo', name: 'A TV broadcast satellite', primary: 'Earth', kind: 'orbit', km: 42_164, tags: ['comms'], ring: 'geostationary', size: 0.007, brief: 'Parks over one spot on the equator, so the dish can be bolted down.', note: 'Geostationary: one orbit per day, so the dish never has to move.' },
	{ id: 'chandra', name: 'Chandra X-ray Observatory', primary: 'Earth', kind: 'orbit', km: 80_770, tags: ['observatory'], size: 0.0138, brief: 'X-ray eyes: it sees the gas falling into black holes, not starlight.', note: 'Flung far out to spend most of its time above the radiation belts.' },
	{ id: 'moon', name: 'The Moon', primary: 'Earth', kind: 'orbit', km: 384_400, tags: ['moon'], ring: 'the Moon', size: 3475, brief: 'Tidally locked, so the same face is always turned towards us.', note: 'The reference everyone actually has a feel for.' },

	// --- Things orbiting other moons and planets ---
	{ id: 'lro', name: 'Lunar Reconnaissance Orbiter', primary: 'the Moon', kind: 'orbit', km: 1_787, tags: ['probe'], size: 0.0039, brief: 'Mapped the lunar surface metre by metre, Apollo landing sites included.', note: 'Fifty km above the lunar surface. The closest orbit in the catalogue.' },
	{ id: 'mro', name: 'Mars Reconnaissance Orbiter', primary: 'Mars', kind: 'orbit', km: 3_696, tags: ['probe'], size: 0.0137, brief: 'A camera sharp enough to pick out rover tracks from orbit.', note: 'Mars is small, so a 300 km orbit is a small radius too.' },
	{ id: 'phobos', name: 'Phobos', primary: 'Mars', kind: 'orbit', km: 9_376, tags: ['moon'], size: 22.5, brief: 'A dark, cratered lump that may be an asteroid Mars caught.', note: 'So close it rises twice a day and is slowly falling in.' },
	{ id: 'charon', name: 'Charon', primary: 'Pluto', kind: 'orbit', km: 19_591, tags: ['moon'], size: 1212, brief: 'Half as wide as Pluto, split by a canyon system far deeper than ours.', note: 'Big enough, close enough, that the pair orbit each other.' },
	{ id: 'deimos', name: 'Deimos', primary: 'Mars', kind: 'orbit', km: 23_463, tags: ['moon'], size: 12.4, brief: 'Smoothed over with dust, and the smaller of the two Martian moons.', note: 'The small outer one, barely more than a captured rock.' },
	{ id: 'proteus', name: 'Proteus', primary: 'Neptune', kind: 'orbit', km: 117_647, tags: ['moon'], size: 420, brief: 'Dark as soot and shaped like a slightly squashed box.', note: 'About as big as a body can be and still not be round.' },
	{ id: 'miranda', name: 'Miranda', primary: 'Uranus', kind: 'orbit', km: 129_900, tags: ['moon'], size: 472, brief: 'A patchwork of terrains that looks assembled rather than formed.', note: 'Cliffs twenty km high on a moon 470 km across.' },
	{ id: 'amalthea', name: 'Amalthea', primary: 'Jupiter', kind: 'orbit', km: 181_400, tags: ['moon'], size: 167, brief: 'Redder than Mars, and porous enough to be a loose pile of rubble.', note: 'Red, lumpy, and inside Io’s orbit.' },
	{ id: 'mimas', name: 'Mimas', primary: 'Saturn', kind: 'orbit', km: 185_539, tags: ['moon'], size: 396, brief: 'One enormous crater, Herschel, spans a third of its face.', note: 'The one with the crater that makes it look like a battle station.' },
	{ id: 'ariel', name: 'Ariel', primary: 'Uranus', kind: 'orbit', km: 190_900, tags: ['moon'], size: 1158, brief: 'The brightest Uranian moon, with valleys flooded by old ice flows.', note: 'The brightest of the Uranian moons.' },
	{ id: 'enceladus', name: 'Enceladus', primary: 'Saturn', kind: 'orbit', km: 237_948, tags: ['moon'], size: 504, brief: 'Geysers at its south pole feed one of Saturn’s rings.', note: 'Venting water from the south pole, which is why anyone cares.' },
	{ id: 'umbriel', name: 'Umbriel', primary: 'Uranus', kind: 'orbit', km: 266_000, tags: ['moon'], size: 1169, brief: 'The darkest Uranian moon, marked by one bright ring of frost.', note: 'The dark one, for reasons nobody has settled.' },
	{ id: 'tethys', name: 'Tethys', primary: 'Saturn', kind: 'orbit', km: 294_619, tags: ['moon'], size: 1062, brief: 'A canyon called Ithaca Chasma runs most of the way around it.', note: 'Ice, and a canyon that runs most of the way round it.' },
	{ id: 'triton', name: 'Triton', primary: 'Neptune', kind: 'orbit', km: 354_759, tags: ['moon'], size: 2707, brief: 'Nitrogen geysers over a surface wrinkled like cantaloupe skin.', note: 'Orbits backwards, so it was almost certainly captured.' },
	{ id: 'dione', name: 'Dione', primary: 'Saturn', kind: 'orbit', km: 377_396, tags: ['moon'], size: 1123, brief: 'Wispy fracture cliffs across one hemisphere, and two Trojan moons of its own.', note: 'Almost exactly the Moon’s distance, around a much heavier planet.' },
	{ id: 'io', name: 'Io', primary: 'Jupiter', kind: 'orbit', km: 421_700, tags: ['moon'], size: 3643, brief: 'Hundreds of active volcanoes, repaving the whole surface continuously.', note: 'Closest of the four Galileans, and the most volcanic place known.' },
	{ id: 'titania', name: 'Titania', primary: 'Uranus', kind: 'orbit', km: 435_910, tags: ['moon'], size: 1578, brief: 'The largest Uranian moon, scarred by an enormous rift valley.', note: 'Largest Uranian moon, and still smaller than our own.' },
	{ id: 'rhea', name: 'Rhea', primary: 'Saturn', kind: 'orbit', km: 527_108, tags: ['moon'], size: 1527, brief: 'Saturn’s second largest: cratered ice, and very little else.', note: 'Saturn’s second largest, and mostly ice.' },
	{ id: 'oberon', name: 'Oberon', primary: 'Uranus', kind: 'orbit', km: 583_520, tags: ['moon'], size: 1523, brief: 'Ancient and cratered, the outermost of the big Uranian moons.', note: 'Outermost of the big Uranian moons.' },
	{ id: 'europa', name: 'Europa', primary: 'Jupiter', kind: 'orbit', km: 671_034, tags: ['moon'], size: 3122, brief: 'A smooth ice shell cracked with rust-coloured lines, over a salty ocean.', note: 'Ice shell, ocean underneath, the obvious place to look.' },
	{ id: 'ganymede', name: 'Ganymede', primary: 'Jupiter', kind: 'orbit', km: 1_070_412, tags: ['moon'], size: 5268, brief: 'The largest moon in the solar system, and wider than Mercury.', note: 'Bigger than Mercury, and the only moon with its own magnetic field.' },
	{ id: 'titan', name: 'Titan', primary: 'Saturn', kind: 'orbit', km: 1_221_870, tags: ['moon'], ring: 'Titan', size: 5150, brief: 'Rain, rivers and seas of methane under an orange nitrogen haze.', note: 'Thick atmosphere, methane lakes, rain.' },
	{ id: 'hyperion', name: 'Hyperion', primary: 'Saturn', kind: 'orbit', km: 1_481_009, tags: ['moon', 'oddity'], size: 270, brief: 'Spongelike and porous, and it tumbles rather than spins.', note: 'Tumbles chaotically: its orientation is genuinely unpredictable.' },
	{ id: 'callisto', name: 'Callisto', primary: 'Jupiter', kind: 'orbit', km: 1_882_709, tags: ['moon'], size: 4821, brief: 'The most heavily cratered surface anyone has found.', note: 'Outermost Galilean, far enough out to sit clear of the worst radiation.' },
	{ id: 'iapetus', name: 'Iapetus', primary: 'Saturn', kind: 'orbit', km: 3_560_820, tags: ['moon'], size: 1469, brief: 'Two-toned, with a ridge of mountains running along its equator.', note: 'One hemisphere bright, the other nearly black.' },
	{ id: 'juno', name: 'The Juno probe', primary: 'Jupiter', kind: 'orbit', km: 4_100_000, tags: ['probe'], size: 0.02, brief: 'Solar powered out at Jupiter, with its electronics in a titanium vault.', note: 'A long loop that dives close, then retreats back out of the radiation.' },
	{ id: 'nereid', name: 'Nereid', primary: 'Neptune', kind: 'orbit', km: 5_513_400, tags: ['moon', 'oddity'], size: 340, brief: 'Almost certainly captured, on one of the least circular paths known.', note: 'One of the most lopsided orbits of any moon in the solar system.' },

	// --- Inner solar system: Mercury out to the asteroid belt ---
	{ id: 'parker', name: 'Parker Solar Probe', primary: 'the Sun', kind: 'orbit', km: 0.39 * AU, tags: ['probe'], size: 0.003, brief: 'Hides behind a carbon heat shield to fly through the Sun’s corona.', note: 'Dips to 0.046 AU at perihelion, closer than anything else has flown.' },
	{ id: 'mercury', name: 'Mercury', primary: 'the Sun', kind: 'orbit', km: 0.387 * AU, tags: ['planet'], size: 4879, brief: 'A cratered, airless world with ice hiding in its polar shadows.', note: '0.39 AU. A year there is 88 days.' },
	{ id: 'venus', name: 'Venus', primary: 'the Sun', kind: 'orbit', km: 0.723 * AU, tags: ['planet'], size: 12104, brief: 'A runaway greenhouse under permanent sulphuric acid clouds.', note: '0.72 AU, and the hottest surface in the solar system.' },
	{ id: 'solarorbiter', name: 'Solar Orbiter', primary: 'the Sun', kind: 'orbit', km: 0.81 * AU, tags: ['probe'], size: 0.018, brief: 'Climbs out of the ecliptic to photograph the Sun’s poles.', note: 'Tilted out of the ecliptic to photograph the Sun’s poles.' },
	{ id: 'apophis', name: 'Apophis', primary: 'the Sun', kind: 'orbit', km: 0.922 * AU, tags: ['asteroid'], size: 0.34, brief: 'The asteroid that briefly looked like it might hit us.', note: 'Passes inside the geostationary ring in 2029, and misses.' },
	{ id: 'earth', name: 'Earth', primary: 'the Sun', kind: 'orbit', km: AU, tags: ['planet'], ring: 'Earth', size: 12742, brief: 'The only known planet with oceans of liquid water, and with us on it.', note: 'One astronomical unit, by definition.' },
	{ id: 'jwst', name: 'The James Webb telescope', primary: 'the Sun', kind: 'orbit', km: 1.01 * AU, tags: ['observatory'], size: 0.0211, brief: 'A gold-coated segmented mirror shaded by a five-layer sunshield.', note: 'Orbits the Sun, holding station 1.5 million km outside Earth at L2.' },
	{ id: 'bennu', name: 'Bennu', primary: 'the Sun', kind: 'orbit', km: 1.126 * AU, tags: ['asteroid'], size: 0.49, brief: 'A rubble pile so loosely held that the sampling arm sank into it.', note: 'A loose pile of rubble that OSIRIS-REx grabbed a sample of.' },
	{ id: 'roadster', name: 'Elon Musk’s Roadster', primary: 'the Sun', kind: 'orbit', km: 1.325 * AU, tags: ['oddity'], size: 0.0045, brief: 'A cherry red sports car with a dummy called Starman at the wheel.', note: 'An Earth-crossing orbit that reaches past Mars.' },
	{ id: 'eros', name: 'Eros', primary: 'the Sun', kind: 'orbit', km: 1.458 * AU, tags: ['asteroid'], size: 16.8, brief: 'A peanut-shaped asteroid that NEAR Shoemaker settled onto at the end.', note: 'The first asteroid anything ever landed on.' },
	{ id: 'mars', name: 'Mars', primary: 'the Sun', kind: 'orbit', km: 1.524 * AU, tags: ['planet'], ring: 'Mars', size: 6779, brief: 'Rust red, with the largest volcano and the deepest canyon anywhere.', note: '1.52 AU, which is why a signal takes minutes each way.' },
	{ id: 'encke', name: 'Comet Encke', primary: 'the Sun', kind: 'orbit', km: 2.22 * AU, tags: ['comet'], size: 4.8, brief: 'A faint, dusty comet tied to the Taurid meteor showers.', note: 'A 3.3 year period: the shortest of any known comet.' },
	{ id: 'vesta', name: 'Vesta', primary: 'the Sun', kind: 'orbit', km: 2.36 * AU, tags: ['asteroid'], size: 525, brief: 'Layered like a planet, with a crust, a mantle and an iron core.', note: 'Second heaviest thing in the asteroid belt.' },
	{ id: 'ceres', name: 'Ceres', primary: 'the Sun', kind: 'orbit', km: 2.77 * AU, tags: ['dwarf'], size: 939, brief: 'Bright salt deposits in its craters, and the largest body in the belt.', note: 'Middle of the belt, and the only dwarf planet inside Neptune.' },
	{ id: 'pallas', name: 'Pallas', primary: 'the Sun', kind: 'orbit', km: 2.77 * AU, tags: ['asteroid'], size: 512, brief: 'Tilted steeply out of the plane everything else moves in.', note: 'Belt neighbour of Ceres on a steeply tilted orbit.' },
	{ id: 'psyche', name: 'Psyche', primary: 'the Sun', kind: 'orbit', km: 2.92 * AU, tags: ['asteroid'], size: 222, brief: 'Metal rich, and possibly the exposed core of a world that was smashed.', note: 'Metal-rich, which is why a mission is on the way to it.' },
	{ id: 'tempel1', name: 'Comet Tempel 1', primary: 'the Sun', kind: 'orbit', km: 3.14 * AU, tags: ['comet'], size: 6, brief: 'Deep Impact fired a copper slug into it to see what was underneath.', note: 'The one Deep Impact shot a copper slug into.' },
	{ id: 'churyumov', name: 'Comet 67P', primary: 'the Sun', kind: 'orbit', km: 3.46 * AU, tags: ['comet'], size: 4.1, brief: 'Two lobes joined by a neck, with the Philae lander somewhere on it.', note: 'Rosetta’s comet, the rubber duck.' },

	// --- Outer solar system: Jupiter out through the Kuiper belt ---
	{ id: 'achilles', name: 'Achilles', primary: 'the Sun', kind: 'orbit', km: 5.19 * AU, tags: ['trojan'], size: 135, brief: 'The first Trojan ever found, which is why the group is named for the Iliad.', note: 'A Jupiter Trojan: it shares Jupiter’s orbit, 60 degrees ahead.' },
	{ id: 'patroclus', name: 'Patroclus', primary: 'the Sun', kind: 'orbit', km: 5.22 * AU, tags: ['trojan'], size: 127, brief: 'A pair of Trojans the same size, orbiting each other as they go.', note: 'Two Trojans the same size orbiting each other, trailing Jupiter.' },
	{ id: 'eurybates', name: 'Eurybates', primary: 'the Sun', kind: 'orbit', km: 5.2 * AU, tags: ['trojan'], size: 64, brief: 'A Lucy mission target, and the leftover of a Trojan that broke apart.', note: 'A Lucy mission target, and the leftover of a Trojan that broke up.' },
	{ id: 'jupiter', name: 'Jupiter', primary: 'the Sun', kind: 'orbit', km: 5.204 * AU, tags: ['planet'], ring: 'Jupiter', size: 139820, brief: 'A gas giant with a storm wider than Earth and ninety-odd moons.', note: '5.2 AU, and more mass than everything else in orbit combined.' },
	{ id: 'saturn', name: 'Saturn', primary: 'the Sun', kind: 'orbit', km: 9.583 * AU, tags: ['planet'], size: 116460, brief: 'Rings of ice and rubble, bright enough to see in a cheap telescope.', note: '9.6 AU. Cassini needed seven years to get there.' },
	{ id: 'chiron', name: 'Chiron', primary: 'the Sun', kind: 'orbit', km: 13.7 * AU, tags: ['centaur'], size: 210, brief: 'Half asteroid and half comet, and it may carry rings.', note: 'Classed as an asteroid until it grew a coma.' },
	{ id: 'chariklo', name: 'Chariklo', primary: 'the Sun', kind: 'orbit', km: 15.8 * AU, tags: ['centaur'], size: 250, brief: 'The first small body anyone found with a ring system of its own.', note: 'A 250 km body with its own rings, which nobody expected.' },
	{ id: 'pholus', name: 'Pholus', primary: 'the Sun', kind: 'orbit', km: 20.4 * AU, tags: ['centaur'], size: 99, brief: 'One of the reddest objects known, and nobody has settled why.', note: 'One of the reddest things in the solar system, and nobody is sure why.' },
	{ id: 'halley', name: 'Halley’s Comet', primary: 'the Sun', kind: 'orbit', km: 17.8 * AU, tags: ['comet'], size: 11, brief: 'Watched for millennia, and the first comet understood to come back.', note: 'Averages out past Uranus, which is the 76 year wait.' },
	{ id: 'uranus', name: 'Uranus', primary: 'the Sun', kind: 'orbit', km: 19.19 * AU, tags: ['planet'], size: 50724, brief: 'An ice giant knocked onto its side, with faint rings and a bland face.', note: '19 AU, tipped on its side.' },
	{ id: 'neptune', name: 'Neptune', primary: 'the Sun', kind: 'orbit', km: 30.07 * AU, tags: ['planet'], ring: 'Neptune', size: 49244, brief: 'Supersonic winds under a deep blue haze of methane.', note: '30 AU, found by arithmetic before anyone looked.' },
	{ id: 'orcus', name: 'Orcus', primary: 'the Sun', kind: 'orbit', km: 39.4 * AU, tags: ['kbo'], size: 910, brief: 'Sometimes called the anti-Pluto, with a moon named Vanth.', note: 'Locked to Neptune the same way Pluto is, half an orbit out of step.' },
	{ id: 'pluto', name: 'Pluto', primary: 'the Sun', kind: 'orbit', km: 39.48 * AU, tags: ['dwarf'], size: 2377, brief: 'Nitrogen glaciers, a heart-shaped plain, and five moons.', note: '39 AU average, though it does cut inside Neptune.' },
	{ id: 'haumea', name: 'Haumea', primary: 'the Sun', kind: 'orbit', km: 43.1 * AU, tags: ['dwarf'], size: 1560, brief: 'Spun into the shape of an egg, and it has a ring.', note: 'Spun so fast it is shaped like a flattened egg.' },
	{ id: 'quaoar', name: 'Quaoar', primary: 'the Sun', kind: 'orbit', km: 43.7 * AU, tags: ['kbo'], size: 1110, brief: 'Carries a ring that theory says should not be able to survive there.', note: 'Kuiper belt, and it has a ring that should not be stable.' },
	{ id: 'varuna', name: 'Varuna', primary: 'the Sun', kind: 'orbit', km: 42.9 * AU, tags: ['kbo'], size: 678, brief: 'Rotates so quickly that it is visibly out of round.', note: 'Spins in under seven hours, which has stretched it out of round.' },
	{ id: 'arrokoth', name: 'Arrokoth', primary: 'the Sun', kind: 'orbit', km: 44.6 * AU, tags: ['kbo'], size: 36, brief: 'Two flattened lobes gently stuck together, the colour of brick.', note: 'Two lobes stuck together. The furthest thing ever photographed close up.' },
	{ id: 'makemake', name: 'Makemake', primary: 'the Sun', kind: 'orbit', km: 45.4 * AU, tags: ['dwarf'], size: 1430, brief: 'Bright methane frost, and one small dark moon.', note: 'Bright, cold, and out past the main Kuiper belt.' },

	// --- Deep space: past Eris, and the things on their way out ---
	{ id: 'eris', name: 'Eris', primary: 'the Sun', kind: 'orbit', km: 67.8 * AU, tags: ['dwarf'], ring: 'Eris', size: 2326, brief: 'Massive enough to force the argument about what counts as a planet.', note: 'Heavier than Pluto, and the reason Pluto got reclassified.' },
	{ id: 'gonggong', name: 'Gonggong', primary: 'the Sun', kind: 'orbit', km: 67.3 * AU, tags: ['dwarf'], size: 1230, brief: 'Red, slowly turning, and accompanied by a moon called Xiangliu.', note: 'Red, slow, and one of the largest things out there.' },
	{ id: 'farfarout', name: 'Farfarout', primary: 'the Sun', kind: 'orbit', km: 132 * AU, tags: ['kbo'], size: 400, brief: 'A faint pink dot, confirmed only after years of patient watching.', note: 'The most distant object ever confirmed in orbit around the Sun.' },
	{ id: 'halebopp', name: 'Comet Hale-Bopp', primary: 'the Sun', kind: 'orbit', km: 186 * AU, tags: ['comet'], size: 60, brief: 'The great comet of 1997, naked-eye visible for a season and a half.', note: 'Visible to the naked eye for 18 months, back in 1997.' },
	{ id: 'sedna', name: 'Sedna', primary: 'the Sun', kind: 'orbit', km: 506 * AU, tags: ['kbo'], ring: 'Sedna', size: 1000, brief: 'Deep red, and possibly nudged by something large nobody has found.', note: 'Takes over eleven thousand years to go round once.' },
	{ id: 'newhorizons', name: 'New Horizons', primary: 'the Sun', kind: 'distance', km: 63 * AU, tags: ['probe'], size: 0.0021, brief: 'Flew past Pluto, then on to Arrokoth, and is still reporting in.', note: 'Past Pluto, still transmitting, on its way out of the system.' },
	{ id: 'pioneer11', name: 'Pioneer 11', primary: 'the Sun', kind: 'distance', km: 125 * AU, tags: ['probe', 'dead'], size: 0.0027, brief: 'Carried a plaque, flew past Saturn, and then fell silent.', note: 'Silent since 1995, heading for Aquila.' },
	{ id: 'voyager2', name: 'Voyager 2', primary: 'the Sun', kind: 'distance', km: 139 * AU, tags: ['probe'], size: 0.0037, brief: 'The only spacecraft ever to have visited Uranus and Neptune.', note: 'Left the heliosphere in 2018. The only probe to visit Uranus and Neptune.' },
	{ id: 'pioneer10', name: 'Pioneer 10', primary: 'the Sun', kind: 'distance', km: 140 * AU, tags: ['probe', 'dead'], size: 0.0027, brief: 'First through the asteroid belt, and first past Jupiter.', note: 'Silent since 2003, still coasting outward.' },
	{ id: 'voyager1', name: 'Voyager 1', primary: 'the Sun', kind: 'distance', km: 167 * AU, tags: ['probe'], size: 0.0037, brief: 'Carries the Golden Record, and is now in interstellar space.', note: 'The furthest human object. Roughly a day of light travel away.' },
]
