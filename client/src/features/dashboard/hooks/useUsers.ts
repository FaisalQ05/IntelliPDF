import { useQuery } from "@tanstack/react-query"
import { get } from "@/shared/api/methods"
import { queryKeys } from "@/shared/api/query-keys"
import type { ApiResponse } from "@/shared/types/api/api.types"
import type { User } from "@/features/auth/types/user.types"

export const useGetUsers = () => {
  const { data, ...rest } = useQuery({
    queryKey: queryKeys.dashboard.users(),
    queryFn: async () => {
      const res = await get<ApiResponse<User[]>>("/users")
      if (!res.success) {
        throw new Error(res.message)
      }
      return res.data
    },
  })

  return {
    ...rest,
    users: data ?? [],
  }
}
