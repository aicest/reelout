/// <reference types="vite/client" />

interface ImportMetaEnv {}

declare module '*.svg' {
  export const ReactComponent: (
    props: React.ComponentProps<'svg'>
  ) => React.ReactSVGElement
}
