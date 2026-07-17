import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { post } from "@/shared/api/methods"
import { queryKeys } from "@/shared/api/query-keys"
import type { ApiResponse } from "@/shared/types/api/api.types"
import type { SignupDTO, SignupResponseDTO } from "../types/login.dto"

export const useSignup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (body: SignupDTO) => {
      // Assuming typical endpoint /auth/local-signup
      const res = await post<ApiResponse<SignupResponseDTO>>("/auth/local-signup", body)
      if (!res.success) {
        throw new Error(res.message || "Signup failed")
      }
      return res.data
    },
    onSuccess: (data) => {
      // If backend logs in immediately, update token
      if (data?.accessToken) {
        useAuthStore.getState().updateAccessToken(data.accessToken)
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
      }
    },
  })
}
