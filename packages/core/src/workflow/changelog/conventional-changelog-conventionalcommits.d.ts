import type { Options } from 'conventional-changelog-writer'

declare module 'conventional-changelog-conventionalcommits' {
  export default function createPreset(config?: PresetConfig): {
    writer: Options
  }
}
