/**
 * The page's only script. It deals the day's five rounds, draws the round's
 * dial, moves one marker, and keeps the day's answers in localStorage so a
 * reload resumes instead of restarting. Every rule it applies comes from
 * shared/orbit.js; nothing is decided here.
 */
import {
	DIAL,
	FRAMES,
	MODES,
	QUESTIONS,
	ROUNDS_PER_DAY,
	ZOOMS,
	dayKey,
	dayNumber,
	dealDaily,
	decadesOf,
	dialFor,
	formatRatio,
	frameFor,
	fromT,
	fromWindow,
	briefingFor,
	factsFor,
	grade,
	hostOf,
	landmarkRings,
	modeById,
	pxFromT,
	ratio,
	score,
	tFromPx,
	toT,
	toWindow,
	ringValues,
	windowFor,
} from '../../shared/orbit.js'
import { OBJECTS } from '../../shared/objects.js'

const $ = (id) => document.getElementById(id)
const SVG = 'http://www.w3.org/2000/svg'

const dial = $('dial')
const handle = $('handle')
const ringLayer = $('rings')
const questionRows = $('questions').querySelectorAll('li')
const frameRows = $('frames').querySelectorAll('li')
const el = {
	day: $('day'),
	round: $('round'),
	subject: $('subject'),
	primary: $('primary'),
	category: $('category'),
	question: $('question'),
	guessLabel: $('guess-label'),
	readout: $('readout'),
	hub: $('hub-label'),
	arm: $('arm'),
	guessRing: $('guess-ring'),
	answer: $('answer'),
	verdict: $('verdict'),
	actual: $('actual'),
	delta: $('delta'),
	note: $('note'),
	facts: $('facts'),
	briefing: $('briefing'),
	host: $('host'),
	points: $('points'),
	grade: $('grade'),
	summary: $('summary'),
	total: $('total'),
	runs: $('runs'),
	place: $('place'),
	next: $('next'),
	share: $('share'),
	zoomIn: $('zoom-in'),
	zoomOut: $('zoom-out'),
	zoomLevel: $('zoom-level'),
	window: $('window'),
	modeNote: $('mode-note'),
}
const modeButtons = $('modes').querySelectorAll('.level')

const key = dayKey()
const rounds = dealDaily(OBJECTS, key)
const store = `orbitle:${key}`

const saved = load()
/** The day's locked-in answers, one value per round in that round's own unit. */
let answers = saved.answers
let mode = saved.mode
let index = Math.min(answers.length, rounds.length - 1)
let round = rounds[index]
let dialSpec = dialOf(round)
let view = windowFor(dialSpec, 1, 0.5)
let angle = -Math.PI / 4
let t = 0.5
let revealed = false

/**
 * Hard plays on the question's whole range, so nothing about the dial says
 * whether the answer is a satellite or a Kuiper belt object before you place
 * it. Easy and Medium play on the round's own frame.
 */
function dialOf(r, m = mode) {
	return dialFor(r.question, m.wholeRange ? null : frameFor(r.object.km), OBJECTS)
}

function load() {
	const fallback = { answers: [], mode: modeById(localStorage.getItem('orbitle:mode')) }
	try {
		const raw = JSON.parse(localStorage.getItem(store) ?? 'null')
		// Anything that is not a list of usable numbers is treated as no progress
		// rather than trusted: it is one day of play, not worth salvaging. The
		// mode travels with the answers, because it is what they were scored on.
		const list = Array.isArray(raw) ? raw : raw?.answers
		if (!Array.isArray(list)) return fallback
		return {
			answers: list.filter((n) => Number.isFinite(n) && n > 0).slice(0, rounds.length),
			mode: modeById(raw?.mode ?? fallback.mode.id),
		}
	} catch {
		return fallback
	}
}

function save() {
	try {
		localStorage.setItem(store, JSON.stringify({ mode: mode.id, answers }))
		localStorage.setItem('orbitle:mode', mode.id)
	} catch {
		// Private browsing, or a full quota. The game still plays, it just will
		// not survive a reload, and that is not worth an error message for.
	}
}

/** The marker's radius in SVG units, from its position on the whole dial. */
function radiusPx() {
	return pxFromT(toWindow(t, view))
}

function guessValue() {
	return fromT(t, dialSpec)
}

/** Fill a label/value list from the module's derivation. */
function sheet(into, rows) {
	into.replaceChildren()
	for (const row of rows) {
		const dt = document.createElement('dt')
		dt.textContent = row.label
		const dd = document.createElement('dd')
		dd.textContent = row.value
		into.append(dt, dd)
	}
}

function ring(cls, r, label, labelAbove) {
	const g = document.createElementNS(SVG, 'g')
	g.setAttribute('class', cls)
	const circle = document.createElementNS(SVG, 'circle')
	circle.setAttribute('cx', DIAL.cx)
	circle.setAttribute('cy', DIAL.cy)
	circle.setAttribute('r', r)
	g.append(circle)
	if (label) {
		const text = document.createElementNS(SVG, 'text')
		text.setAttribute('x', DIAL.cx)
		text.setAttribute('y', labelAbove ? DIAL.cy - r - 9 : DIAL.cy + r + 15)
		text.textContent = label
		g.append(text)
	}
	ringLayer.append(g)
}

/**
 * Draw the rings for the visible window: round values labelled below (the step
 * is the window's business, see ringValues) and the frame's landmarks labelled
 * above. Both are redrawn on every
 * zoom change, which is what makes zooming worth having: the rings spread out
 * rather than the drawing getting bigger.
 */
function drawRings() {
	ringLayer.replaceChildren()
	// A label is dropped rather than drawn over its neighbour. Two overlapping
	// numbers read as neither of them.
	const placed = { below: [], above: [] }
	const clear = (r, side) => {
		if (placed[side].some((at) => Math.abs(at - r) < 22)) return false
		placed[side].push(r)
		return true
	}
	const frame = frameFor(round.object.km)
	const from = fromT(view.from, dialSpec)
	const to = fromT(view.to, dialSpec)

	for (const v of ringValues(from, to)) {
		const r = pxFromT(toWindow(toT(v, dialSpec), view))
		ring('decade', r, clear(r, 'below') ? round.question.format(v) : null, false)
	}

	// Landmark rings, unless the mode withholds them. The round's own object is
	// never one: a ring labelled "Neptune" on a Neptune round is the answer with
	// a label on it.
	if (mode.landmarks) {
		for (const l of landmarkRings(round.question, frame, OBJECTS, round.object.id)) {
			if (l.value < from || l.value > to) continue
			const r = pxFromT(toWindow(toT(l.value, dialSpec), view))
			ring('landmark', r, clear(r, 'above') ? l.label : null, true)
		}
	}

	el.window.textContent = `showing ${round.question.format(from)} to ${round.question.format(to)}`
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
	const said = round.question.format(guessValue())
	el.readout.textContent = said
	handle.setAttribute('aria-valuenow', Math.round(t * 1000))
	handle.setAttribute('aria-valuetext', `${said}, ${round.question.label}`)
}

/** Re-centre the visible window on the marker at the current zoom. */
function setZoom(zoom) {
	view = windowFor(dialSpec, Math.min(Math.max(zoom, ZOOMS[0]), ZOOMS.at(-1)), t)
	el.zoomLevel.textContent = `${view.zoom}x`
	el.zoomOut.disabled = view.zoom === ZOOMS[0]
	el.zoomIn.disabled = view.zoom === ZOOMS.at(-1)
	drawRings()
	moveMarker()
	if (revealed) showAnswerRing()
}

function stepZoom(by) {
	const at = ZOOMS.indexOf(view.zoom)
	const next = ZOOMS[Math.min(Math.max(at + by, 0), ZOOMS.length - 1)]
	if (next !== view.zoom) setZoom(next)
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
	const tw = Math.min(Math.max(tFromPx(Math.hypot(dx, dy)), 0), 1)
	t = fromWindow(tw, view)
	moveMarker()
}

function showAnswerRing() {
	const actual = round.question.valueOf(round.object)
	el.answer.setAttribute('r', pxFromT(toWindow(toT(actual, dialSpec), view)))
	el.answer.classList.remove('off')
}

function renderRound() {
	round = rounds[index]
	dialSpec = dialOf(round)
	const { object, question } = round
	const frame = frameFor(object.km)

	for (const row of questionRows) row.classList.toggle('is-on', row.dataset.question === question.id)
	for (const row of frameRows) {
		// Hard highlights nothing: naming the band would hand over most of the
		// answer before a marker is placed.
		row.classList.toggle('is-on', !mode.wholeRange && row.dataset.frame === frame.id)
	}

	el.day.textContent = `${key} · puzzle ${dayNumber(key)}`
	el.round.textContent = `round ${index + 1} of ${ROUNDS_PER_DAY}`
	el.subject.textContent = object.name
	el.primary.textContent =
		object.kind === 'orbit' ? `orbits ${object.primary}` : `heading away from ${object.primary}`
	el.category.textContent = object.tags[0]
	el.question.textContent = question.ask(object)

	// The briefing, before anything is placed. Everything in it is about the
	// thing and its host, never about where or how fast it goes.
	sheet(el.briefing, briefingFor(object))
	el.host.textContent = hostOf(object)?.line ?? ''
	el.guessLabel.textContent = `your ${question.label}`
	el.hub.textContent = object.primary.replace(/^the /, '')
	el.verdict.hidden = true
	el.answer.classList.add('off')
	el.next.hidden = true
	el.place.hidden = false
	revealed = false
	t = 0.5
	setZoom(1)
}

function reveal() {
	const { object, question } = round
	const actual = question.valueOf(object)
	const guess = answers[index]
	const points = score(guess, actual, dialSpec, mode)

	// Put the marker back where it was placed and pull back to the whole dial, so
	// the guess ring and the answer ring are both on screen to compare. Zoomed
	// in, the answer is often outside the window and pins to the rim, which reads
	// as "somewhere out there" rather than as an answer.
	t = toT(guess, dialSpec)
	revealed = true
	setZoom(1)

	el.actual.textContent = question.format(actual)
	el.delta.textContent =
		points === 100
			? 'dead on'
			: `${formatRatio(ratio(guess, actual))} ${guess > actual ? question.over : question.under}`
	el.note.textContent = object.note
	// Only what the answer unlocked: the width and the host were on screen from
	// the start of the round.
	sheet(el.facts, factsFor(object))
	el.points.textContent = String(points)
	el.grade.textContent = grade(points).word
	el.verdict.hidden = false
	el.place.hidden = true
	el.next.hidden = index >= rounds.length - 1

	// On a phone the panel sits under the dial and the commit bar covers the top
	// of it, so the result would land off screen. Harmless where it is already
	// visible, which is every desktop.
	el.verdict.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

/** Each round is scored on its own dial, which is why this is not one map. */
function run() {
	return rounds.map((r, i) => score(answers[i], r.question.valueOf(r.object), dialOf(r), mode))
}

function finish() {
	const points = run()
	el.total.textContent = String(points.reduce((a, b) => a + b, 0))
	el.runs.textContent = points.map((p) => grade(p).glyph).join('')
	el.summary.hidden = false
	el.share.hidden = false
	el.next.hidden = true
	el.place.hidden = true
}

function shareText() {
	const points = run()
	return [
		`Orbitle ${dayNumber(key)} (${mode.name}): ${points.reduce((a, b) => a + b, 0)}/${ROUNDS_PER_DAY * 100}`,
		points.map((p) => grade(p).glyph).join(''),
		// One letter per round, so a shared result says which questions came up.
		rounds.map((r) => r.question.id[0].toUpperCase()).join(''),
		location.origin || '',
	]
		.filter(Boolean)
		.join('\n')
}

el.place.addEventListener('click', () => {
	if (revealed) return
	answers[index] = guessValue()
	save()
	renderMode()
	reveal()
	if (answers.length === rounds.length) finish()
})

el.next.addEventListener('click', () => {
	if (index < rounds.length - 1) index++
	renderRound()
	if (answers[index] !== undefined) reveal()
	if (answers.length === rounds.length) finish()
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

function renderMode() {
	const locked = answers.length > 0
	for (const b of modeButtons) {
		b.classList.toggle('is-on', b.dataset.mode === mode.id)
		// Locked after the first answer: the mode is what the earlier rounds were
		// scored on, and changing it would silently rewrite them.
		b.disabled = locked
	}
	el.modeNote.textContent = locked ? `${mode.blurb} · locked for today` : mode.blurb
}

for (const b of modeButtons) {
	b.addEventListener('click', () => {
		if (answers.length > 0) return
		mode = MODES.find((m) => m.id === b.dataset.mode) ?? mode
		save()
		renderMode()
		renderRound()
	})
}

el.zoomIn.addEventListener('click', () => stepZoom(1))
el.zoomOut.addEventListener('click', () => stepZoom(-1))

// Two fingers zoom, one finger places. The pinch is tracked as a ratio against
// the span the gesture started at, and each time it crosses a step the zoom
// moves one notch and the baseline resets, so a long pinch walks through the
// levels instead of jumping to an end.
const touching = new Map()
let pinchSpan = 0

const span = () => {
	const [a, b] = [...touching.values()]
	return Math.hypot(a.x - b.x, a.y - b.y)
}

dial.addEventListener('pointerdown', (event) => {
	touching.set(event.pointerId, { x: event.clientX, y: event.clientY })
	if (touching.size === 2) {
		pinchSpan = span()
		return
	}
	if (revealed || touching.size > 2) return
	dial.setPointerCapture(event.pointerId)
	aimAt(event)
})

dial.addEventListener('pointermove', (event) => {
	if (touching.has(event.pointerId)) {
		touching.set(event.pointerId, { x: event.clientX, y: event.clientY })
	}
	if (touching.size === 2) {
		const now = span()
		if (pinchSpan > 0 && now / pinchSpan > 1.3) {
			stepZoom(1)
			pinchSpan = now
		} else if (pinchSpan > 0 && now / pinchSpan < 0.77) {
			stepZoom(-1)
			pinchSpan = now
		}
		return
	}
	if (revealed || !dial.hasPointerCapture(event.pointerId)) return
	aimAt(event)
})

for (const done of ['pointerup', 'pointercancel']) {
	dial.addEventListener(done, (event) => {
		touching.delete(event.pointerId)
		if (touching.size < 2) pinchSpan = 0
		if (dial.hasPointerCapture(event.pointerId)) dial.releasePointerCapture(event.pointerId)
	})
}

// Wheel zooms the dial rather than the page, but only over the dial itself.
dial.addEventListener(
	'wheel',
	(event) => {
		event.preventDefault()
		stepZoom(event.deltaY < 0 ? 1 : -1)
	},
	{ passive: false },
)

// The dial is a slider as far as the keyboard is concerned: a fifth of a factor
// of ten on the arrows, a whole one on shift-arrow or page up/down, the ends on
// home/end, enter to lock the answer in, and +/- to zoom. The step is a share
// of the active dial, so it covers the same ground on a wide dial and a narrow
// one.
handle.addEventListener('keydown', (event) => {
	if (event.key === '+' || event.key === '=') return stepZoom(1), event.preventDefault()
	if (event.key === '-' || event.key === '_') return stepZoom(-1), event.preventDefault()
	if (revealed) return

	const decade = 1 / decadesOf(dialSpec)
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
	// Keep the marker inside the visible window, or zoomed in the arrows would
	// walk it off the edge of the dial and leave nothing to aim with.
	view = windowFor(dialSpec, view.zoom, t)
	drawRings()
	moveMarker()
	event.preventDefault()
})

renderMode()
renderRound()
if (answers[index] !== undefined) {
	// Resuming a round already answered: show it as it was left, answer and all.
	reveal()
	if (answers.length === rounds.length) finish()
}
