import { Outlet } from "react-router-dom"
import { Navbar } from "@/features/dashboard/layout/Navbar"
import { useDocumentUpdates } from "@/features/pdf-chat/hooks/useDocumentUpdates"

export function DashboardLayout() {
  useDocumentUpdates();
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Subtle background dot grid for a premium SaaS feel */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.2]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--color-neutral-300) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Top subtle glow */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-6 py-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

