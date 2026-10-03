import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
	AU,
	ROUNDS_PER_DAY,
	SCALES,
	dayKey,
	decades,
	decadesOf,
	formatKm,
	formatRatio,
	kmToT,
	pickDaily,
	ratio,
	scaleFor,
	score,
	tToKm,
} from '../shared/orbit.js'
import { OBJECTS } from '../shared/objects.js'

const NEAR = SCALES[0]
const SOLAR = SCALES[2]

test('every dial maps both ends and round-trips in between', () => {
	for (const s of SCALES) {
		assert.equal(kmToT(s.minKm, s), 0, `${s.id} min`)
		assert.equal(kmToT(s.maxKm, s), 1, `${s.id} max`)
		for (const t of [0.1, 0.37, 0.5, 0.92]) {
			assert.ok(Math.abs(kmToT(tToKm(t, s), s) - t) < 1e-12, `${s.id} did not round-trip ${t}`)
		}
	}
})

test('a dial clamps instead of running off the end', () => {
	assert.equal(kmToT(1, NEAR), 0)
	assert.equal(kmToT(1e30, NEAR), 1)
	assert.ok(Math.abs(tToKm(-5, NEAR) - NEAR.minKm) < 1e-6)
	assert.ok(Math.abs(tToKm(5, NEAR) - NEAR.maxKm) < 1e-6)
})

test('every dial is narrow enough to read and wide enough to be a question', () => {
	for (const s of SCALES) {
		assert.ok(decadesOf(s) > 1, `${s.id} is too narrow to guess on`)
		assert.ok(decadesOf(s) < 4, `${s.id} spans ${decadesOf(s)} decades, which is a smudge`)
		assert.ok(decades(s).length >= 2, `${s.id} has too few decade rings to orient by`)
		for (const a of s.anchors) {
			assert.ok(a.km > s.minKm && a.km < s.maxKm, `${s.id}: anchor ${a.label} is off its own dial`)
		}
	}
})

test('scoring is 100 for exact, a point per 1% of the dial missed, never negative', () => {
	assert.equal(score(42_164, 42_164, NEAR), 100)
	// Half the dial out is half the points, on any dial.
	for (const s of SCALES) {
		assert.equal(score(tToKm(0.25, s), tToKm(0.75, s), s), 50)
		assert.equal(score(s.minKm, s.maxKm, s), 0)
	}
})

test('the same factor-of-ten miss costs more on a narrower dial', () => {
	const nearMiss = score(63_710, 6_371, NEAR)
	const solarMiss = score(10 * AU, AU, SOLAR)
	assert.ok(nearMiss < solarMiss, 'a decade should hurt more where the dial is only two decades wide')
	// And it is still the same miss in kilometres terms on either dial.
	assert.equal(ratio(63_710, 6_371), ratio(10 * AU, AU))
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

test('a day deals the same hand twice, and different days differ', () => {
	const a = pickDaily(OBJECTS, '2026-03-14')
	const b = pickDaily(OBJECTS, '2026-03-14')
	const c = pickDaily(OBJECTS, '2026-03-15')
	assert.deepEqual(a.map((o) => o.id), b.map((o) => o.id))
	assert.notDeepEqual(a.map((o) => o.id), c.map((o) => o.id))
})

test('a day never repeats an object, and always fills the round count', () => {
	for (let i = 0; i < 400; i++) {
		const key = dayKey(new Date(Date.UTC(2026, 0, 1 + i)))
		const hand = pickDaily(OBJECTS, key)
		assert.equal(hand.length, ROUNDS_PER_DAY)
		assert.equal(new Set(hand.map((o) => o.id)).size, ROUNDS_PER_DAY, `${key} dealt a duplicate`)
	}
})

test('asking for more objects than exist returns the catalogue, not undefined', () => {
	const hand = pickDaily(OBJECTS, '2026-03-14', OBJECTS.length + 10)
	assert.equal(hand.length, OBJECTS.length)
	assert.ok(hand.every(Boolean))
})

test('every catalogue entry lands on exactly one dial, inside it', () => {
	const ids = new Set()
	for (const o of OBJECTS) {
		assert.ok(!ids.has(o.id), `duplicate id ${o.id}`)
		ids.add(o.id)
		assert.ok(o.name && o.primary && o.note, `${o.id} is missing copy`)
		assert.ok(['orbit', 'distance'].includes(o.kind), `${o.id} has an odd kind`)
		assert.ok(Number.isFinite(o.km) && o.km > 0, `${o.id} has no distance`)

		// No gaps: an entry that falls between two dials has nowhere to be asked.
		const scale = scaleFor(o.km)
		assert.ok(scale, `${o.id} at ${o.km} km falls between dials`)
		// And no ambiguity: the dial it gets must be the only one that fits.
		const fits = SCALES.filter((s) => o.km > s.minKm && o.km < s.maxKm)
		assert.equal(fits.length, 1, `${o.id} fits ${fits.length} dials`)
	}
	assert.ok(ids.size >= 50, 'catalogue is too small to go a month without repeats')
})

test('every dial has enough entries to be worth having', () => {
	for (const s of SCALES) {
		const n = OBJECTS.filter((o) => scaleFor(o.km) === s).length
		assert.ok(n >= 5, `${s.id} only has ${n} entries`)
	}
})

test('distances are formatted in the unit a person would say', () => {
	assert.equal(formatKm(6_791), '6,791 km')
	assert.equal(formatKm(384_400), '384,400 km')
	assert.equal(formatKm(1_221_870), '1.2 million km')
	assert.equal(formatKm(1e7), '10 million km')
	// No "0.067 AU" anywhere on a dial: AU only once AU is the natural unit.
	assert.equal(formatKm(1e8), '100 million km')
	assert.equal(formatKm(AU), '1.0 AU')
	assert.equal(formatKm(5.204 * AU), '5.2 AU')
	assert.equal(formatKm(30.07 * AU), '30 AU')
})
