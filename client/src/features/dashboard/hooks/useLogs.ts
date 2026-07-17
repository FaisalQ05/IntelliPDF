import { useQuery } from "@tanstack/react-query"
import { get } from "@/shared/api/methods"
import { queryKeys } from "@/shared/api/query-keys"
import type { ApiResponse } from "@/shared/types/api/api.types"
import type { LoginLog } from "@/features/auth/types/login-log.types"

export const useLoginLogs = () => {
  const { data, ...rest } = useQuery({
    queryKey: queryKeys.dashboard.logs(),
    queryFn: async () => {
      const res = await get<ApiResponse<LoginLog[]>>("/audit/login-logs")
      if (!res.success) {
        throw new Error(res.message)
      }
      return res.data
    },
  })

  return {
    ...rest,
    logs: data ?? [],
  }
}
