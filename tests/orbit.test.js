import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
	AU,
	PENALTY_PER_DECADE,
	ROUNDS_PER_DAY,
	SCALE_MAX_KM,
	SCALE_MIN_KM,
	dayKey,
	formatKm,
	formatRatio,
	kmToT,
	pickDaily,
	ratio,
	score,
	tToKm,
} from '../shared/orbit.js'
import { OBJECTS } from '../shared/objects.js'

test('the dial maps both ends and round-trips in between', () => {
	assert.equal(kmToT(SCALE_MIN_KM), 0)
	assert.equal(kmToT(SCALE_MAX_KM), 1)
	for (const km of [2_000, 42_164, 384_400, AU, 30 * AU]) {
		assert.ok(Math.abs(tToKm(kmToT(km)) - km) < km * 1e-9, `${km} km did not round-trip`)
	}
})

test('the dial clamps instead of running off the end', () => {
	assert.equal(kmToT(1), 0)
	assert.equal(kmToT(1e30), 1)
	assert.ok(Math.abs(tToKm(-5) - SCALE_MIN_KM) < 1e-6)
	assert.ok(Math.abs(tToKm(5) - SCALE_MAX_KM) < 1)
})

test('scoring is 100 for exact, one penalty per factor of ten, never negative', () => {
	assert.equal(score(384_400, 384_400), 100)
	assert.equal(score(3_844_000, 384_400), 100 - PENALTY_PER_DECADE)
	assert.equal(score(38_440, 384_400), 100 - PENALTY_PER_DECADE)
	assert.equal(score(SCALE_MIN_KM, SCALE_MAX_KM), 0)
})

test('scoring is about factors, not kilometres', () => {
	// The same 400 km error costs something at ISS altitude and nothing at Jupiter.
	assert.ok(score(6_791 + 400, 6_791) < score(5.204 * AU + 400, 5.204 * AU))
	assert.equal(score(5.204 * AU + 400, 5.204 * AU), 100)
	// And a factor-of-two miss costs the same wherever it happens.
	assert.equal(score(13_582, 6_791), score(10.408 * AU, 5.204 * AU))
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
	// The worst possible miss: one end of the dial guessed as the other.
	assert.ok(!formatRatio(SCALE_MAX_KM / SCALE_MIN_KM).includes('e'))
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

test('every catalogue entry is scorable and lands inside the dial', () => {
	const ids = new Set()
	for (const o of OBJECTS) {
		assert.ok(!ids.has(o.id), `duplicate id ${o.id}`)
		ids.add(o.id)
		assert.ok(o.name && o.primary && o.note, `${o.id} is missing copy`)
		assert.ok(['orbit', 'distance'].includes(o.kind), `${o.id} has an odd kind`)
		assert.ok(Number.isFinite(o.km) && o.km > 0, `${o.id} has no distance`)
		// Strictly inside, so no answer sits on a stop where it cannot be missed.
		assert.ok(o.km > SCALE_MIN_KM && o.km < SCALE_MAX_KM, `${o.id} is off the dial`)
	}
	assert.ok(ids.size >= 50, 'catalogue is too small to go a month without repeats')
})

test('distances are formatted in the unit a person would say', () => {
	assert.equal(formatKm(6_791), '6,791 km')
	assert.equal(formatKm(384_400), '384,400 km')
	assert.equal(formatKm(1_221_870), '1.2 million km')
	assert.equal(formatKm(1e7), '10 million km')
	// No "0.067 AU" anywhere on the dial: AU only once AU is the natural unit.
	assert.equal(formatKm(1e8), '100 million km')
	assert.equal(formatKm(AU), '1.0 AU')
	assert.equal(formatKm(5.204 * AU), '5.2 AU')
	assert.equal(formatKm(30.07 * AU), '30 AU')
})
