import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { useToast } from "@/shared/hooks/useToast"

const KeycloakCallback = () => {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.updateAccessToken)
  const { addToast } = useToast()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get("accessToken")
    console.log("accessToken", { accessToken })
    const error = params.get("error")

    if (error || !accessToken) {
      addToast({ type: "error", message: "Keycloak login failed" })
      navigate("/login", { replace: true })
      return
    }

    // Strip token from URL before doing anything
    window.history.replaceState({}, "", "/auth/keycloak/callback")

    // This triggers AuthInitializer's useEffect → calls /me → sets user
    setToken(accessToken)

    addToast({ type: "success", message: "Login successful" })
    navigate("/dashboard", { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="animate-pulse text-muted-foreground">Completing login...</p>
    </div>
  )
}

export default KeycloakCallback
