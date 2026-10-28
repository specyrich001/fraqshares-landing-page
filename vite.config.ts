import { rmSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/** Figma reference renders for the dev-only ?overlay=1 views: served in dev, left out of builds. */
const DEV_ONLY_IMAGES = ['images/steps/sign-up-reference']

function dropDevOnlyImages(): Plugin {
  let outDir = ''
  return {
    name: 'drop-dev-only-images',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      for (const dir of DEV_ONLY_IMAGES) rmSync(path.join(outDir, dir), { recursive: true, force: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), dropDevOnlyImages()],
})
