// @ts-check
import { defineConfig } from 'astro/config'

// Static, and no relay process behind it. This is the relay shape from
// ~/Projects/FRC/GUIDELINES.md with the relay left out: the whole game is a
// hand-curated catalogue plus client-side scoring, so there is nothing for a
// socket to carry and nothing for a server to keep. Add the Node process back
// the day scores are compared across people rather than across days.
export default defineConfig({ output: 'static' })
