import LogTable from "@/features/dashboard/components/LogTable"
import { ShieldCheck } from "lucide-react"

const Logs = () => {
  return (
    <div className="space-y-6 ipdf-animate-slide-up">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security Logs</h1>
        </div>
        <p className="text-[14px] text-slate-500">
          Review system access logs, authentication events, and security audits.
        </p>
      </div>

      <div className="ipdf-animate-slide-up ipdf-delay-100">
        <LogTable />
      </div>
    </div>
  )
}

export default Logs
