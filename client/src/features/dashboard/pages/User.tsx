import UserTable from "@/features/dashboard/components/UserTable"
import { Users } from "lucide-react"

const User = () => {
  return (
    <div className="space-y-6 ipdf-animate-slide-up">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
            <Users className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
        </div>
        <p className="text-[14px] text-slate-500">
          Manage all registered users, their roles, and access levels across the platform.
        </p>
      </div>

      <div className="ipdf-animate-slide-up ipdf-delay-100">
        <UserTable />
      </div>
    </div>
  )
}

export default User
