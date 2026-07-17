// useToast.ts
import { useContext } from "react"
import { ToastContext } from "@/components/toast/toast.context"

export const useToast = () => {
  const ctx = useContext(ToastContext)

  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider")
  }

  return ctx
}
