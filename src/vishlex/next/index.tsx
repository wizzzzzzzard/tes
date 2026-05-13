// sdk/src/next/index.tsx
"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  type ReactNode,
} from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { buildPageviewPayload, buildEventPayload } from "../lib/payload"
import { send } from "../lib/sender"

type VishlexContextValue = {
  trackEvent: (name: string, properties?: Record<string, unknown>) => void
}

const VishlexContext = createContext<VishlexContextValue>({ trackEvent: () => {} })

export function useVishlex() {
  return useContext(VishlexContext)
}

type Props = {
  trackingId:  string
  collectUrl:  string
  disabled?:   boolean
  children:    ReactNode
}

function TrackerInner({
  trackingId,
  collectUrl,
  disabled = false,
}: Omit<Props, "children">) {
  const pathname      = usePathname()
  const searchParams  = useSearchParams()
  const pageEnteredAt = useRef<number>(Date.now())
  const lastPathRef   = useRef<string | null>(null)

  const sendPageview = useCallback(
    (durationMs: number | null = null) => {
      if (disabled || typeof window === "undefined") return
      send(buildPageviewPayload(trackingId, durationMs), collectUrl)
    },
    [trackingId, collectUrl, disabled]
  )

  useEffect(() => {
    const currentPath =
      pathname + (searchParams?.toString() ? `?${searchParams}` : "")

    if (lastPathRef.current === currentPath) return

    if (lastPathRef.current !== null) {
      sendPageview(Date.now() - pageEnteredAt.current)
    } else {
      sendPageview(null)
    }

    lastPathRef.current   = currentPath
    pageEnteredAt.current = Date.now()
  }, [pathname, searchParams, sendPageview])

  useEffect(() => {
    if (disabled) return
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        sendPageview(Date.now() - pageEnteredAt.current)
      }
    }
    document.addEventListener("visibilitychange", onHide)
    return () => document.removeEventListener("visibilitychange", onHide)
  }, [disabled, sendPageview])

  return null
}

// ── Full provider (used when you supply trackingId + collectUrl explicitly) ──

export function VishlexProvider({ trackingId, collectUrl, disabled = false, children }: Props) {
  const trackEvent = useCallback(
    (name: string, properties?: Record<string, unknown>) => {
      if (disabled || typeof window === "undefined") return
      send(buildEventPayload(trackingId, name, properties ?? null), collectUrl)
    },
    [trackingId, collectUrl, disabled]
  )

  return (
    <VishlexContext.Provider value={{ trackEvent }}>
      <Suspense fallback={null}>
        <TrackerInner
          trackingId={trackingId}
          collectUrl={collectUrl}
          disabled={disabled}
        />
      </Suspense>
      {children}
    </VishlexContext.Provider>
  )
}

// ── Zero-config provider — reads env vars automatically ──────────────────────
// Drop this directly in layout.tsx. No wrapper needed.
// Required env vars in the consumer app's .env.local:
//   NEXT_PUBLIC_VISHLEX_TRACKING_ID=your-tracking-id
//   NEXT_PUBLIC_VISHLEX_COLLECT_URL=https://your-dashboard.com/api/collect

type AutoProps = {
  disabled?: boolean
  children:  ReactNode
}

export function VishProvider({ disabled = false, children }: AutoProps) {
  const trackingId = process.env.NEXT_PUBLIC_VISHLEX_TRACKING_ID
  const collectUrl = process.env.NEXT_PUBLIC_VISHLEX_COLLECT_URL

  if (!trackingId || !collectUrl) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Vishlex] Missing env vars.\n" +
        "Add to .env.local:\n" +
        "  NEXT_PUBLIC_VISHLEX_TRACKING_ID=...\n" +
        "  NEXT_PUBLIC_VISHLEX_COLLECT_URL=..."
      )
    }
    // Still render children — never break the app
    return <>{children}</>
  }

  return (
    <VishlexProvider
      trackingId={trackingId}
      collectUrl={collectUrl}
      disabled={disabled}
    >
      {children}
    </VishlexProvider>
  )
}