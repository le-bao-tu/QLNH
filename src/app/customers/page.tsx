'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface Customer {
  id: string
  restaurantId: string
  fullName: string
  phone?: string
  email?: string
  loyaltyPoints: number
  loyaltyTier: string
  note?: string
  createdAt: string
}

const tierConfig: Record<string, { label: string; color: string; icon: string }> = {
  bronze:   { label: 'Đồng', color: 'bg-amber-100 text-amber-700', icon: '🥉' },
  silver:   { label: 'Bạc',  color: 'bg-slate-100 text-slate-600', icon: '🥈' },
  gold:     { label: 'Vàng', color: 'bg-yellow-100 text-yellow-700', icon: '🥇' },
  platinum: { label: 'Bạch kim', color: 'bg-cyan-100 text-cyan-700', icon: '💎' },
}

export default function CustomersPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId || ''

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', gender: '', note: '' })

  const load = async (q?: string) => {
    if (!restaurantId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/api/customers/restaurant/${restaurantId}`, { params: { search: q } })
      setCustomers(data)
    } catch { setCustomers([]) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [restaurantId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    load(search)
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId) return
    await api.post('/api/customers', { restaurantId: restaurantId, ...form })
    setShowModal(false)
    setForm({ fullName: '', phone: '', email: '', gender: '', note: '' })
    load()
  }

  return (
    <AuthLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
            <p className="text-gray-500 text-sm mt-1">Quản lý khách hàng và điểm tích lũy</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Thêm khách hàng
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(['bronze', 'silver', 'gold', 'platinum'] as const).map(tier => {
            const count = customers.filter(c => c.loyaltyTier === tier).length
            const cfg = tierConfig[tier]
            return (
              <div key={tier} className="bg-white rounded-xl p-4 shadow-sm border">
                <p className="text-gray-500 text-sm">{cfg.icon} {cfg.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            )
          })}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tên, số điện thoại..."
            className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Tìm</button>
        </form>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Khách hàng</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Liên hệ</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Hạng</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Điểm tích lũy</th>
                  <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-400">Không có khách hàng nào</td></tr>
                ) : customers.map(c => {
                  const cfg = tierConfig[c.loyaltyTier] || tierConfig.bronze
                  return (
                    <tr key={c.id} onClick={() => setSelected(c)}
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-sm">
                            {c.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{c.fullName}</p>
                            {c.note && <p className="text-xs text-gray-400">{c.note}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{c.phone}</div>
                        <div className="text-gray-400">{c.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">{c.loyaltyPoints.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Customer Detail Modal */}
        {selected && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{selected.fullName}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${tierConfig[selected.loyaltyTier]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {tierConfig[selected.loyaltyTier]?.icon} {tierConfig[selected.loyaltyTier]?.label}
                    </span>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Điện thoại</span><span>{selected.phone || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span>{selected.email || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Điểm tích lũy</span><span className="font-bold text-blue-600">{selected.loyaltyPoints.toLocaleString()} điểm</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ngày tham gia</span><span>{new Date(selected.createdAt).toLocaleDateString('vi-VN')}</span></div>
                  {selected.note && <div><span className="text-gray-500">Ghi chú: </span><span className="italic">{selected.note}</span></div>}
                </div>
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl text-center">
                  <p className="text-xs text-gray-500 mb-1">Điểm tích lũy</p>
                  <p className="text-3xl font-black text-blue-600">{selected.loyaltyPoints.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-1">điểm</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Thêm khách hàng</h2>
                <form onSubmit={create} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Họ tên *</label>
                    <input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                      <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                    <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Hủy</button>
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Thêm</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
