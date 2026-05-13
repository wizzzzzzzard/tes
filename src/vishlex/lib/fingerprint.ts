// sdk/src/lib/fingerprint.ts

// Cached so getVisitorHash() and getSessionHash() don't recompute
// on every call within the same page load.
let _visitorHash: string | null = null
let _sessionHash: string | null = null

export function getVisitorHash(): string {
  if (_visitorHash) return _visitorHash

  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? "",
  ].join("|")

  _visitorHash = hashString(raw)
  return _visitorHash
}

export function getSessionHash(): string {
  if (_sessionHash) return _sessionHash

  // Try to reuse session from sessionStorage so it survives
  // soft navigations and doesn't reset mid-session.
  const STORAGE_KEY = "vsh_session"
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      _sessionHash = stored
      return _sessionHash
    }
  } catch {
    // sessionStorage blocked (e.g. private mode on some browsers) — fall through
  }

  // New session: hash visitorHash + timestamp bucket (30-min windows)
  const bucket = Math.floor(Date.now() / (1000 * 60 * 30))
  _sessionHash = hashString(getVisitorHash() + "|" + bucket)

  try {
    sessionStorage.setItem(STORAGE_KEY, _sessionHash)
  } catch {
    // ignore
  }

  return _sessionHash
}

function hashString(str: string): string {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash.toString(16).padStart(8, "0")
}