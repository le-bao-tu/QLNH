'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import {
  LayoutDashboard,
  UtensilsCrossed,
  BookOpen,
  ShoppingCart,
  CreditCard,
  ChefHat,
  Building2,
  GitBranch,
  LogOut,
  CalendarDays,
  Users,
  UserRoundCheck,
  Package,
  TicketPercent,
  History,
  KeyRound,
} from 'lucide-react'

// Menu items với phân quyền: roles = [] nghĩa là tất cả đều thấy
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [] },
  { href: '/pos', label: 'POS - Bán hàng', icon: UtensilsCrossed, roles: [] },
  { href: '/kitchen', label: 'Bếp (KDS)', icon: ChefHat, roles: [] },
  { href: '/orders', label: 'Đơn hàng', icon: ShoppingCart, roles: [] },
  { href: '/tables', label: 'Quản lý bàn', icon: BookOpen, roles: [] },
  { href: '/reservations', label: 'Đặt bàn', icon: CalendarDays, roles: [] },
  { href: '/menu', label: 'Thực đơn', icon: BookOpen, roles: ['owner'] },
  { href: '/payments', label: 'Thanh toán', icon: CreditCard, roles: ['owner', 'manager', 'cashier'] },
  { href: '/promotions', label: 'Khuyến mãi', icon: TicketPercent, roles: ['owner'] },
  // { href: '/customers', label: 'Khách hàng', icon: Users, roles: ['owner', 'manager', 'cashier'] },
  // { href: '/employees', label: 'Nhân viên', icon: UserRoundCheck, roles: ['owner', 'manager'] },
  // { href: '/inventory', label: 'Kho hàng', icon: Package, roles: ['owner', 'manager'] },

  // Owner only
  { href: '/accounts', label: 'Tài khoản', icon: KeyRound, roles: ['owner', 'manager'] },
  { href: '/restaurants', label: 'Nhà hàng', icon: Building2, roles: ['owner'] },
  { href: '/branches', label: 'Chi nhánh', icon: GitBranch, roles: ['owner', 'manager'] },
  { href: '/audit', label: 'Audit Log', icon: History, roles: ['owner'] },
]

const ROLE_LABEL: Record<string, string> = {
  owner: 'Chủ sở hữu',
  Owner: 'Chủ sở hữu',
  manager: 'Quản lý',
  cashier: 'Thu ngân',
  waiter: 'Phục vụ',
  chef: 'Bếp trưởng',
  bartender: 'Pha chế',
}

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const visibleItems = navItems.filter(item => {
    if (item.roles.length === 0) return true;
    const userRole = (user?.role || '').toLowerCase();
    return item.roles.some(r => r.toLowerCase() === userRole);
  })

  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Link href="/dashboard" style={{
          background: 'white',
          height: '75px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          padding: '0',
          overflow: 'hidden',
          cursor: 'pointer',
          textDecoration: 'none'
        }}>
          <img
            src="/logo.png"
            alt="Pfxsoft Logo"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '110px',
              objectFit: 'contain',
              transform: 'scale(1.7)',
              transition: 'transform 0.3s ease'
            }}
          />
        </Link>
      </div>

      {/* Navigation - phân quyền theo role */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="sidebar-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info & Logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 8px' }}>
        {user && (
          <div style={{ padding: '8px 16px', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.fullName}
            </div>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.5)',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 6, padding: '2px 6px', display: 'inline-block', marginTop: 2
            }}>
              {ROLE_LABEL[user.role] || user.role}
            </div>
          </div>
        )}
        <button
          onClick={() => logout()}
          className="sidebar-nav-item"
          style={{ width: '100%', background: 'none', cursor: 'pointer' }}
        >
          <LogOut size={18} />
          <span className="sidebar-label">Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
