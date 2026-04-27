'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useAuth } from '@/lib/auth'
import {
  useActiveOrders,
  useTables,
  useReservations,
  useInventoryItems,
  usePromotions,
  useRecentPayments,
  useDishSalesStats,
  useDashboardOverview,
  useHourlyStats,
  useCategoryRevenue
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
import { BranchSelector } from '@/components/BranchSelector'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts'

interface Payment {
  createdAt: string
  amount: number
}

interface Reservation {
  id: string
  status: string
  reservedAt: string
}

interface Table {
  id: string
  status: string
  tableNumber: number
}

interface InventoryItem {
  isLowStock: boolean
}

interface Promotion {
  isActive: boolean
}

interface DishSale {
  menuItemName: string
  totalRevenue: number
  totalQuantity: number
}

interface ActiveOrder {
  id: string
  tableNumber: number
  itemCount: number
  createdAt: string
  status: string
  totalAmount: number
}

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ xử lý', className: 'badge-pending' },
  preparing: { label: 'Đang làm', className: 'badge-cooking' },
  ready: { label: 'Sẵn sàng', className: 'badge-ready' },
  served: { label: 'Đã phục vụ', className: 'badge-served' },
  paid: { label: 'Đã thanh toán', className: 'badge-paid' },
  cancelled: { label: 'Đã hủy', className: 'badge-cancelled' },
}
export default function DashboardPage() {
  const { user, selectedBranchId } = useAuth()
  const restaurantId = user?.restaurantId || ''
  const isOwner = user?.isOwner
  const branchId = selectedBranchId || ''

  const workingId = isOwner && !branchId ? restaurantId : branchId
  const mode = isOwner && !branchId ? 'restaurant' : 'branch'

  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today')
  const [mounted, setMounted] = useState(false)
  const [currentDateStr, setCurrentDateStr] = useState('')

  useEffect(() => {
    setMounted(true)
    setCurrentDateStr(new Date().toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  }, [])

  const { data: overview } = useDashboardOverview(workingId, mode, filter)
  const { data: hourlyStats = [] } = useHourlyStats(workingId, mode, filter)
  const { data: categoryRevenue = [] } = useCategoryRevenue(workingId, mode, filter)

  const { data: activeOrders = [] } = useActiveOrders(workingId, mode) as {
    data?: ActiveOrder[]
  }
  const { data: tables = [] } = useTables(workingId, mode) as {
    data?: Table[]
  }
  const { data: inventoryItemsData } = useInventoryItems(workingId, mode, { pageSize: 1000 })
  const inventoryItems = inventoryItemsData?.items || (Array.isArray(inventoryItemsData) ? inventoryItemsData : [])
  const { data: promotions = [] } = usePromotions(restaurantId) as {
    data?: Promotion[]
  }

  const { data: dishSales = [] } = useDishSalesStats(workingId, filter, mode) as {
    data?: DishSale[]
  }

  const occupiedTables = overview?.occupiedTables ?? 0
  const totalTables = overview?.totalTables ?? 0
  const periodRevenue = overview?.totalRevenue ?? 0
  const avgOrderValue = overview?.averageOrderValue ?? 0
  const lowStockCount = overview?.lowStockCount ?? 0
  const periodReservations = overview?.reservationCount ?? 0

  const stats = [
    {
      label: `Doanh thu`,
      value: `${periodRevenue.toLocaleString('vi-VN')}đ`,
      subValue: `${(overview?.orderCount ?? 0)} đơn hàng`,
      icon: CreditCard,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '/payments'
    },
    {
      label: 'Giá trị TB / đơn',
      value: `${Math.round(avgOrderValue).toLocaleString('vi-VN')}đ`,
      subValue: 'Dựa trên đơn hoàn tất',
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      href: '/orders'
    },
    {
      label: 'Bàn đang dùng',
      value: `${occupiedTables}/${totalTables}`,
      subValue: `${Math.round((occupiedTables / (totalTables || 1)) * 100)}% công suất`,
      icon: UtensilsCrossed,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: '/tables'
    },
  ]

  return (
    <AuthLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Xin chào, {user?.fullName || 'Nhân viên'}
            </h1>
            <p className="text-gray-500 font-medium h-6">
              {mounted ? `Hôm nay là ${currentDateStr}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {

              isOwner && <BranchSelector />
            }
            <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setFilter('today')}
                className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${filter === 'today' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setFilter('week')}
                className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${filter === 'week' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
              >
                Tuần này
              </button>
              <button
                onClick={() => setFilter('month')}
                className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${filter === 'month' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
              >
                Tháng này
              </button>
            </div>
            <Link href="/pos" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-100 flex items-center gap-2">
              <ShoppingCart size={20} />
              Bán hàng
            </Link>
          </div>
        </div>

        {/* Highlight Stats (Row 1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <p className="text-xs font-bold text-gray-400 mt-1">{stat.subValue}</p>
              </div>
              <stat.icon size={120} className={`absolute -right-8 -bottom-8 opacity-[0.03] ${stat.color} rotate-12`} />
            </Link>
          ))}
        </div>

        {/* Charts Section (Row 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Hourly Stats Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                  {filter === 'today' ? 'Biến động doanh thu theo giờ' : filter === 'week' ? 'Doanh thu theo các thứ trong tuần' : 'Doanh thu theo ngày trong tháng'}
                </h2>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyStats}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(val) => val >= 1000000 ? `${val / 1000000}M` : val >= 1000 ? `${val / 1000}k` : val}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="orderCount" name="Đơn hàng" stroke="#10b981" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Revenue Pie Chart */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center">
                <Package size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Cơ cấu doanh thu theo danh mục</h2>
            </div>

            <div className="h-[300px] w-full flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryRevenue}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="categoryName"
                  >
                    {categoryRevenue.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={[
                        '#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'
                      ][index % 6]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[40%] space-y-4">
                {categoryRevenue.slice(0, 5).map((item: any, i: number) => (
                  <div key={i} className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'][i % 6] }}></div>
                      <span className="text-xs font-bold text-gray-900 truncate">{item.categoryName}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 ml-5">
                      {Math.round((item.revenue / (periodRevenue || 1)) * 100)}% · {item.revenue.toLocaleString()}đ
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Items & Tables (Row 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Thống kê món bán chạy</h2>
              </div>
              <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-3 py-1 rounded-lg">
                {filter === 'today' ? 'Hôm nay' : filter === 'week' ? 'Tuần này' : 'Tháng này'}
              </span>
            </div>
            <div className="p-6">
              {dishSales.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-300">
                  <UtensilsCrossed size={48} className="mb-2 opacity-20" />
                  <p className="font-bold text-sm">Chưa có dữ liệu bán hàng</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dishSales.slice(0, 10).map((sale: DishSale, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-transparent hover:border-purple-100 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-xs font-black text-purple-600 border border-gray-100">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{sale.menuItemName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{sale.totalRevenue.toLocaleString()}đ</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-gray-900 leading-none">{sale.totalQuantity}</p>
                        <p className="text-[9px] text-gray-400 font-black uppercase mt-1">Lượt mua</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-gray-200 h-fit">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold tracking-tight text-lg">Sơ đồ bàn nhanh</h3>
              <Link href="/tables" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {tables.slice(0, 12).map((table: Table) => (
                <div key={table.id} className={`aspect-square rounded-xl flex items-center justify-center font-black text-lg transition-all ${table.status === 'occupied' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : table.status === 'reserved' ? 'bg-yellow-500 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
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
        </div>

        {/* Active Orders & Alerts (Row 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  {activeOrders.slice(0, 5).map((order: ActiveOrder) => (
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
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${ORDER_STATUS[order.status]?.className || 'bg-gray-100 text-gray-600'}`}>
                          {ORDER_STATUS[order.status]?.label || order.status}
                        </span>
                        <p className="text-lg font-black text-gray-900 mt-1">{order.totalAmount.toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden h-fit">
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
              {periodReservations > 0 && (
                <Link href="/reservations" className="block p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:scale-[1.02] transition-transform">
                  <p className="text-blue-700 font-bold text-sm">Lịch đặt bàn</p>
                  <p className="text-blue-500 text-xs mt-1">
                    {filter === 'today' ? 'Hôm nay' : filter === 'week' ? 'Tuần này' : 'Tháng này'} có {periodReservations} lượt đặt bàn cần chuẩn bị.
                  </p>
                </Link>
              )}
              {promotions.filter((p: Promotion) => !p.isActive).length > 0 && (
                <Link href="/promotions" className="block p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:scale-[1.02] transition-transform">
                  <p className="text-gray-700 font-bold text-sm">Khuyến mãi mới</p>
                  <p className="text-gray-500 text-xs mt-1">Có chương trình khuyến mãi chưa kích hoạt.</p>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
