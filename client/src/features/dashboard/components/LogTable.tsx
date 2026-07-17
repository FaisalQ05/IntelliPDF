import { DataTable } from "@/components/table/DataTable"
import { useLoginLogs } from "../hooks/useLogs"
import type { LoginLog } from "@/features/auth/types/login-log.types"
import { logColumns } from "../columns/log.columns"

const LogTable = () => {
  const { logs, isLoading } = useLoginLogs()

  return (
    <DataTable<LoginLog>
      data={logs}
      columns={logColumns}
      isLoading={isLoading}
      emptyMessage="No security logs"
      emptySubtext="No authentication events have been recorded yet."
    />
  )
}

export default LogTable
