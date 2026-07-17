import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { post } from "@/shared/api/methods"
import { queryKeys } from "@/shared/api/query-keys"
import type { ApiResponse } from "@/shared/types/api/api.types"
import type { GoogleLoginDTO, GoogleLoginResponseDTO } from "../types/login.dto"

export const useGoogleAuth = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (body: GoogleLoginDTO) => {
      const res = await post<ApiResponse<GoogleLoginResponseDTO>>("/auth/google-login", body)
      if (!res.success) {
        throw new Error("Google Login failed")
      }
      return res.data
    },
    onSuccess: (data) => {
      useAuthStore.getState().updateAccessToken(data.accessToken)
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all })
    },
  })
}
