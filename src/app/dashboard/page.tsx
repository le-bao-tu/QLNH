'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useAuth } from '@/lib/auth'
import { 
  useActiveOrders, 
  useTables, 
  useRecentPayments, 
  useReservations,
  useInventoryItems,
  usePromotions
} from '@/hooks/useApi'
import {
  ShoppingCart, 
  Users, 
  CreditCard, 
  TrendingUp,
  Clock, 
  CheckCircle, 
  UtensilsCrossed, 
  AlertCircle,
  CalendarDays,
  Package,
  TicketPercent,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'


interface Order {
  id: string
  tableNumber: number
  status: string
  totalAmount: number
  itemCount: number
  createdAt: string
}

interface Table {
  id: string
  tableNumber: number
  status: string
  capacity: number
}

interface Payment {
  id: string
  finalAmount: number
}

interface Reservation {
  id: string
  status: string
}

interface InventoryItem {
  id: string
  isLowStock: boolean
}

export default function DashboardPage() {
  const { user } = useAuth()
  const branchId = user?.branchId || ''
  const restaurantId = user?.restaurantId || ''

  const [mounted, setMounted] = useState(false)
  const [currentDateStr, setCurrentDateStr] = useState('')
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    setMounted(true)
    setCurrentDateStr(new Date().toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }))
  }, [])

  const { data: activeOrders = [] } = useActiveOrders(branchId)
  const { data: tables = [] } = useTables(branchId)
  const { data: payments = [] } = useRecentPayments(branchId)
  const { data: reservations = [] } = useReservations(branchId, today)
  const { data: inventoryItems = [] } = useInventoryItems(branchId)
  const { data: promotions = [] } = usePromotions(restaurantId)

  const occupiedTables = tables.filter((t: Table) => t.status === 'occupied').length
  const todayRevenue = payments.reduce((sum: number, p: Payment) => sum + p.finalAmount, 0)
  const lowStockCount = inventoryItems.filter((i: InventoryItem) => i.isLowStock).length
  const todayReservations = reservations.filter((r: Reservation) => r.status !== 'cancelled').length

  const stats = [
    {
      label: 'Doanh thu hôm nay',
      value: `${todayRevenue.toLocaleString('vi-VN')}đ`,
      icon: CreditCard,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/payments'
    },
    {
      label: 'Bàn đang dùng',
      value: `${occupiedTables}/${tables.length}`,
      icon: UtensilsCrossed,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/tables'
    },
    {
      label: 'Đặt bàn hôm nay',
      value: todayReservations,
      icon: CalendarDays,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/reservations'
    },
    {
      label: 'Sắp hết hàng',
      value: lowStockCount,
      icon: Package,
      color: lowStockCount > 0 ? 'text-red-600' : 'text-gray-400',
      bg: lowStockCount > 0 ? 'bg-red-50' : 'bg-gray-50',
      href: '/inventory'
    },
  ]

  return (
    <AuthLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Xin chào, {user?.fullName || 'Nhân viên'} 👋
            </h1>
            <p className="text-gray-500 font-medium h-6">
              {mounted ? `Hôm nay là ${currentDateStr}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pos" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
              <ShoppingCart size={20} />
              Bán hàng ngay
            </Link>
          </div>
        </div>

        {/* Highlight Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <Link key={i} href={stat.href} className="group bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
               <div className="flex justify-between items-start mb-4">
                 <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center p-3 transition-transform group-hover:scale-110`}>
                   <stat.icon size={28} />
                 </div>
                 <ArrowUpRight size={20} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
               </div>
               <div>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                 <p className="text-3xl font-black text-gray-900 tracking-tighter">{stat.value}</p>
               </div>
               {/* Subtle background pattern */}
               <stat.icon size={120} className={`absolute -right-8 -bottom-8 opacity-[0.03] ${stat.color} rotate-12`} />
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Orders Section */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Đơn hàng đang xử lý</h2>
              </div>
              <Link href="/orders" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                Tất cả <ChevronRight size={16} />
              </Link>
            </div>
            <div className="p-6 flex-1">
              {activeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 opacity-30">
                  <CheckCircle size={64} className="mb-4 text-green-500" />
                  <p className="font-bold text-lg">Hệ thống đã dọn dẹp xong!</p>
                  <p className="text-sm">Không còn đơn hàng chờ xử lý.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeOrders.slice(0, 5).map((order: Order) => (
                    <div key={order.id} className="flex items-center justify-between p-5 bg-gray-50/50 hover:bg-blue-50/30 rounded-3xl transition-colors border border-transparent hover:border-blue-100">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                          <span className="text-[10px] font-black uppercase text-gray-400">BÀN</span>
                          <span className="text-xl font-black text-blue-600 leading-none">{order.tableNumber}</span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Bàn {order.tableNumber}</p>
                          <p className="text-xs text-gray-400 font-medium">
                            {order.itemCount} món · {mounted ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          order.status === 'preparing' ? 'bg-orange-100 text-orange-600' : 
                          order.status === 'ready' ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {order.status === 'preparing' ? 'Đang chế biến' : order.status === 'ready' ? 'Đã xong' : 'Chờ xử lý'}
                        </span>
                        <p className="text-lg font-black text-gray-900 mt-1">{order.totalAmount.toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Mini Tables & Quick Links */}
          <div className="space-y-8">
            {/* Table Map Mini */}
            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold tracking-tight text-lg">Sơ đồ bàn nhanh</h3>
                <Link href="/tables" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {tables.slice(0, 12).map((table: Table) => (
                  <div 
                    key={table.id}
                    className={`aspect-square rounded-xl flex items-center justify-center font-black text-lg transition-all ${
                      table.status === 'occupied' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 
                      table.status === 'reserved' ? 'bg-yellow-500 text-white' : 
                      'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}
                  >
                    {table.tableNumber}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-800 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-500"></div>
                   <span className="text-[10px] uppercase font-bold text-gray-400">Đang dùng ({occupiedTables})</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                   <span className="text-[10px] uppercase font-bold text-gray-400">Bàn trống ({tables.length - occupiedTables})</span>
                </div>
              </div>
            </div>

            {/* Notifications / Alerts */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                    <AlertCircle size={20} />
                 </div>
                 <h3 className="font-bold text-lg text-gray-900">Cảnh báo vận hành</h3>
               </div>
               <div className="space-y-4 relative z-10">
                 {lowStockCount > 0 && (
                   <Link href="/inventory" className="block p-4 bg-red-50 rounded-2xl border border-red-100 hover:scale-[1.02] transition-transform">
                      <p className="text-red-700 font-bold text-sm">Kho hàng sắp hết!</p>
                      <p className="text-red-500 text-xs mt-1">Có {lowStockCount} nguyên liệu dưới mức tối thiểu cần nhập gấp.</p>
                   </Link>
                 )}
                 {todayReservations > 0 && (
                   <Link href="/reservations" className="block p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:scale-[1.02] transition-transform">
                      <p className="text-blue-700 font-bold text-sm">Lịch đặt bàn</p>
                      <p className="text-blue-500 text-xs mt-1">Hôm nay có {todayReservations} lượt đặt bàn cần chuẩn bị.</p>
                   </Link>
                 )}
                 {promotions.filter((p:any) => !p.isActive).length > 0 && (
                   <Link href="/promotions" className="block p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:scale-[1.02] transition-transform">
                      <p className="text-gray-700 font-bold text-sm">Khuyến mãi mới</p>
                      <p className="text-gray-500 text-xs mt-1">Có chương trình khuyến mãi chưa kích hoạt.</p>
                   </Link>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
