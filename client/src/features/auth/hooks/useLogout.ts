import { useMutation, useQueryClient } from "@tanstack/react-query"
import { post } from "@/shared/api/methods"
import { useAuthStore } from "@/features/auth/store/auth.store"
import type { ApiResponse } from "@/shared/types/api/api.types"
import type { LogoutResponseDTO } from "../types/logout.dto"

export const useLogout = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      const res = await post<ApiResponse<LogoutResponseDTO>>("/auth/logout")
      if (!res.success) {
        throw new Error("Logout failed")
      }
      return res.data
    },
    onSuccess: () => {
      useAuthStore.getState().logout()
      queryClient.clear()
    },
  })
}
