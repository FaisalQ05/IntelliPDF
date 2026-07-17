import { useAuthStore } from "@/features/auth/store/auth.store"
import { useEffect, useState, type ReactNode } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // set initial state immediately
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(useAuthStore.persist.hasHydrated())

    // subscribe to future hydration (safe)
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })

    return unsub
  }, [])

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  return <>{children}</>
}
