import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
	AU,
	FRAMES,
	MU,
	QUESTIONS,
	ROUNDS_PER_DAY,
	ZOOMS,
	dayKey,
	dealDaily,
	decadesOf,
	dialFor,
	formatDuration,
	formatKm,
	formatRatio,
	formatSpeed,
	frameFor,
	factsFor,
	formatSize,
	hostOf,
	landmarkRings,
	modeById,
	PRIMARIES,
	MODES,
	fromT,
	fromWindow,
	periodSeconds,
	ratio,
	ringValues,
	score,
	speedKms,
	supports,
	toT,
	toWindow,
	windowFor,
} from '../shared/orbit.js'
import { OBJECTS } from '../shared/objects.js'

const byId = (id) => OBJECTS.find((o) => o.id === id)
const dialsOf = (q) => FRAMES.map((f) => dialFor(q, f, OBJECTS)).filter(Boolean)
const ALL_DIALS = QUESTIONS.flatMap(dialsOf)

test('derived periods match the published ones', () => {
	// Minutes for the ISS, days for the Moon, years for Earth: if Kepler is
	// wired up wrong, one of these is out by orders of magnitude.
	const minutes = periodSeconds(byId('iss')) / 60
	assert.ok(Math.abs(minutes - 92.9) < 1.5, `ISS period came out ${minutes.toFixed(1)} min`)
	const days = periodSeconds(byId('moon')) / 86_400
	assert.ok(Math.abs(days - 27.3) < 0.3, `Moon period came out ${days.toFixed(2)} days`)
	const years = periodSeconds(byId('earth')) / (86_400 * 365.25)
	assert.ok(Math.abs(years - 1) < 0.01, `Earth period came out ${years.toFixed(3)} years`)
	const charon = periodSeconds(byId('charon')) / 86_400
	assert.ok(Math.abs(charon - 6.39) < 0.2, `Charon period came out ${charon.toFixed(2)} days`)
})

test('derived speeds match the published ones', () => {
	assert.ok(Math.abs(speedKms(byId('iss')) - 7.66) < 0.1)
	assert.ok(Math.abs(speedKms(byId('moon')) - 1.02) < 0.05)
	assert.ok(Math.abs(speedKms(byId('earth')) - 29.8) < 0.3)
	assert.ok(Math.abs(speedKms(byId('jupiter')) - 13.1) < 0.3)
})

test('escape trajectories are asked the one question they can answer', () => {
	const v1 = byId('voyager1')
	assert.equal(periodSeconds(v1), null)
	assert.equal(speedKms(v1), null)
	const [distance, period, speed] = QUESTIONS
	assert.ok(supports(distance, v1))
	assert.ok(!supports(period, v1))
	assert.ok(!supports(speed, v1))
})

test('every primary anything orbits has a mu', () => {
	for (const o of OBJECTS) {
		if (o.kind !== 'orbit') continue
		assert.ok(MU[o.primary], `${o.id} orbits ${o.primary}, which has no mu`)
	}
})

test('every dial maps both ends and round-trips in between', () => {
	for (const d of ALL_DIALS) {
		assert.equal(toT(d.min, d), 0, `${d.id} min`)
		assert.equal(toT(d.max, d), 1, `${d.id} max`)
		for (const t of [0.1, 0.37, 0.92]) {
			assert.ok(Math.abs(toT(fromT(t, d), d) - t) < 1e-12, `${d.id} did not round-trip ${t}`)
		}
	}
})

test('a dial clamps instead of running off the end', () => {
	const d = dialsOf(QUESTIONS[0])[0]
	assert.equal(toT(1e-9, d), 0)
	assert.equal(toT(1e30, d), 1)
	assert.ok(Math.abs(fromT(-5, d) - d.min) < 1e-6)
	assert.ok(Math.abs(fromT(5, d) - d.max) / d.max < 1e-12)
})

test('all fifteen dials are readable and have something to ask', () => {
	assert.equal(ALL_DIALS.length, QUESTIONS.length * FRAMES.length)
	for (const q of QUESTIONS) {
		for (const f of FRAMES) {
			const d = dialFor(q, f, OBJECTS)
			assert.ok(d, `${q.id} on ${f.id} has no dial`)
			assert.ok(decadesOf(d) < 4, `${d.id} spans ${decadesOf(d).toFixed(2)} decades, a smudge`)
			assert.ok(decadesOf(d) > 0.4, `${d.id} spans ${decadesOf(d).toFixed(2)} decades, too tight`)
			const askable = OBJECTS.filter((o) => frameFor(o.km) === f && supports(q, o))
			assert.ok(askable.length >= 5, `${q.id} on ${f.id} only has ${askable.length} entries`)
			// Nothing on a stop, where it could be found without knowing anything.
			for (const o of askable) {
				const t = toT(q.valueOf(o), d)
				assert.ok(t > 0.02 && t < 0.98, `${o.id} sits on a stop of ${d.id}`)
			}
			// At least two rings to orient by, including the narrow speed dials.
			assert.ok(ringValues(d.min, d.max).length >= 2, `${d.id} has too few rings`)
		}
	}
})

test('every frame has a landmark ring for every question', () => {
	for (const f of FRAMES) {
		for (const q of QUESTIONS) {
			const marks = OBJECTS.filter((o) => o.ring && frameFor(o.km) === f && supports(q, o))
			const extra = f.surface && q.id === 'distance' ? 1 : 0
			assert.ok(marks.length + extra >= 1, `${f.id} has nothing to read ${q.id} against`)
		}
	}
})

test('a wide window gets 1-2-5 rings, a narrow one gets linear rings', () => {
	assert.deepEqual(ringValues(1_000, 10_000), [1_000, 2_000, 5_000, 10_000])
	for (const v of ringValues(0.2 * AU, 4.5 * AU)) {
		assert.ok(v >= 0.2 * AU && v <= 4.5 * AU)
	}
	// Zoomed in to a fifth of a decade, 1-2-5 would leave one ring or none.
	assert.deepEqual(ringValues(14, 19), [14, 15, 16, 17, 18, 19])
	assert.deepEqual(ringValues(12, 19), [12, 14, 16, 18])
})

test('every window on every dial leaves something to orient by', () => {
	for (const q of QUESTIONS) {
		for (const f of FRAMES) {
			const d = dialFor(q, f, OBJECTS)
			for (const z of ZOOMS) {
				for (const around of [0, 0.5, 1]) {
					const w = windowFor(d, z, around)
					const rings = ringValues(fromT(w.from, d), fromT(w.to, d))
					assert.ok(rings.length >= 2, `${d.id} at ${z}x around ${around}: ${rings.length} rings`)
					for (const v of rings) {
						assert.ok(v >= fromT(w.from, d) * 0.999 && v <= fromT(w.to, d) * 1.001, `${d.id} ring off window`)
					}
				}
			}
		}
	}
})

test('a round never shows a landmark ring for its own answer', () => {
	// The bug this is here for: a ring labelled "Neptune" on a round asking where
	// Neptune orbits, which was worth a free hundred.
	for (const q of QUESTIONS) {
		for (const o of OBJECTS) {
			if (!supports(q, o)) continue
			const rings = landmarkRings(q, frameFor(o.km), OBJECTS, o.id)
			assert.ok(!rings.some((r) => r.value === q.valueOf(o)),
				`${o.id} is given away on its own ${q.id} round`)
		}
	}
	// And a landmark is still a landmark on somebody else's round.
	const neptune = byId('neptune')
	const onPluto = landmarkRings(QUESTIONS[0], frameFor(neptune.km), OBJECTS, 'pluto')
	assert.ok(onPluto.some((r) => r.label === 'Neptune'))
})

test('the three modes differ in the three ways they are meant to', () => {
	const [easy, medium, hard] = MODES
	const q = QUESTIONS[0]
	const frame = frameFor(byId('neptune').km)
	const narrow = dialFor(q, frame, OBJECTS)
	const whole = dialFor(q, null, OBJECTS)

	// The curve: the same miss costs more as the mode gets harder, and both ends
	// stay fixed so the modes remain comparable at 0 and 100.
	const miss = (mode, dial) => score(fromT(0.4, dial), fromT(0.6, dial), dial, mode)
	assert.ok(miss(easy, narrow) > miss(medium, narrow))
	assert.ok(miss(medium, narrow) > miss(hard, narrow))
	assert.equal(miss(medium, narrow), 80)

	// Landmarks: hard withholds them, the others do not.
	assert.equal(easy.landmarks, true)
	assert.equal(hard.landmarks, false)

	// Scope: hard plays the question's whole range, which is a much wider dial.
	assert.ok(decadesOf(whole) > decadesOf(narrow) * 3)
	assert.ok(hard.wholeRange && !medium.wholeRange)

	// An unknown or missing id falls back rather than throwing.
	assert.equal(modeById('nonsense').id, medium.id)
	assert.equal(modeById(undefined).id, medium.id)
})

test('the whole-range dial still holds every answer, away from its stops', () => {
	for (const q of QUESTIONS) {
		const d = dialFor(q, null, OBJECTS)
		for (const o of OBJECTS) {
			if (!supports(q, o)) continue
			const t = toT(q.valueOf(o), d)
			assert.ok(t > 0.01 && t < 0.99, `${o.id} sits on a stop of ${d.id}`)
		}
	}
})

test('scoring is 100 for exact, a point per 1% of the dial missed, never negative', () => {
	// Medium is the default, and the default is a point per 1%.
	for (const d of ALL_DIALS) {
		assert.equal(score(fromT(0.5, d), fromT(0.5, d), d), 100, d.id)
		assert.equal(score(fromT(0.25, d), fromT(0.75, d), d), 50, d.id)
		assert.equal(score(d.min, d.max, d), 0, d.id)
		for (const mode of MODES) {
			assert.equal(score(fromT(0.3, d), fromT(0.3, d), d, mode), 100, `${d.id} ${mode.id}`)
			assert.equal(score(d.min, d.max, d, mode), 0, `${d.id} ${mode.id}`)
		}
	}
})

test('zooming changes what is visible and never the score', () => {
	const d = dialsOf(QUESTIONS[0])[2]
	const actual = fromT(0.62, d)
	const guess = fromT(0.58, d)
	const flat = score(guess, actual, d)
	for (const z of ZOOMS) {
		const w = windowFor(d, z, 0.58)
		assert.equal(score(guess, actual, d), flat, `zoom ${z} changed the score`)
		assert.ok(Math.abs(w.to - w.from - 1 / z) < 1e-12, `zoom ${z} window is the wrong width`)
		// Window maths round-trips, so the ring a player aims at is the value read.
		assert.ok(Math.abs(fromWindow(toWindow(0.58, w), w) - 0.58) < 1e-12)
	}
})

test('a zoomed window stays on the dial, even at the ends', () => {
	const d = dialsOf(QUESTIONS[1])[0]
	for (const around of [0, 0.02, 0.5, 0.98, 1]) {
		for (const z of ZOOMS) {
			const w = windowFor(d, z, around)
			assert.ok(w.from >= 0 && w.to <= 1 + 1e-12, `zoom ${z} at ${around} ran off the dial`)
		}
	}
})

test('a day deals the same hand twice, and different days differ', () => {
	const a = dealDaily(OBJECTS, '2026-03-14')
	const b = dealDaily(OBJECTS, '2026-03-14')
	const c = dealDaily(OBJECTS, '2026-03-15')
	const sig = (hand) => hand.map((r) => `${r.object.id}:${r.question.id}`)
	assert.deepEqual(sig(a), sig(b))
	assert.notDeepEqual(sig(a), sig(c))
})

test('every day is full, mixes question types, and repeats nothing', () => {
	for (let i = 0; i < 400; i++) {
		const key = dayKey(new Date(Date.UTC(2026, 0, 1 + i)))
		const hand = dealDaily(OBJECTS, key)
		assert.equal(hand.length, ROUNDS_PER_DAY, `${key} dealt ${hand.length} rounds`)
		assert.equal(new Set(hand.map((r) => r.object.id)).size, ROUNDS_PER_DAY, `${key} repeated an object`)
		assert.ok(new Set(hand.map((r) => r.question.id)).size >= 2, `${key} asked only one question type`)
		for (const r of hand) assert.ok(supports(r.question, r.object), `${key} asked the impossible`)
	}
})

test('every catalogue entry is complete and lands on exactly one frame', () => {
	const ids = new Set()
	for (const o of OBJECTS) {
		assert.ok(!ids.has(o.id), `duplicate id ${o.id}`)
		ids.add(o.id)
		assert.ok(o.name && o.primary && o.note, `${o.id} is missing copy`)
		assert.ok(['orbit', 'distance'].includes(o.kind), `${o.id} has an odd kind`)
		assert.ok(Number.isFinite(o.km) && o.km > 0, `${o.id} has no distance`)
		assert.ok(o.tags?.length, `${o.id} has no category`)
		assert.equal(FRAMES.filter((f) => o.km > f.minKm && o.km < f.maxKm).length, 1, `${o.id} frames`)
	}
	assert.ok(ids.size >= 80, `catalogue is down to ${ids.size} entries`)
})

test('every category has enough entries to be a category', () => {
	const counts = new Map()
	for (const o of OBJECTS) for (const tag of o.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
	assert.ok(counts.size >= 10, `only ${counts.size} categories`)
	for (const [tag, n] of counts) assert.ok(n >= 3, `category "${tag}" only has ${n} entries`)
})

test('ratio reads the same whichever side the guess fell on', () => {
	assert.equal(ratio(2_000, 1_000), 2)
	assert.equal(ratio(1_000, 2_000), 2)
})

test('a miss is never reported in exponent notation', () => {
	assert.equal(formatRatio(2.43), '2.4x')
	assert.equal(formatRatio(212), '212x')
	assert.equal(formatRatio(1_540), '1,540x')
	assert.equal(formatRatio(4_400_000), '4,400,000x')
})

test('every entry has a width, and a host with a fact sheet behind it', () => {
	for (const o of OBJECTS) {
		assert.ok(Number.isFinite(o.size) && o.size > 0, `${o.id} has no width`)
		// 10 cm to the Sun's diameter: anything outside that is a typo, not a body.
		assert.ok(o.size > 0.0001 && o.size < 1_400_000, `${o.id} is ${o.size} km across`)

		const host = hostOf(o)
		assert.ok(host?.name && host.kind && host.note, `${o.id} has no host sheet`)

		const facts = factsFor(o)
		assert.ok(facts.length >= 3, `${o.id} only derived ${facts.length} facts`)
		for (const f of facts) {
			assert.ok(f.label && f.value, `${o.id} has a blank fact`)
			// Nothing reaches the panel as NaN, undefined or exponent soup.
			assert.ok(!/NaN|undefined|e\+/.test(f.value), `${o.id}: "${f.label}: ${f.value}"`)
		}
	}
})

test('an altitude is never below its own primary surface', () => {
	for (const o of OBJECTS) {
		if (o.kind !== 'orbit') continue
		const host = PRIMARIES[o.primary]
		assert.ok(o.km > host.radius, `${o.id} orbits inside ${o.primary} at ${o.km} km`)
	}
})

test('a width is said in the unit it would be said in', () => {
	assert.equal(formatSize(0.00016), '16 cm')
	assert.equal(formatSize(0.0037), '3.7 m')
	assert.equal(formatSize(0.109), '109 m')
	assert.equal(formatSize(4.1), '4.1 km')
	assert.equal(formatSize(3_475), '3,475 km')
	assert.equal(formatSize(139_820), '139,820 km')
})

test('every quantity is formatted in the unit a person would say', () => {
	assert.equal(formatKm(6_791), '6,791 km')
	assert.equal(formatKm(1_221_870), '1.2 million km')
	// No "0.067 AU" anywhere on a dial: AU only once AU is the natural unit.
	assert.equal(formatKm(1e8), '100 million km')
	assert.equal(formatKm(AU), '1.0 AU')
	assert.equal(formatKm(30.07 * AU), '30 AU')

	// Light-time reaches down into seconds, so the small units have to be there.
	assert.equal(formatDuration(1.28), '1.3 seconds')
	assert.equal(formatDuration(193), '3.2 minutes')
	assert.equal(formatDuration(5_570), '93 minutes')
	assert.equal(formatDuration(86_400), '24 hours')
	assert.equal(formatDuration(27.3 * 86_400), '27 days')
	assert.equal(formatDuration(365.25 * 86_400), '1.0 years')
	assert.equal(formatDuration(11_390 * 365.25 * 86_400), '11,390 years')

	assert.equal(formatSpeed(7.66), '7.66 km/s')
	assert.equal(formatSpeed(29.8), '30 km/s')
})
