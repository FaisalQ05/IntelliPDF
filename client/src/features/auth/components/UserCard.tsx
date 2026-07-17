import { useGetMe } from "@/features/auth/hooks/useGetMe";
import { getInitials } from "@/shared/utils/getInitials";

export function UserCard() {
  const { data: user } = useGetMe();

  if (!user) return null;

  const initials = getInitials(user.name);


  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
        {initials}
      </div>

      {/* User Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-zinc-900">
          {user.name}
        </h3>

        <p className="truncate text-xs text-zinc-500">{user.email}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[11px] font-medium tracking-wide text-zinc-700 uppercase">
            {user.role}
          </span>

          <span className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
            {user.provider}
          </span>
        </div>
      </div>
    </div>
  );
}
