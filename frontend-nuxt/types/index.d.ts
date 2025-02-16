// Add type declarations for static assets
declare module '*.png' {
  const value: string
  export default value
}

declare module '*.svg' {
  const value: string
  export default value
}

// Add type declarations for vue components
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
} 