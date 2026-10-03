/**
 * The page's only script. It moves one marker, locks in five guesses, and keeps
 * the day's guesses in localStorage so a reload resumes instead of restarting.
 * Every rule it applies comes from shared/orbit.js.
 */
import {
	DECADES_ON_DIAL,
	DIAL,
	ROUNDS_PER_DAY,
	dayKey,
	dayNumber,
	formatKm,
	formatRatio,
	grade,
	kmFromPx,
	pickDaily,
	pxFromKm,
	ratio,
	score,
} from '../../shared/orbit.js'
import { OBJECTS } from '../../shared/objects.js'

const $ = (id) => document.getElementById(id)

const dial = $('dial')
const handle = $('handle')
const el = {
	day: $('day'),
	round: $('round'),
	subject: $('subject'),
	primary: $('primary'),
	readout: $('readout'),
	hub: $('hub-label'),
	arm: $('arm'),
	guessRing: $('guess-ring'),
	answer: $('answer'),
	verdict: $('verdict'),
	actual: $('actual'),
	delta: $('delta'),
	note: $('note'),
	points: $('points'),
	grade: $('grade'),
	summary: $('summary'),
	total: $('total'),
	runs: $('runs'),
	place: $('place'),
	next: $('next'),
	share: $('share'),
}

const key = dayKey()
const hand = pickDaily(OBJECTS, key)
const store = `orbit:${key}`

/** The day's locked-in guesses, in km. Index into `hand`. */
let guesses = load()
let index = Math.min(guesses.length, hand.length - 1)
let angle = -Math.PI / 4
let t = 0.5
let revealed = false

function load() {
	try {
		const saved = JSON.parse(localStorage.getItem(store) ?? '[]')
		// Anything that is not a list of usable numbers is treated as no progress
		// rather than trusted: it is one day of play, not worth salvaging.
		if (!Array.isArray(saved)) return []
		return saved.filter((n) => Number.isFinite(n) && n > 0).slice(0, hand.length)
	} catch {
		return []
	}
}

function save() {
	try {
		localStorage.setItem(store, JSON.stringify(guesses))
	} catch {
		// Private browsing, or a full quota. The game still plays, it just will
		// not survive a reload, and that is not worth an error message for.
	}
}

/** The marker's current ring radius, in SVG units. */
function radiusPx() {
	return DIAL.inner + t * (DIAL.outer - DIAL.inner)
}

function moveMarker() {
	const r = radiusPx()
	const x = DIAL.cx + Math.cos(angle) * r
	const y = DIAL.cy + Math.sin(angle) * r
	el.arm.setAttribute('x2', x)
	el.arm.setAttribute('y2', y)
	el.guessRing.setAttribute('r', r)
	for (const c of handle.children) {
		c.setAttribute('cx', x)
		c.setAttribute('cy', y)
	}
	const km = kmFromPx(r)
	el.readout.textContent = formatKm(km)
	handle.setAttribute('aria-valuenow', Math.round(t * 1000))
	handle.setAttribute('aria-valuetext', formatKm(km))
}

function guessKm() {
	return kmFromPx(radiusPx())
}

/**
 * Pointer position in the SVG's own units. The element's box is not square once
 * max-height clips it, and the viewBox then letterboxes inside it, so ask the
 * SVG for the transform rather than deriving one from the bounding rect.
 */
function pointTo(event) {
	const p = new DOMPoint(event.clientX, event.clientY)
	return p.matrixTransform(dial.getScreenCTM().inverse())
}

function aimAt(event) {
	const { x, y } = pointTo(event)
	const dx = x - DIAL.cx
	const dy = y - DIAL.cy
	angle = Math.atan2(dy, dx)
	const r = Math.hypot(dx, dy)
	t = Math.min(Math.max((r - DIAL.inner) / (DIAL.outer - DIAL.inner), 0), 1)
	moveMarker()
}

function renderRound() {
	const o = hand[index]
	el.day.textContent = `${key} · puzzle ${dayNumber(key)}`
	el.round.textContent = `round ${index + 1} of ${ROUNDS_PER_DAY}`
	el.subject.textContent = o.name
	el.primary.textContent =
		o.kind === 'orbit' ? `orbits ${o.primary}` : `heading away from ${o.primary}`
	el.hub.textContent = o.primary.replace(/^the /, '')
	el.verdict.hidden = true
	el.answer.hidden = true
	el.next.hidden = true
	el.place.hidden = false
	el.place.disabled = false
	revealed = false
	moveMarker()
}

function reveal() {
	const o = hand[index]
	const guess = guesses[index]
	const points = score(guess, o.km)
	const g = grade(points)

	el.answer.setAttribute('r', pxFromKm(o.km))
	el.answer.hidden = false
	el.actual.textContent = formatKm(o.km)
	el.delta.textContent =
		points === 100
			? 'dead on'
			: `${formatRatio(ratio(guess, o.km))} too ${guess > o.km ? 'far out' : 'close in'}`
	el.note.textContent = o.note
	el.points.textContent = String(points)
	el.grade.textContent = g.word
	el.verdict.hidden = false
	el.place.hidden = true
	el.next.hidden = index >= hand.length - 1
	revealed = true
}

function finish() {
	const points = hand.map((o, i) => score(guesses[i], o.km))
	el.total.textContent = String(points.reduce((a, b) => a + b, 0))
	el.runs.textContent = points.map((p) => grade(p).glyph).join('')
	el.summary.hidden = false
	el.share.hidden = false
	el.next.hidden = true
	el.place.hidden = true
}

function shareText() {
	const points = hand.map((o, i) => score(guesses[i], o.km))
	const total = points.reduce((a, b) => a + b, 0)
	return [
		`Orbit ${dayNumber(key)}: ${total}/${ROUNDS_PER_DAY * 100}`,
		points.map((p) => grade(p).glyph).join(''),
		location.origin || '',
	]
		.filter(Boolean)
		.join('\n')
}

el.place.addEventListener('click', () => {
	guesses[index] = guessKm()
	save()
	reveal()
	if (guesses.length === hand.length) finish()
})

el.next.addEventListener('click', () => {
	if (index < hand.length - 1) index++
	renderRound()
	if (guesses[index] !== undefined) reveal()
	if (guesses.length === hand.length) finish()
})

el.share.addEventListener('click', async () => {
	const text = shareText()
	try {
		await navigator.clipboard.writeText(text)
		el.share.textContent = 'Copied'
	} catch {
		// No clipboard permission (or no clipboard): fall back to a selectable
		// block rather than swallowing the result.
		el.runs.textContent = text
		el.share.textContent = 'Select and copy'
	}
})

dial.addEventListener('pointerdown', (event) => {
	if (revealed) return
	dial.setPointerCapture(event.pointerId)
	aimAt(event)
})

dial.addEventListener('pointermove', (event) => {
	if (revealed || !dial.hasPointerCapture(event.pointerId)) return
	aimAt(event)
})

dial.addEventListener('pointerup', (event) => {
	if (dial.hasPointerCapture(event.pointerId)) dial.releasePointerCapture(event.pointerId)
})

// The dial is a slider as far as the keyboard is concerned: a fifth of a factor
// of ten on the arrows, a whole one on shift-arrow or page up/down, the ends on
// home/end, and enter to lock the guess in without reaching for the button.
handle.addEventListener('keydown', (event) => {
	if (revealed) return
	const decade = 1 / DECADES_ON_DIAL // one factor of ten, as a fraction of the dial
	const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[event.key]
	let next = t
	if (step !== undefined) next = t + step * decade * (event.shiftKey ? 1 : 0.2)
	else if (event.key === 'PageUp') next = t + decade
	else if (event.key === 'PageDown') next = t - decade
	else if (event.key === 'Home') next = 0
	else if (event.key === 'End') next = 1
	else if (event.key === 'Enter' || event.key === ' ') {
		el.place.click()
		event.preventDefault()
		return
	} else return

	t = Math.min(Math.max(next, 0), 1)
	moveMarker()
	event.preventDefault()
})

renderRound()
if (guesses[index] !== undefined) {
	// Resuming a round already answered: show it as it was left, answer and all.
	t = (pxFromKm(guesses[index]) - DIAL.inner) / (DIAL.outer - DIAL.inner)
	moveMarker()
	reveal()
	if (guesses.length === hand.length) finish()
}
