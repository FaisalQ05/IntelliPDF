import { useGetMe } from "@/features/auth/hooks/useGetMe"
import type { Role } from "@/features/auth/types/user.types"
import { Navigate, Outlet } from "react-router-dom"

export function RoleRoute({ allowed }: { allowed: Role[] }) {
  const { data: user } = useGetMe()

  if (!user) return <Navigate to="/login" replace />

  if (!allowed.includes(user.role as Role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
