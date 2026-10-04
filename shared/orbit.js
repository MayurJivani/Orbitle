/**
 * Every rule of the game, with no DOM and no dates of its own. The page draws
 * what this module says and nothing else, which is also what makes it testable.
 */

export const AU = 149_597_870

/**
 * Standard gravitational parameters, km^3/s^2, for every body anything in the
 * catalogue orbits. Nine numbers instead of two more columns on ninety entries:
 * with the semi-major axis and its primary's mu, the orbital period and the
 * mean speed are Kepler's third law and a square root, so they are derived
 * rather than curated and cannot drift out of agreement with the distance.
 */
export const MU = {
	'the Sun': 1.327_124_4e11,
	Earth: 398_600.44,
	'the Moon': 4_902.8,
	Mars: 42_828,
	Jupiter: 1.266_865e8,
	Saturn: 3.793_12e7,
	Uranus: 5.793_94e6,
	Neptune: 6.836_53e6,
	Pluto: 975.5,
}

/** Orbital period in seconds, from Kepler's third law. */
export function periodSeconds(o) {
	const mu = MU[o.primary]
	if (!mu || o.kind !== 'orbit') return null
	return 2 * Math.PI * Math.sqrt(o.km ** 3 / mu)
}

/**
 * Mean orbital speed in km/s.
 *
 * ponytail: sqrt(mu/a) is the circular-orbit speed, so an eccentric orbit's
 * true mean is a couple of percent lower (it goes as 1 - e^2/4). Halley and
 * Molniya are the worst cases here. The ceiling is that the catalogue stores no
 * eccentricity; the upgrade is to add `e` to the handful of eccentric entries
 * and use the series. On a log dial a 2% error is a fraction of a pixel, which
 * is why this is not worth a column yet.
 */
export function speedKms(o) {
	const mu = MU[o.primary]
	if (!mu || o.kind !== 'orbit') return null
	return Math.sqrt(mu / o.km)
}

/**
 * Five frames, by distance from whatever the thing orbits. One scale from a low
 * lunar orbit to Voyager 1 is seven and a half factors of ten, which makes the
 * whole inner half an unreadable smudge; each of these is one or two.
 *
 * They are distance bands rather than bodies (no "Jupiter system") on purpose:
 * a round on Io then still gets read against Earth's own landmarks, and
 * learning that Io orbits Jupiter a little further out than our Moon is the
 * kind of answer worth keeping.
 *
 * The bands do not overlap anywhere the catalogue sits, so an entry's frame
 * comes from its distance alone and no entry carries a hint that could drift.
 */
export const FRAMES = [
	{
		id: 'near-earth',
		name: 'Near Earth',
		span: 'surface to just past geostationary',
		minKm: 1_500,
		// Shares its boundary with the band above rather than overlapping it, so
		// every distance belongs to exactly one frame.
		maxKm: 95_000,
		// Only the distance question can use a ring that is not an orbit.
		surface: { km: 6_371, label: 'Earth’s surface' },
	},
	{
		id: 'earth-system',
		name: 'Earth system',
		span: 'geostationary to past the Moon',
		minKm: 95_000,
		maxKm: 6_000_000,
	},
	{
		id: 'inner-solar',
		name: 'Inner solar system',
		span: 'Mercury to the asteroid belt',
		minKm: 0.2 * AU,
		maxKm: 4.5 * AU,
	},
	{
		id: 'outer-solar',
		name: 'Outer solar system',
		span: 'Jupiter to the Kuiper belt',
		minKm: 4.5 * AU,
		maxKm: 55 * AU,
	},
	{
		id: 'deep',
		name: 'Deep space',
		span: 'past Eris, out to Sedna',
		minKm: 55 * AU,
		maxKm: 600 * AU,
	},
]

/** Which frame a distance belongs to: the first band that contains it. */
export function frameFor(km) {
	return FRAMES.find((f) => km > f.minKm && km < f.maxKm)
}

export function formatDuration(seconds) {
	const hours = seconds / 3_600
	if (hours < 48) return `${hours < 10 ? hours.toFixed(1) : Math.round(hours)} hours`
	const days = hours / 24
	// Cut over at a year rather than later: "365 days" is a worse answer than
	// "1.0 years" for the one orbit every player already knows the length of.
	if (days < 365) return `${days < 10 ? days.toFixed(1) : Math.round(days)} days`
	const years = days / 365.25
	return `${years < 10 ? years.toFixed(1) : Math.round(years).toLocaleString('en-US')} years`
}

/**
 * Distance in the unit a human would actually say it in: kilometres close in,
 * millions of km out to Earth's own orbit, AU past that. Nobody's mental model
 * holds "0.067 AU", and everybody's holds "10 million km".
 */
export function formatKm(km) {
	if (km < 1_000_000) return `${Math.round(km).toLocaleString('en-US')} km`
	if (km < AU) {
		const m = km / 1e6
		return `${m < 10 ? m.toFixed(1) : Math.round(m)} million km`
	}
	const au = km / AU
	return `${au < 10 ? au.toFixed(1) : Math.round(au).toLocaleString('en-US')} AU`
}

export function formatSpeed(kms) {
	return `${kms < 10 ? kms.toFixed(2) : Math.round(kms)} km/s`
}

/**
 * Three questions, all asked the same way: place a marker on a log dial. One
 * mechanic, so the dial, the scoring, the keyboard and the zoom are written
 * once; what changes is the quantity under the marker.
 */
export const QUESTIONS = [
	{
		id: 'distance',
		name: 'How far out',
		ask: (o) => `How far out does ${o.name.replace(/^(The|A|An) /, (m) => m.toLowerCase())} orbit?`,
		label: 'distance',
		under: 'too close in',
		over: 'too far out',
		valueOf: (o) => o.km,
		format: formatKm,
	},
	{
		id: 'period',
		name: 'How long',
		ask: () => 'How long does one orbit take?',
		label: 'one orbit',
		under: 'too quick',
		over: 'too slow',
		valueOf: periodSeconds,
		format: formatDuration,
	},
	{
		id: 'speed',
		name: 'How fast',
		ask: () => 'How fast is it moving along that orbit?',
		label: 'mean speed',
		under: 'too slow',
		over: 'too fast',
		valueOf: speedKms,
		format: formatSpeed,
	},
]

export const ROUNDS_PER_DAY = 5

/**
 * Three difficulty modes, over the three levers the dial already has: how
 * sharply a miss is punished, whether the landmark rings are there to read
 * against, and how much of the sky the dial covers.
 *
 * Hard is the interesting one. Its dial is the question's whole range rather
 * than the round's frame, so nothing tells you whether the answer is a
 * satellite or a Kuiper belt object before you place it, and the frame is not
 * highlighted either. That is eight factors of ten on one dial, which is only
 * playable because zoom exists.
 */
export const MODES = [
	{ id: 'easy', name: 'Easy', curve: 0.6, landmarks: true, wholeRange: false,
		blurb: 'landmarks shown, gentle marking' },
	{ id: 'medium', name: 'Medium', curve: 1, landmarks: true, wholeRange: false,
		blurb: 'landmarks shown, a point per 1%' },
	{ id: 'hard', name: 'Hard', curve: 1.6, landmarks: false, wholeRange: true,
		blurb: 'no landmarks, no frame, the whole sky' },
]

export const DEFAULT_MODE = MODES[1]

export function modeById(id) {
	return MODES.find((m) => m.id === id) ?? DEFAULT_MODE
}

/** Can this object be asked this question? Escape trajectories have no period. */
export function supports(question, o) {
	return Number.isFinite(question.valueOf(o))
}

/**
 * The dial for one question, derived from the entries on it rather than
 * hand-tuned fifteen times over. Padded by a factor of 1.8 at both ends,
 * because an answer sitting on a stop is a free guess: the stop is the one ring
 * a player can find without knowing anything.
 *
 * A null frame means the question's whole range, which is what Hard plays on.
 */
const PAD = 1.8

export function dialFor(question, frame, objects) {
	const values = objects
		.filter((o) => (frame === null || frameFor(o.km) === frame) && supports(question, o))
		.map((o) => question.valueOf(o))
	if (!values.length) return null
	return {
		id: `${question.id}:${frame ? frame.id : 'all'}`,
		min: Math.min(...values) / PAD,
		max: Math.max(...values) * PAD,
	}
}

const logSpan = (dial) => Math.log10(dial.max) - Math.log10(dial.min)

/** How many factors of ten a dial spans. One keyboard step is a fraction of it. */
export function decadesOf(dial) {
	return logSpan(dial)
}

/** Value -> 0..1 along the dial. Log, or the inner rings vanish. */
export function toT(value, dial) {
	const clamped = Math.min(Math.max(value, dial.min), dial.max)
	return (Math.log10(clamped) - Math.log10(dial.min)) / logSpan(dial)
}

/** 0..1 along the dial -> value. The inverse of toT. */
export function fromT(t, dial) {
	const clamped = Math.min(Math.max(t, 0), 1)
	return 10 ** (Math.log10(dial.min) + clamped * logSpan(dial))
}

/**
 * Score one guess on the share of the dial it missed by. Medium is a point per
 * 1%; the other modes bend that line with an exponent.
 *
 * A share of the dial rather than a flat penalty per factor of ten, so five
 * rounds on different dials add up to one comparable total: a decade is most of
 * a two-decade dial and a third of a wide one, and it should cost accordingly.
 *
 * The exponent rather than a gentler slope, because a slope that forgives has
 * to stop short of zero: at 70 points per full dial, the worst answer possible
 * still scored 30 and an Easy total could not drop below 150. A curve keeps
 * both ends honest, exact is 100 and a full miss is 0 in every mode, and puts
 * the difficulty where it belongs, in the middle of the range.
 *
 * Always measured on the whole dial, never on a zoomed window, or zooming in
 * would quietly change the marking.
 */
export function score(guess, actual, dial, mode = DEFAULT_MODE) {
	const missed = Math.min(Math.abs(toT(guess, dial) - toT(actual, dial)), 1)
	return Math.round(100 * (1 - missed) ** mode.curve)
}

/** How far out the guess was, as a plain multiple ("2.4x too close"). */
export function ratio(guess, actual) {
	return guess >= actual ? guess / actual : actual / guess
}

/** That multiple, said out loud. Never in exponent notation: this is a game. */
export function formatRatio(r) {
	if (r < 10) return `${r.toFixed(1)}x`
	if (r < 10_000) return `${Math.round(r).toLocaleString('en-US')}x`
	return `${Math.round(r / 1000).toLocaleString('en-US')},000x`
}

/**
 * Ring values across a visible window, chosen so there is always something to
 * orient by. Two regimes, because one does not cover both:
 *
 * - A window a factor of five or more wide gets 1-2-5 steps per decade, which
 *   spread evenly on a log axis. Linear steps here would pile every ring into
 *   the outer edge.
 * - A narrower window (zoomed in, or one of the speed dials, which are half a
 *   decade wide because speed goes as one over the root of the distance) gets
 *   nice linear steps, the way a map scale bar does it. 1-2-5 on a window from
 *   12 to 19 AU leaves exactly one ring, which is no help at all.
 */
export function ringValues(from, to) {
	const out = []
	if (Math.log10(to / from) >= 0.7) {
		for (let e = Math.floor(Math.log10(from)); e <= Math.ceil(Math.log10(to)); e++) {
			for (const m of [1, 2, 5]) {
				const v = m * 10 ** e
				if (v >= from && v <= to) out.push(v)
			}
		}
		return out
	}

	const raw = (to - from) / 5
	const mag = 10 ** Math.floor(Math.log10(raw))
	const step = [1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) * mag
	for (let v = Math.ceil(from / step) * step; v <= to; v += step) out.push(v)
	return out
}

/**
 * The landmark rings for a round: catalogue entries that double as rings, their
 * value taken for the question being asked, so a period dial gets the ISS at
 * 1.5 hours without a number being typed twice.
 *
 * The round's own object is excluded. A ring labelled "Neptune" on a round
 * asking where Neptune orbits is not a landmark, it is the answer with a label
 * on it, and it was handing out free hundreds.
 */
export function landmarkRings(question, frame, objects, exclude) {
	const rings = objects
		.filter((o) => o.ring && o.id !== exclude && frameFor(o.km) === frame && supports(question, o))
		.map((o) => ({ label: o.ring, value: question.valueOf(o) }))

	// Earth's surface is a ring and not an orbit, so only one question can use it.
	if (frame?.surface && question.id === 'distance') {
		rings.push({ label: frame.surface.label, value: frame.surface.km })
	}
	return rings
}

/**
 * The visible window of a dial. Zooming narrows it around a point rather than
 * magnifying the drawing: on a diagram of concentric rings, scaling about the
 * centre only ever helps the innermost ring, and panning off-centre throws the
 * hub out of frame. Narrowing the range spreads the rings the player is
 * actually working between, which is the whole point of zooming in.
 */
export const ZOOMS = [1, 2, 4, 8]

export function windowFor(dial, zoom, around) {
	const width = 1 / zoom
	const from = Math.min(Math.max(around - width / 2, 0), 1 - width)
	return { from, to: from + width, zoom }
}

/** Window-relative 0..1 -> whole-dial 0..1, and back. */
export const toWindow = (t, w) => (t - w.from) / (w.to - w.from)
export const fromWindow = (tw, w) => w.from + tw * (w.to - w.from)

/** The UTC day a puzzle belongs to. UTC so a shared score means the same puzzle. */
export function dayKey(date = new Date()) {
	return date.toISOString().slice(0, 10)
}

/** The day number, counting from launch. Only used to label the puzzle. */
export function dayNumber(key) {
	const epoch = Date.UTC(2026, 0, 1)
	return Math.floor((Date.parse(`${key}T00:00:00Z`) - epoch) / 86_400_000) + 1
}

/**
 * A seeded PRNG, so a given day deals the same hand on every device with no
 * server to ask, and the starfield is in the same place on every build.
 * mulberry32: one line of state, good enough to shuffle and to scatter with.
 */
export function rng(seed) {
	let a = seed >>> 0
	return () => {
		a = (a + 0x6d2b79f5) >>> 0
		let t = a
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
	}
}

function hash(str) {
	let h = 2_166_136_261
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i)
		h = Math.imul(h, 16_777_619)
	}
	return h >>> 0
}

/**
 * The day's hand: ROUNDS_PER_DAY rounds, each an object and the question it is
 * asked. The question cycles from a seeded offset rather than being drawn at
 * random, which guarantees a day mixes question types instead of occasionally
 * dealing five of the same one. The object for each round is the next one in a
 * seeded shuffle that can answer that question, so nothing repeats within a
 * day.
 */
export function dealDaily(objects, key, count = ROUNDS_PER_DAY) {
	const rand = rng(hash(key))
	const pool = objects.slice()
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1))
		;[pool[i], pool[j]] = [pool[j], pool[i]]
	}

	const offset = Math.floor(rand() * QUESTIONS.length)
	const rounds = []
	const used = new Set()
	for (let i = 0; rounds.length < count && i < QUESTIONS.length * count; i++) {
		const question = QUESTIONS[(offset + rounds.length) % QUESTIONS.length]
		const object = pool.find((o) => !used.has(o.id) && supports(question, o))
		if (!object) break
		used.add(object.id)
		rounds.push({ object, question })
	}
	return rounds
}

/**
 * The dial's geometry, in the SVG's own units. It lives here rather than in the
 * stylesheet because the client draws the rings from it and converts pointer
 * positions with it: two readers, one source.
 */
export const DIAL = { cx: 500, cy: 500, inner: 70, outer: 450 }

/** Window-relative 0..1 -> ring radius in SVG units. */
export function pxFromT(tw) {
	return DIAL.inner + Math.min(Math.max(tw, 0), 1) * (DIAL.outer - DIAL.inner)
}

/** Ring radius in SVG units -> window-relative 0..1. The inverse of pxFromT. */
export function tFromPx(px) {
	return (px - DIAL.inner) / (DIAL.outer - DIAL.inner)
}

/** Five buckets, so a run of results reads as a shape rather than a sum. */
export function grade(points) {
	if (points >= 90) return { glyph: '🟢', word: 'dead on' }
	if (points >= 70) return { glyph: '🟡', word: 'close' }
	if (points >= 50) return { glyph: '🟠', word: 'the right region' }
	if (points >= 25) return { glyph: '🔴', word: 'wrong region' }
	return { glyph: '⚫', word: 'wrong by a mile' }
}
