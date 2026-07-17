import { useLogout } from "@/features/auth/hooks/useLogout"

type LogoutButtonProps = {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const { mutateAsync, isPending } = useLogout()

  const handleLogout = async () => {
    try {
      await mutateAsync()
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className={`w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100 hover:text-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className} `}
    >
      {isPending ? "Signing out..." : "Logout"}
    </button>
  )
}

