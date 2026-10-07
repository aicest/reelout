import { nodeExternals } from 'rollup-plugin-node-externals'
import { defineConfig } from 'vite'

export default defineConfig({
  build: { lib: { entry: './src', formats: ['es'] } },
  plugins: [nodeExternals()],
})
