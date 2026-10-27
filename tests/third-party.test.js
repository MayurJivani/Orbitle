import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// Anything the page loads from another origin can change under it and sees every visitor.
test('the layout loads nothing from another origin', async () => {
	const layout = await readFile(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8')
	assert.doesNotMatch(layout, /<(link|script)[^>]+(href|src)="https?:\/\//)
})
