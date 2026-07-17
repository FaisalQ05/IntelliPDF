import { useState, useRef, useEffect } from "react"
import { NavLink } from "react-router-dom"
import { useGetMe } from "@/features/auth/hooks/useGetMe"
import { useLogout } from "@/features/auth/hooks/useLogout"
import { FileText, LogOut, User, ChevronDown, Sparkles, Bell } from "lucide-react"
import { getInitials } from "@/shared/utils/getInitials"
import { NAV_ITEMS } from "@/shared/config/navigation"

export function Navbar() {
  const { data: user } = useGetMe()
  const { mutateAsync, isPending } = useLogout()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const initials = getInitials(user?.name)
  const role = user?.role

  const items = NAV_ITEMS.filter((item) =>
    role ? item.roles.includes(role) : false
  )

  const handleLogout = async () => {
    try {
      await mutateAsync()
    } catch {
      // logout is handled in useLogout onSuccess; swallow network errors
    }
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <header className="sticky top-0 z-50 h-16 ipdf-glass border-b border-zinc-200/60 shadow-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">

        {/* ── Logo ─────────────────────────────── */}
        <div className="flex items-center gap-8 ipdf-animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl ipdf-brand-gradient shadow-md ipdf-logo-glow">
              <FileText className="h-4.5 w-4.5 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[17px] font-bold tracking-tight text-zinc-900">
                Intelli
              </span>
              <span className="text-[17px] font-bold tracking-tight ipdf-brand-gradient-text">
                PDF
              </span>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border border-indigo-200/50 bg-indigo-50/50 px-2.5 py-0.5 sm:flex">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              <span className="text-[11px] font-semibold tracking-wide text-indigo-600 uppercase">AI</span>
            </div>
          </div>

          {/* ── Navigation Links ───────────────── */}
          <nav className="hidden md:flex items-center gap-1.5">
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                className={({ isActive }) =>
                  `relative px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "text-indigo-600 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-100/50"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ── Right actions ────────────────────── */}
        <div className="flex items-center gap-3 ipdf-animate-fade-in">

          {/* Notification bell */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100/50 hover:text-zinc-600">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white" />
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="navbar-user-menu"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-1.5 transition-all hover:border-zinc-200/60 hover:bg-zinc-50"
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full ipdf-brand-gradient text-[12px] font-bold text-white shadow-sm ring-2 ring-white">
                {initials}
              </div>

              <div className="hidden flex-col items-start sm:flex">
                <span className="text-[13px] font-semibold leading-tight text-zinc-900">
                  {user?.name ?? "User"}
                </span>
                <span className="text-[11px] font-medium text-zinc-500 leading-tight">
                  {user?.role ?? "Member"}
                </span>
              </div>

              <ChevronDown
                className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div className="ipdf-animate-slide-down absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-zinc-200/40 ring-1 ring-zinc-900/5">
                {/* User info header */}
                <div className="border-b border-zinc-100/80 px-4 py-4 bg-zinc-50/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full ipdf-brand-gradient text-[13px] font-bold text-white shadow-sm">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">{user?.name}</p>
                      <p className="truncate text-xs text-zinc-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-full bg-indigo-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600 border border-indigo-100/50 uppercase tracking-wide">
                      {user?.role ?? "member"}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium capitalize">{user?.provider}</span>
                  </div>
                </div>

                {/* Mobile Menu items (Visible only on mobile) */}
                <div className="p-2 border-b border-zinc-100/80 md:hidden">
                  <div className="px-2 pb-1 pt-1 text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                    Navigation
                  </div>
                  {items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/dashboard"}
                      onClick={() => setDropdownOpen(false)}
                      className={({ isActive }) =>
                        `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all ${
                          isActive ? "text-indigo-600 bg-indigo-50/80 font-medium shadow-sm ring-1 ring-indigo-100/50" : "text-zinc-700 hover:bg-zinc-50"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900">
                    <User className="h-4 w-4 text-zinc-400" />
                    Profile settings
                  </button>

                  <div className="my-1 border-t border-zinc-100/80" />

                  <button
                    id="navbar-logout-btn"
                    onClick={handleLogout}
                    disabled={isPending}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {isPending ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
