import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  token: string | null
  initialized: boolean
  setInitialized: (value: boolean) => void
  updateAccessToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      initialized: false,

      setInitialized: (value) =>
        set({
          initialized: value,
        }),

      logout: () =>
        set({
          token: null,
          initialized: false,
        }),

      updateAccessToken: (token) =>
        set({
          token,
        }),
    }),
    {
      name: "auth-store",
      // `initialized` is a transient runtime flag — it should always reset to
      // false on a fresh page load, so we exclude it from localStorage.
      partialize: (state) => ({ token: state.token }),
    }
  )
)
