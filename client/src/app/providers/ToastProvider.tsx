import { useState } from "react"
import type { Toast } from "@/shared/types/toast.types"
import { ToastContext } from "@/components/toast/toast.context"

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID()

    setToasts((prev) => [
      ...prev,
      {
        id,
        duration: 3000,
        ...toast,
      },
    ])

    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id)
      }, toast.duration ?? 3000)
    }
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const clearToasts = () => setToasts([])

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, clearToasts }}
    >
      {children}
    </ToastContext.Provider>
  )
}
