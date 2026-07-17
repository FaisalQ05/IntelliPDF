import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { post } from "@/shared/api/methods"
import { queryKeys } from "@/shared/api/query-keys"
import type { ApiResponse } from "@/shared/types/api/api.types"
import type { LoginDTO, LoginResponseDTO } from "../types/login.dto"

export const useLogin = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (body: LoginDTO) => {
      const res = await post<ApiResponse<LoginResponseDTO>>("/auth/local-login", body)
      if (!res.success) {
        throw new Error("Login failed")
      }
      return res.data
    },
    onSuccess: (data) => {
      useAuthStore.getState().updateAccessToken(data.accessToken)
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
    },
  })
}
