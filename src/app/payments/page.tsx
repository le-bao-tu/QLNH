'use client'
import { useState } from 'react'

import AuthLayout from '@/components/AuthLayout'
import { useAuth } from '@/lib/auth'
import { CreditCard, Search, Calendar, Landmark, Coins, Receipt, Wallet, User, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useRecentPaymentsInBranch, useRecentPaymentsInRestaurant } from '@/hooks/useApi'
import { PAYMENT_METHOD_LABEL } from '@/common/constant'

export default function PaymentsPage() {
  const [filter, setFilter] = useState<'today' | 'week' | 'month'>('today')
  const { user } = useAuth()
  const branchId = user?.branchId || ''
  const restaurantId = user?.restaurantId || ''
  const isOwner = user?.isOwner

  const { data: paymentsInBranch = [] } = useRecentPaymentsInBranch(branchId, {
    enabled: !isOwner && branchId != ''
  })
  const { data: paymentsInRestaurant = [] } = useRecentPaymentsInRestaurant(restaurantId, {
    enabled: isOwner && restaurantId != ''
  })
  const allPayments = (isOwner ? paymentsInRestaurant : paymentsInBranch) as any[]

  const filteredPayments = allPayments.filter(p => {
    const pDate = new Date(p.createdAt)
    const now = new Date()

    if (filter === 'today') {
      return pDate.toDateString() === now.toDateString()
    }

    if (filter === 'week') {
      const startOfWeek = new Date(now)
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      startOfWeek.setHours(0, 0, 0, 0)
      return pDate >= startOfWeek
    }

    if (filter === 'month') {
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear()
    }

    return true
  })

  // Use filtered payments for calculations
  const payments = filteredPayments


  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return <Coins className="text-orange-500" />
      case 'card': return <CreditCard className="text-pink-500" />
      case 'transfer': return <Landmark className="text-blue-500" />
      default: return <Wallet className="text-indigo-500" />
    }
  }

  const getPopularMethod = () => {
    const methodCounts: Record<string, number> = {}
    payments.forEach(p => {
      methodCounts[p.method] = (methodCounts[p.method] || 0) + 1
    })
    const sortedMethods = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])
    return sortedMethods.length > 0 ? sortedMethods[0][0] : 'N/A'
  }

  return (
    <AuthLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
              <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-xl shadow-emerald-100">
                <Receipt size={32} />
              </div>
              Quản lý Giao dịch
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Theo dõi dòng tiền và lịch sử thanh toán từ khách hàng</p>
          </div>

          <div className="flex bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <button
              onClick={() => setFilter('today')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${filter === 'today' ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-400 hover:text-gray-900'}`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${filter === 'week' ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-400 hover:text-gray-900'}`}
            >
              Tuần này
            </button>
            <button
              onClick={() => setFilter('month')}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${filter === 'month' ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-gray-400 hover:text-gray-900'}`}
            >
              Tháng này
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
              Tổng doanh thu ({filter === 'today' ? 'Hôm nay' : filter === 'week' ? 'Tuần này' : 'Tháng này'})
            </p>
            <h3 className="text-4xl font-black text-gray-900">{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('vi-VN')} <span className="text-lg font-bold text-gray-400">VNĐ</span></h3>
            <p className="text-green-500 text-sm font-bold flex items-center gap-1 mt-2">
              <CheckCircle2 size={14} /> +12% so với hôm qua
            </p>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Giao dịch thành công</p>
            <h3 className="text-4xl font-black text-gray-900">{payments.filter((p) => p.status === 'completed').length} <span className="text-lg font-bold text-gray-400">Bills</span></h3>
            <p className="text-blue-500 text-sm font-bold mt-2">Trung bình {payments.length > 0 ? (payments.reduce((sum, p) => sum + p.amount, 0) / payments.length).toLocaleString('vi-VN') : '0'} VNĐ / bill</p>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Phương thức phổ biến</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="p-3 bg-orange-50 rounded-xl text-orange-600 font-black flex items-center gap-2">
                <Coins size={18} /> {getPopularMethod().toUpperCase()}
              </div>
              <span className="text-gray-400 font-bold"> chiếm {payments.length > 0 ? Math.round((payments.filter(p => p.method === getPopularMethod()).length / payments.length) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Danh sách giao dịch gần đây</h2>
            <div className="relative w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm mã đơn hàng..."
                className="w-full bg-gray-50 border-0 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-medium text-sm"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Thời gian</th>
                  <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Mã đơn hàng</th>
                  <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Số tiền</th>
                  <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Phương thức</th>
                  <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="text-gray-400" size={16} />
                        <div>
                          <p className="font-bold text-gray-900">{new Date(p.createdAt).toLocaleTimeString('vi-VN')}</p>
                          <p className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black text-indigo-600">#{p.orderId}</span>
                    </td>
                    <td className="px-8 py-6 text-lg font-black text-gray-900">
                      {p.amount.toLocaleString()} <span className="text-xs font-bold text-gray-400">VNĐ</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 font-bold text-gray-700">
                        {getMethodIcon(p.method)}
                        {PAYMENT_METHOD_LABEL[p.method]}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status === 'completed' ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
