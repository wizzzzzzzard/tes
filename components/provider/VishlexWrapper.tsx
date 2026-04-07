"use client"
import { VishlexProvider } from "vishlex/next"

export default function VishlexWrapper({ children }: { children: React.ReactNode }) {
  console.log("COLLECT URL:", process.env.NEXT_PUBLIC_COLLECT_URL)

  return (
    <VishlexProvider
      trackingId={process.env.VISHLEX_API_KEY!}
      collectUrl={process.env.NEXT_PUBLIC_COLLECT_URL!}
    >
      {children}
    </VishlexProvider>
  )
}