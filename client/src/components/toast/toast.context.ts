import { createContext } from "react"
import type { Toast } from "@/shared/types/toast.types"

export type ToastContextType = {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const ToastContext = createContext<ToastContextType | null>(null)
