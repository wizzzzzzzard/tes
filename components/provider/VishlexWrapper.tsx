"use client"
import { VishlexProvider } from "vishlex/next"

export default function VishlexWrapper({ children }: { children: React.ReactNode }) {
  console.log("COLLECT URL:", process.env.NEXT_PUBLIC_COLLECT_URL)

  return (
    <VishlexProvider
      trackingId="cmncytit40003i1l4sw9cqfh4"
      collectUrl={process.env.NEXT_PUBLIC_COLLECT_URL!}
    >
      {children}
    </VishlexProvider>
  )
}