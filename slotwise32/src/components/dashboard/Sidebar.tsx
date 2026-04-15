'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Link2, Settings, LogOut, CalendarDays } from 'lucide-react'

interface SidebarProps {
  user: { full_name?: string; role?: string; organisations?: { name: string } } | null
}

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/links', label: 'Booking links', icon: Link2 },
  { href: '/dashboard/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="w-60 flex flex-col bg-zinc-950 border-r border-zinc-800 shrink-0">
      <div className="h-16 flex items-center px-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black text-sm font-bold shrink-0">S</div>
          <span className="font-semibold text-sm text-white truncate">
            {user?.organisations?.name ?? 'SlotWise'}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'
              }`}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-zinc-800 pt-3">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-300 shrink-0">
            {user?.full_name?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name ?? 'User'}</p>
            <p className="text-xs text-zinc-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={signOut}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 rounded-lg transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  )
}
