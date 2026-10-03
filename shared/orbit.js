/**
 * Every rule of the game, with no DOM and no dates of its own. The page draws
 * what this module says and nothing else, which is also what makes it testable.
 */

export const AU = 149_597_870

/**
 * The dial runs from 1,000 km (a low lunar orbit) to 200 AU (past Voyager 1).
 * Everything in the catalogue fits inside it with a little room at both ends,
 * because a target pinned against a stop is a free answer.
 */
export const SCALE_MIN_KM = 1_000
export const SCALE_MAX_KM = 200 * AU

/** Penalty per factor-of-ten miss. Ten times out is a 40 point haircut. */
export const PENALTY_PER_DECADE = 40

export const ROUNDS_PER_DAY = 5

const LOG_MIN = Math.log10(SCALE_MIN_KM)
const LOG_MAX = Math.log10(SCALE_MAX_KM)

/** Distance in km -> 0..1 along the dial. Log, or the inner rings vanish. */
export function kmToT(km) {
	const clamped = Math.min(Math.max(km, SCALE_MIN_KM), SCALE_MAX_KM)
	return (Math.log10(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN)
}

/** 0..1 along the dial -> distance in km. The inverse of kmToT. */
export function tToKm(t) {
	const clamped = Math.min(Math.max(t, 0), 1)
	return 10 ** (LOG_MIN + clamped * (LOG_MAX - LOG_MIN))
}

/**
 * Score one guess. 100 for spot on, less by how many factors of ten the guess
 * was out, floored at 0. Decades rather than kilometres because being 400 km
 * out matters enormously for the ISS and not at all for Voyager.
 */
export function score(guessKm, actualKm) {
	const decadesOff = Math.abs(Math.log10(guessKm) - Math.log10(actualKm))
	return Math.max(0, Math.round(100 - PENALTY_PER_DECADE * decadesOff))
}

/** How far out the guess was, as a plain multiple ("2.4x too close"). */
export function ratio(guessKm, actualKm) {
	return guessKm >= actualKm ? guessKm / actualKm : actualKm / guessKm
}

/** That multiple, said out loud. Never in exponent notation: this is a game. */
export function formatRatio(r) {
	if (r < 10) return `${r.toFixed(1)}x`
	if (r < 10_000) return `${Math.round(r).toLocaleString('en-US')}x`
	return `${Math.round(r / 1000).toLocaleString('en-US')},000x`
}

/** The UTC day a puzzle belongs to. UTC so a shared score means the same puzzle. */
export function dayKey(date = new Date()) {
	return date.toISOString().slice(0, 10)
}

/** The day number, counting from launch. Only used to label the puzzle. */
export function dayNumber(key) {
	const epoch = Date.UTC(2026, 0, 1)
	return Math.floor((Date.parse(`${key}T00:00:00Z`) - epoch) / 86_400_000) + 1
}

// A seeded PRNG so a given day deals the same hand on every device, with no
// server to ask. mulberry32: one line of state, good enough to shuffle with.
function mulberry32(seed) {
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
 * The day's hand: ROUNDS_PER_DAY distinct objects, same order everywhere.
 * A partial Fisher-Yates over a copy, so entries cannot repeat within a day.
 */
export function pickDaily(objects, key, count = ROUNDS_PER_DAY) {
	const rand = mulberry32(hash(key))
	const pool = objects.slice()
	const n = Math.min(count, pool.length)
	for (let i = 0; i < n; i++) {
		const j = i + Math.floor(rand() * (pool.length - i))
		;[pool[i], pool[j]] = [pool[j], pool[i]]
	}
	return pool.slice(0, n)
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

/**
 * The dial's geometry, in the SVG's own units. It lives here rather than in the
 * stylesheet because the page server-renders the rings from it and the client
 * converts pointer positions with it: two readers, one source.
 */
export const DIAL = { cx: 500, cy: 500, inner: 70, outer: 450 }

/** How many factors of ten the dial spans. One keyboard step is a fraction of it. */
export const DECADES_ON_DIAL = LOG_MAX - LOG_MIN

/** Distance in km -> ring radius in SVG units. */
export function pxFromKm(km) {
	return DIAL.inner + kmToT(km) * (DIAL.outer - DIAL.inner)
}

/** Ring radius in SVG units -> distance in km. The inverse of pxFromKm. */
export function kmFromPx(px) {
	return tToKm((px - DIAL.inner) / (DIAL.outer - DIAL.inner))
}

/** Every whole factor of ten that fits on the dial, for the faint rings. */
export function decades() {
	const out = []
	for (let e = Math.ceil(LOG_MIN); e <= Math.floor(LOG_MAX); e++) out.push(10 ** e)
	return out
}

/** The ring labels. One per factor of ten, plus the landmarks people know. */
export const ANCHORS = [
	{ km: 6_371, label: 'Earth’s surface', major: true },
	{ km: 42_164, label: 'geostationary', major: true },
	{ km: 384_400, label: 'the Moon', major: true },
	{ km: AU, label: 'Earth’s orbit', major: true },
	{ km: 5.204 * AU, label: 'Jupiter', major: false },
	{ km: 30.07 * AU, label: 'Neptune', major: false },
	{ km: 167 * AU, label: 'Voyager 1', major: false },
]

/** Five buckets, so a run of results reads as a shape rather than a sum. */
export function grade(points) {
	if (points >= 90) return { glyph: '🟢', word: 'dead on' }
	if (points >= 70) return { glyph: '🟡', word: 'close' }
	if (points >= 50) return { glyph: '🟠', word: 'the right region' }
	if (points >= 25) return { glyph: '🔴', word: 'wrong region' }
	return { glyph: '⚫', word: 'wrong by a mile' }
}
