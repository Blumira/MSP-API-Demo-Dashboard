import { Suspense } from "react"
import { Dashboard } from "@/components/dashboard"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Blumira Security Dashboard</h1>
          <p className="text-slate-600 text-lg">Monitor and manage security findings across your MSP accounts</p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </div>
    </div>
  )
}
