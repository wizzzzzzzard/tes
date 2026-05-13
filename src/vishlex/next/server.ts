export function VishlexProvider({ children }: { children: any }) {
  return children
}

export function VishProvider({ children }: { children: any }) {
  return children
}

export function useVishlex() {
  return { trackEvent: () => {} }
}