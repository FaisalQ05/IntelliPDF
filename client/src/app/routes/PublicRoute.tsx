import { Navigate, Outlet } from "react-router-dom"
import { useGetMe } from "@/features/auth/hooks/useGetMe"

export const PublicRoute = () => {
  const { data: user } = useGetMe()

  if (user?.role) {
    return <Navigate replace to={"/dashboard"} />
  }

  return <Outlet />
}
