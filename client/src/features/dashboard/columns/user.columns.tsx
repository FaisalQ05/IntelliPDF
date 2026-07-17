import type { User } from "@/features/auth/types/user.types"
import { type ColumnDef } from "@tanstack/react-table"
import { Mail, User as UserIcon, Shield, Server } from "lucide-react"
import { getInitials } from "@/shared/utils/getInitials"

export const userColumns: ColumnDef<User, unknown>[] = [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
      const name = row.original.name
      const email = row.original.email
      const initials = getInitials(name)
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-[12px] font-bold text-indigo-700">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900">{name}</span>
            <span className="flex items-center gap-1 text-[12px] text-slate-500">
              <Mail className="h-3 w-3" /> {email}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => {
      const role = getValue<string>()
      const isAdmin = role === "ADMIN"
      const isManager = role === "MANAGER"
      
      let badgeClass = "bg-slate-50 text-slate-600 border-slate-200"
      let Icon = UserIcon
      
      if (isAdmin) {
        badgeClass = "bg-purple-50 text-purple-700 border-purple-200"
        Icon = Shield
      } else if (isManager) {
        badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200"
        Icon = Server
      }

      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${badgeClass}`}>
          <Icon className="h-3.5 w-3.5" />
          {role}
        </div>
      )
    },
  },
  {
    accessorKey: "provider",
    header: "Provider",
    cell: ({ getValue }) => {
      const provider = getValue<string>()
      const isGoogle = provider === "GOOGLE"
      
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium ${isGoogle ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"}`}>
          {provider}
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ getValue }) => {
      const value = getValue<string>()
      return (
        <span className="text-[13px] text-slate-600">
          {new Date(value).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      )
    },
  },
]
