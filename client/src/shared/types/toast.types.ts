export type ToastType = "success" | "error" | "info" | "warning"

export type Toast = {
  id: string
  type: ToastType
  title?: string
  message: string
  duration?: number
}
