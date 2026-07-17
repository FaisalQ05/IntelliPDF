import { NavLink } from "react-router-dom"
import { LayoutDashboard } from "lucide-react"

import { useGetMe } from "@/features/auth/hooks/useGetMe"
import { NAV_ITEMS } from "@/shared/config/navigation"

import { UserCard } from "@/features/auth/components/UserCard"
import { LogoutButton } from "@/features/auth/components/LogoutButton"

export function Sidebar() {
  const { data: user } = useGetMe()
  const role = user?.role

  const items = NAV_ITEMS.filter((item) =>
    role ? item.roles.includes(role) : false
  )

  return (
    <>
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-40 flex h-screen w-80 flex-col border-r border-zinc-200/60 bg-zinc-50/95 backdrop-blur-xl">
        {/* Brand */}
        <div className="border-b border-zinc-200/60 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 shadow-md">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-zinc-900">
                Dashboard
              </h1>

              <p className="mt-1 text-[11px] font-semibold tracking-[0.18em] text-zinc-500 uppercase">
                {role ?? "Portal"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Header */}
        <div className="px-4 pt-6 pb-2">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-zinc-400 uppercase">
            Navigation
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 pb-6">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:bg-white hover:text-zinc-900 hover:shadow-sm"
                } `
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute top-2 bottom-2 left-0 w-1 rounded-r-full bg-zinc-900" />
                  )}

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-base transition-colors group-hover:bg-zinc-200">
                    {item.icon || "📄"}
                  </span>

                  <span className="flex-1">{item.label}</span>

                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-zinc-900" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-zinc-200/60 bg-white/60 p-5 backdrop-blur">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <UserCard />
          </div>

          <div className="mt-4">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Spacer */}
      <div className="w-80 shrink-0" />
    </>
  )
}
