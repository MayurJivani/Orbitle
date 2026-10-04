/**
 * The page's only script. It deals the day's five rounds, draws the round's
 * dial, moves one marker, and keeps the day's answers in localStorage so a
 * reload resumes instead of restarting. Every rule it applies comes from
 * shared/orbit.js; nothing is decided here.
 */
import {
	DIAL,
	FRAMES,
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
	grade,
	pxFromT,
	ratio,
	score,
	supports,
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
}

const key = dayKey()
const rounds = dealDaily(OBJECTS, key)
const store = `orbitle:${key}`

/** The day's locked-in answers, one value per round in that round's own unit. */
let answers = load()
let index = Math.min(answers.length, rounds.length - 1)
let round = rounds[index]
let dialSpec = dialOf(round)
let view = windowFor(dialSpec, 1, 0.5)
let angle = -Math.PI / 4
let t = 0.5
let revealed = false

function dialOf(r) {
	return dialFor(r.question, frameFor(r.object.km), OBJECTS)
}

function load() {
	try {
		const saved = JSON.parse(localStorage.getItem(store) ?? '[]')
		// Anything that is not a list of usable numbers is treated as no progress
		// rather than trusted: it is one day of play, not worth salvaging.
		if (!Array.isArray(saved)) return []
		return saved.filter((n) => Number.isFinite(n) && n > 0).slice(0, rounds.length)
	} catch {
		return []
	}
}

function save() {
	try {
		localStorage.setItem(store, JSON.stringify(answers))
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
	const frame = frameFor(round.object.km)
	const from = fromT(view.from, dialSpec)
	const to = fromT(view.to, dialSpec)

	for (const v of ringValues(from, to)) {
		ring('decade', pxFromT(toWindow(toT(v, dialSpec), view)), round.question.format(v), false)
	}

	// Landmarks are catalogue entries that double as rings, so their value comes
	// from the same place the answers do and cannot disagree with them.
	const landmarks = OBJECTS.filter(
		(o) => o.ring && frameFor(o.km) === frame && supports(round.question, o),
	).map((o) => ({ label: o.ring, value: round.question.valueOf(o) }))

	// Earth's surface is a ring and not an orbit, so only one question can use it.
	if (frame.surface && round.question.id === 'distance') {
		landmarks.push({ label: frame.surface.label, value: frame.surface.km })
	}

	for (const l of landmarks) {
		if (l.value < from || l.value > to) continue
		ring('landmark major', pxFromT(toWindow(toT(l.value, dialSpec), view)), l.label, true)
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
	for (const row of frameRows) row.classList.toggle('is-on', row.dataset.frame === frame.id)

	el.day.textContent = `${key} · puzzle ${dayNumber(key)}`
	el.round.textContent = `round ${index + 1} of ${ROUNDS_PER_DAY}`
	el.subject.textContent = object.name
	el.primary.textContent =
		object.kind === 'orbit' ? `orbits ${object.primary}` : `heading away from ${object.primary}`
	el.category.textContent = object.tags[0]
	el.question.textContent = question.ask(object)
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
	const points = score(guess, actual, dialSpec)

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
	el.points.textContent = String(points)
	el.grade.textContent = grade(points).word
	el.verdict.hidden = false
	el.place.hidden = true
	el.next.hidden = index >= rounds.length - 1
}

/** Each round is scored on its own dial, which is why this is not one map. */
function run() {
	return rounds.map((r, i) =>
		score(answers[i], r.question.valueOf(r.object), dialFor(r.question, frameFor(r.object.km), OBJECTS)),
	)
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
		`Orbitle ${dayNumber(key)}: ${points.reduce((a, b) => a + b, 0)}/${ROUNDS_PER_DAY * 100}`,
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

el.zoomIn.addEventListener('click', () => stepZoom(1))
el.zoomOut.addEventListener('click', () => stepZoom(-1))

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

renderRound()
if (answers[index] !== undefined) {
	// Resuming a round already answered: show it as it was left, answer and all.
	reveal()
	if (answers.length === rounds.length) finish()
}
