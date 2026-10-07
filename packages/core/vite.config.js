import { globSync } from 'node:fs'
import { nodeExternals } from 'rollup-plugin-node-externals'
import { defineConfig } from 'vite'

export default defineConfig({
  build: { lib: { entry: globSync('./src/*.ts'), formats: ['es'] } },
  plugins: [nodeExternals()],
})
