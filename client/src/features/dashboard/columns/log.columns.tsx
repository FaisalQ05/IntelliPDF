import type { LoginLog } from "@/features/auth/types/login-log.types"
import { type ColumnDef } from "@tanstack/react-table"
import { CheckCircle2, XCircle, Globe, Monitor, Mail } from "lucide-react"

export const logColumns: ColumnDef<LoginLog, unknown>[] = [
  {
    accessorKey: "email",
    header: "Account",
    cell: ({ getValue }) => {
      const email = getValue<string>()
      return (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          <span className="font-medium text-slate-700">{email}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "success",
    header: "Status",
    cell: ({ getValue }) => {
      const success = getValue<boolean>()
      return (
        <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
          success 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {success ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {success ? "Success" : "Failed"}
        </div>
      )
    },
  },
  {
    accessorKey: "provider",
    header: "Auth Method",
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
    accessorKey: "ipAddress",
    header: "IP / Location",
    cell: ({ getValue }) => {
      const ip = getValue<string>()
      const isLocal = ip === "::1" || ip === "127.0.0.1"
      return (
        <div className="flex items-center gap-2 text-[13px] text-slate-600">
          {isLocal ? <Monitor className="h-3.5 w-3.5 text-slate-400" /> : <Globe className="h-3.5 w-3.5 text-slate-400" />}
          <span className="font-mono">{ip}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "loginAt",
    header: "Timestamp",
    cell: ({ getValue }) => {
      const value = getValue<string>()
      const date = new Date(value)
      return (
        <div className="flex flex-col">
          <span className="text-[13px] text-slate-700">
            {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="text-[11px] text-slate-400">
            {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      )
    },
  },
]
