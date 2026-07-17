import type { Role } from "@/features/auth/types/user.types"

export type NavItem = {
  label: string
  path: string
  roles: Role[]
  icon?: string
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    roles: ["ADMIN", "MANAGER", "USER"],
  },
  {
    label: "Users",
    path: "/dashboard/users",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Logs",
    path: "/dashboard/logs",
    roles: ["ADMIN"],
  },
  {
    label: "PDF Chat",
    path: "/dashboard/pdf-chat",
    roles: ["ADMIN", "MANAGER", "USER"],
    icon: "💬",
  },
]
