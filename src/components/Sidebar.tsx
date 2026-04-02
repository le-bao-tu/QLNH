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
  Settings,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pos', label: 'POS - Bán hàng', icon: UtensilsCrossed },
  { href: '/kitchen', label: 'Bếp (KDS)', icon: ChefHat },
  { href: '/reservations', label: 'Đặt bàn', icon: CalendarDays },
  // { href: '/customers', label: 'Khách hàng', icon: Users },
  // { href: '/employees', label: 'Nhân viên', icon: UserRoundCheck },
  // { href: '/inventory', label: 'Kho hàng', icon: Package },
  { href: '/promotions', label: 'Khuyến mãi', icon: TicketPercent },
  { href: '/orders', label: 'Đơn hàng', icon: ShoppingCart },
  { href: '/payments', label: 'Thanh toán', icon: CreditCard },
  { href: '/tables', label: 'Quản lý bàn', icon: BookOpen },
  { href: '/menu', label: 'Thực đơn', icon: BookOpen },
  { href: '/restaurants', label: 'Nhà hàng', icon: Building2 },
  { href: '/branches', label: 'Chi nhánh', icon: GitBranch },
  { href: '/audit', label: 'Audit Log', icon: History },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <div className="sidebar">
      {/* Logo Pfxsoft - Final horizontal big version */}
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
              // Subtle zoom to clear some of the white padding in source
              transform: 'scale(1.7)',
              transition: 'transform 0.3s ease'
            }} 
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navItems.map((item) => {
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

      {/* User info */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '12px 8px' }}>
        {user && (
          <div style={{ padding: '8px 16px', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user.fullName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{user.role}</div>
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
