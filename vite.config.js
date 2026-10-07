import { nodeExternals } from 'rollup-plugin-node-externals'
import { defineConfig } from 'vite'

export default defineConfig((env) => ({
  build: { lib: { entry: ['./src', './src/cli.ts'], formats: ['es'] } },
  plugins: [env.mode === 'production' && nodeExternals()],
}))
