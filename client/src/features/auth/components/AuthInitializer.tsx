import { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { useGetMe } from "@/features/auth/hooks/useGetMe"

const AuthInitializer = () => {
  const token = useAuthStore((s) => s.token)
  const logout = useAuthStore((s) => s.logout)
  const setInitialized = useAuthStore((s) => s.setInitialized)
  const initialized = useAuthStore((s) => s.initialized)

  const { isFetching, isError, isSuccess, error } = useGetMe()

  useEffect(() => {
    if (!token) {
      setInitialized(true)
      return
    }

    if (isSuccess) {
      setInitialized(true)
    }

    if (isError) {
      console.error(error)
      logout()
      setInitialized(true)
    }
  }, [token, isSuccess, isError, error, logout, setInitialized])

  if (!initialized || isFetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-sm text-gray-500 font-medium">Loading session...</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}

export default AuthInitializer
