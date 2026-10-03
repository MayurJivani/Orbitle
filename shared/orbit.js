/**
 * Every rule of the game, with no DOM and no dates of its own. The page draws
 * what this module says and nothing else, which is also what makes it testable.
 */

export const AU = 149_597_870

/**
 * Three dials instead of one. A single scale from a low lunar orbit out to
 * Voyager 1 spans seven and a half factors of ten, which makes the whole inner
 * solar system one unreadable smudge near the centre. Each of these spans two
 * or three instead, and a round uses whichever one its answer lives on.
 *
 * The first two are read against Earth on purpose: whatever the round is about,
 * the rings say where that distance would put you in Earth's own
 * neighbourhood. Knowing Phobos orbits Mars somewhere between geostationary and
 * the GPS constellation is the kind of answer worth having.
 *
 * Ranges are a little wider than the entries that land on them at both ends: an
 * answer sitting on a stop would be a free guess, since a stop is the one ring
 * a player can find without knowing anything.
 */
export const SCALES = [
	{
		id: 'near-earth',
		name: 'Near Earth',
		span: 'surface to geostationary',
		minKm: 1_500,
		maxKm: 120_000,
		anchors: [
			{ km: 6_371, label: 'Earth’s surface', major: true },
			{ km: 26_560, label: 'GPS', major: false },
			{ km: 42_164, label: 'geostationary', major: true },
		],
	},
	{
		id: 'earth-system',
		name: 'Earth system',
		span: 'geostationary to past the Moon',
		minKm: 100_000,
		maxKm: 6_000_000,
		anchors: [
			{ km: 384_400, label: 'the Moon', major: true },
			{ km: 1_500_000, label: 'Webb at L2', major: false },
			{ km: 3_844_000, label: 'the Moon ×10', major: false },
		],
	},
	{
		id: 'solar',
		name: 'Solar system',
		span: 'Mercury to Voyager 1',
		minKm: 0.2 * AU,
		maxKm: 250 * AU,
		anchors: [
			{ km: AU, label: 'Earth’s orbit', major: true },
			{ km: 5.204 * AU, label: 'Jupiter', major: false },
			{ km: 30.07 * AU, label: 'Neptune', major: true },
			{ km: 167 * AU, label: 'Voyager 1', major: false },
		],
	},
]

export const ROUNDS_PER_DAY = 5

/**
 * Which dial a distance belongs on: the first one that contains it. The ranges
 * do not overlap anywhere the catalogue actually sits, so this needs no hint
 * stored on the entry and cannot drift away from one.
 */
export function scaleFor(km) {
	return SCALES.find((s) => km > s.minKm && km < s.maxKm)
}

const logSpan = (scale) => Math.log10(scale.maxKm) - Math.log10(scale.minKm)

/** How many factors of ten a dial spans. One keyboard step is a fraction of it. */
export function decadesOf(scale) {
	return logSpan(scale)
}

/** Distance in km -> 0..1 along the dial. Log, or the inner rings vanish. */
export function kmToT(km, scale) {
	const clamped = Math.min(Math.max(km, scale.minKm), scale.maxKm)
	return (Math.log10(clamped) - Math.log10(scale.minKm)) / logSpan(scale)
}

/** 0..1 along the dial -> distance in km. The inverse of kmToT. */
export function tToKm(t, scale) {
	const clamped = Math.min(Math.max(t, 0), 1)
	return 10 ** (Math.log10(scale.minKm) + clamped * logSpan(scale))
}

/**
 * Score one guess: 100, minus a point for every 1% of the dial you missed by,
 * floored at 0. Share of the dial rather than a flat penalty per factor of ten,
 * so the five rounds stay comparable even when they use different dials. A
 * factor of ten is most of the Near Earth dial and a third of the solar one,
 * and it should cost accordingly.
 */
export function score(guessKm, actualKm, scale) {
	const missed = Math.abs(kmToT(guessKm, scale) - kmToT(actualKm, scale))
	return Math.max(0, Math.round(100 - 100 * missed))
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
 * The day's hand: ROUNDS_PER_DAY distinct objects, same order everywhere.
 * A partial Fisher-Yates over a copy, so entries cannot repeat within a day.
 */
export function pickDaily(objects, key, count = ROUNDS_PER_DAY) {
	const rand = rng(hash(key))
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

/** Distance in km -> ring radius in SVG units. */
export function pxFromKm(km, scale) {
	return DIAL.inner + kmToT(km, scale) * (DIAL.outer - DIAL.inner)
}

/** Ring radius in SVG units -> distance in km. The inverse of pxFromKm. */
export function kmFromPx(px, scale) {
	return tToKm((px - DIAL.inner) / (DIAL.outer - DIAL.inner), scale)
}

/** Every whole factor of ten that fits on a dial, for the faint rings. */
export function decades(scale) {
	const out = []
	const from = Math.ceil(Math.log10(scale.minKm))
	const to = Math.floor(Math.log10(scale.maxKm))
	for (let e = from; e <= to; e++) out.push(10 ** e)
	return out
}

/** Five buckets, so a run of results reads as a shape rather than a sum. */
export function grade(points) {
	if (points >= 90) return { glyph: '🟢', word: 'dead on' }
	if (points >= 70) return { glyph: '🟡', word: 'close' }
	if (points >= 50) return { glyph: '🟠', word: 'the right region' }
	if (points >= 25) return { glyph: '🔴', word: 'wrong region' }
	return { glyph: '⚫', word: 'wrong by a mile' }
}
