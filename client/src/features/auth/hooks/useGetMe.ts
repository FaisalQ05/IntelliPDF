import { useQuery } from "@tanstack/react-query"
import { get } from "@/shared/api/methods"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { queryKeys } from "@/shared/api/query-keys"
import type { ApiResponse } from "@/shared/types/api/api.types"
import type { GetMeResponseDTO } from "../types/login.dto"

export const useGetMe = () => {
  const token = useAuthStore((state) => state.token)

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const res = await get<ApiResponse<GetMeResponseDTO>>("/auth/me")
      if (!res.success) {
        throw new Error(res.message)
      }
      return res.data
    },
    enabled: !!token,
    retry: false,
  })
}
