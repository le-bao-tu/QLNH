'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface Reservation {
  id: string
  branchId: string
  tableId?: string
  tableNumber?: number
  customerName?: string
  guestName?: string
  guestPhone?: string
  partySize: number
  reservedAt: string
  note?: string
  status: string
  createdAt: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-700' },
  seated:    { label: 'Đã vào bàn',   color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Hoàn thành',   color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy',       color: 'bg-red-100 text-red-700' },
  no_show:   { label: 'Không đến',    color: 'bg-gray-100 text-gray-600' },
}

export default function ReservationsPage() {
  const { user } = useAuth()
  const branchId = user?.branchId || ''

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ guestName: '', guestPhone: '', partySize: 2, reservedAt: '', note: '' })

  const load = async () => {
    if (!branchId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/api/reservations/branch/${branchId}`, { params: { date: selectedDate } })
      setReservations(data)
    } catch {
      setReservations([])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [selectedDate, branchId])

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/api/reservations/${id}/status`, { status })
    load()
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchId) return
    await api.post('/api/reservations', {
      branchId: branchId,
      guestName: form.guestName,
      guestPhone: form.guestPhone,
      partySize: form.partySize,
      reservedAt: form.reservedAt,
      note: form.note,
    })
    setShowModal(false)
    setForm({ guestName: '', guestPhone: '', partySize: 2, reservedAt: '', note: '' })
    load()
  }

  const groupByTime = () => {
    const groups: Record<string, Reservation[]> = {}
    reservations.forEach(r => {
      const hour = new Date(r.reservedAt).getHours()
      const key = `${hour.toString().padStart(2, '0')}:00`
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }

  return (
    <AuthLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Đặt bàn</h1>
            <p className="text-gray-500 text-sm mt-1">Quản lý đặt bàn trước của khách hàng</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tạo đặt bàn
          </button>
        </div>

        {/* Date picker */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex items-center gap-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="border-none outline-none text-gray-700 font-medium" />
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">{reservations.length} đặt bàn</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(statusConfig).slice(0, 4).map(([key, cfg]) => {
            const count = reservations.filter(r => r.status === key).length
            return (
              <div key={key} className="bg-white rounded-xl p-4 shadow-sm border">
                <p className="text-gray-500 text-sm">{cfg.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            )
          })}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-500">Không có đặt bàn nào trong ngày này</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupByTime().map(([time, group]) => (
              <div key={time}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-100 text-blue-700 text-sm font-bold px-3 py-1 rounded-full">{time}</span>
                  <div className="h-px flex-1 bg-gray-200"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.map(r => {
                    const cfg = statusConfig[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-600' }
                    return (
                      <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">{r.guestName || r.customerName || 'Khách vãng lai'}</p>
                            <p className="text-sm text-gray-500">{r.guestPhone}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span>👥 {r.partySize} người</span>
                          {r.tableNumber && <span>🪑 Bàn {r.tableNumber}</span>}
                          <span>🕐 {new Date(r.reservedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {r.note && <p className="text-xs text-gray-400 italic mb-3">{r.note}</p>}
                        <div className="flex gap-2 flex-wrap">
                          {r.status === 'pending' && (
                            <button onClick={() => updateStatus(r.id, 'confirmed')}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Xác nhận</button>
                          )}
                          {r.status === 'confirmed' && (
                            <button onClick={() => updateStatus(r.id, 'seated')}
                              className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">Vào bàn</button>
                          )}
                          {r.status === 'seated' && (
                            <button onClick={() => updateStatus(r.id, 'completed')}
                              className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100">Hoàn thành</button>
                          )}
                          {!['completed', 'cancelled', 'no_show'].includes(r.status) && (
                            <>
                              <button onClick={() => updateStatus(r.id, 'cancelled')}
                                className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">Hủy</button>
                              <button onClick={() => updateStatus(r.id, 'no_show')}
                                className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100">Không đến</button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Tạo đặt bàn mới</h2>
                <form onSubmit={create} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tên khách</label>
                    <input required value={form.guestName} onChange={e => setForm({ ...form, guestName: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nguyễn Văn A" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                    <input value={form.guestPhone} onChange={e => setForm({ ...form, guestPhone: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0901234567" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Số khách</label>
                      <input type="number" min={1} max={50} value={form.partySize} onChange={e => setForm({ ...form, partySize: Number(e.target.value) })}
                        className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Thời gian đến</label>
                      <input type="datetime-local" required value={form.reservedAt} onChange={e => setForm({ ...form, reservedAt: e.target.value })}
                        className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                    <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} placeholder="VD: yêu cầu bàn gần cửa sổ..." />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Hủy</button>
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Tạo đặt bàn</button>
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
