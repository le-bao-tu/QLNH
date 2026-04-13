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
  TicketPercent,
  History,
  KeyRound,
  Shield,
} from 'lucide-react'
import { ROLE_LABEL, ROLE_MAP } from '@/common/constant'
import { useRestaurant, useRoles } from '@/hooks/useApi'
import { useToast } from '@/hooks/useToast'

// Menu items với phân quyền: roles = [] nghĩa là tất cả đều thấy
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'DASHBOARD' },
  { href: '/pos', label: 'POS - Bán hàng', icon: UtensilsCrossed, perm: 'POS' },
  { href: '/kitchen', label: 'Bếp (KDS)', icon: ChefHat, perm: 'KITCHEN' },
  { href: '/orders', label: 'Đơn hàng', icon: ShoppingCart, perm: 'ORDERS' },
  { href: '/tables', label: 'Quản lý bàn', icon: BookOpen, perm: 'TABLES' },
  { href: '/reservations', label: 'Đặt bàn', icon: CalendarDays, perm: 'RESERVATIONS' },
  { href: '/menu', label: 'Thực đơn', icon: BookOpen, perm: 'MENU' },
  { href: '/payments', label: 'Thanh toán', icon: CreditCard, perm: 'PAYMENTS' },
  { href: '/promotions', label: 'Khuyến mãi', icon: TicketPercent, perm: 'PROMOTIONS' },
  // { href: '/customers', label: 'Khách hàng', icon: Users, perm: 'CUSTOMERS' },
  // { href: '/employees', label: 'Nhân viên', icon: UserRoundCheck, perm: 'EMPLOYEES' },
  // { href: '/inventory', label: 'Kho hàng', icon: Package, perm: 'INVENTORY' },

  { href: '/accounts', label: 'Tài khoản', icon: KeyRound, perm: 'ACCOUNTS' },
  { href: '/roles', label: 'Phân quyền', icon: Shield, perm: 'ACCOUNTS' },
  { href: '/restaurants', label: 'Nhà hàng', icon: Building2, perm: 'RESTAURANTS' },
  { href: '/branches', label: 'Chi nhánh', icon: GitBranch, perm: 'BRANCHES' },
  { href: '/audit', label: 'Audit Log', icon: History, perm: 'AUDIT' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { success, error, info } = useToast()

  const { data: restaurant } = useRestaurant(user?.restaurantId as string)
  const { data: customRoles = [] } = useRoles(user?.restaurantId as string)

  const visibleItems = navItems.filter(item => {
    if (user?.isOwner) return true

    // Check custom roles
    const customRole = customRoles.find((r: any) => r.id === user?.roleId);
    if (customRole && item.perm) {
      if (customRole.permissions.includes(item.perm)) return true;
    }

    return false;
  })

  const handleLogout = async () => {
    try {
      await logout()
      info('Đã đăng xuất khỏi hệ thống')
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      error(axiosErr.response?.data?.message || 'Đăng xuất thất bại')
    }
  }

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
            src={restaurant?.logoUrl || '/logo.png'}
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
              {user.roleName || (user.isOwner ? "Chủ sở hữu" : "Người dùng")}
            </div>
          </div>
        )}
        <button
          onClick={() => handleLogout()}
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
