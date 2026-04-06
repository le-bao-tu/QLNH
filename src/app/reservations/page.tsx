'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useBranches } from '@/hooks/useApi'
import { 
  CalendarDays, 
  Plus, 
  Search, 
  ChevronRight, 
  Users, 
  Clock, 
  MapPin, 
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  UserCheck,
  Calendar,
  X
} from 'lucide-react'

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

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string; text: string }> = {
  pending:   { label: 'Chờ xác nhận', icon: HelpCircle, bg: '#fef3c7', text: '#d97706', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận',  icon: CheckCircle2, bg: '#dbeafe', text: '#2563eb', color: 'bg-blue-100 text-blue-700' },
  seated:    { label: 'Đã vào bàn',   icon: UserCheck, bg: '#f3e8ff', text: '#9333ea', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Hoàn thành',   icon: CheckCircle2, bg: '#dcfce7', text: '#16a34a', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy',       icon: XCircle, bg: '#fee2e2', text: '#dc2626', color: 'bg-red-100 text-red-700' },
  no_show:   { label: 'Không đến',    icon: AlertCircle, bg: '#f1f5f9', text: '#64748b', color: 'bg-gray-100 text-gray-600' },
}

export default function ReservationsPage() {
  const { user } = useAuth()
  const isOwner = user?.role?.toLowerCase() === 'owner'
  const restaurantId = user?.restaurantId || ''
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.branchId || '')
  const activeBranchId = isOwner ? selectedBranchId : (user?.branchId || '')
  
  const { data: branches = [] } = useBranches(isOwner ? restaurantId : '')
  

  // T\u1ef1 đ\u1ed9ng ch\u1ecdn chi nh\u00e1nh đầu ti\u00ean cho Owner n\u1ebfu chưa ch\u1ecdn
  useEffect(() => {
    if (isOwner && !selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id)
    }
  }, [isOwner, selectedBranchId, branches])

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ guestName: '', guestPhone: '', partySize: 2, reservedAt: '', note: '', branchId: '' })

  const load = async () => {
    if (!activeBranchId || activeBranchId === 'all') {
      setReservations([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get(`/api/reservations/branch/${activeBranchId}`, { params: { date: selectedDate } })
      setReservations(data)
    } catch {
      setReservations([])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [selectedDate, activeBranchId])

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/api/reservations/${id}/status`, { status })
    load()
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    // L\u1ea5y branchId t\u1eeb form n\u1ebfu l\u00e0 Owner v\u00e0 đang th\u00eam m\u1edbi, ho\u1eb7c t\u1eeb activeBranchId
    const targetBranchId = isOwner ? form.branchId || selectedBranchId : (user?.branchId || '')
    
    if (!targetBranchId || targetBranchId === 'all') {
      alert('Vui lòng chọn chi nhánh!')
      return
    }
    
    try {
      await api.post('/api/reservations', {
        branchId: targetBranchId,
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        partySize: form.partySize,
        reservedAt: form.reservedAt,
        note: form.note,
      })
      setShowModal(false)
      setForm({ guestName: '', guestPhone: '', partySize: 2, reservedAt: '', note: '', branchId: '' })
      load()
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi tạo đặt bàn'
      alert(msg)
    }
  }

  const groupByTime = () => {
    const groups: Record<string, Reservation[]> = {}
    reservations.forEach(r => {
      const date = new Date(r.reservedAt)
      const hour = date.getHours()
      const key = `${hour.toString().padStart(2, '0')}:00`
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }

  return (
    <AuthLayout>
      <div className="animate-fade-in" style={{ padding: '24px' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CalendarDays size={32} color="#2563eb" />
              Lịch đặt bàn
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
              Quản lý và điều phối khách đặt chỗ trước
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
              style={{ height: '42px', padding: '0 20px', borderRadius: '12px', gap: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
            >
              <Plus size={18} />
              Tạo đặt bàn
            </button>
          </div>
        </div>

        {/* Dashboard Controls */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '300px 1fr', 
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Sidebar Filters */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <div className="card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ngày hiển thị
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '10px 12px 10px 40px', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#0f172a',
                      outline: 'none',
                      cursor: 'pointer'
                    }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Thống kê nhanh
                </label>
                {Object.entries(statusConfig).map(([key, cfg]) => {
                  const count = reservations.filter(r => r.status === key).length
                  return (
                    <div key={key} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: count > 0 ? '#f8fafc' : 'transparent',
                      border: count > 0 ? '1px solid #f1f5f9' : '1px solid transparent'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.text }} />
                        <span style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>{cfg.label}</span>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: count > 0 ? cfg.text : '#cbd5e1' }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Timeline View */}
          <div>
            {!activeBranchId || activeBranchId === 'all' ? (
              <div className="card" style={{ padding: '80px 20px', textAlign: 'center', borderRadius: '24px', border: '2px dashed #e2e8f0', background: 'transparent' }}>
                <MapPin size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#64748b' }}>Vui lòng chọn chi nhánh</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Chọn một chi nhánh bên trên để bắt đầu quản lý lịch đặt bàn</p>
              </div>
            ) : loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%' }} />
              </div>
            ) : reservations.length === 0 ? (
              <div className="card" style={{ padding: '80px 20px', textAlign: 'center', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <CalendarDays size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#64748b' }}>Không có đặt bàn nào</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>Ngày {new Date(selectedDate).toLocaleDateString('vi-VN')} chưa có khách đặt chỗ</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {groupByTime().map(([time, group]) => (
                  <div key={time} style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ flexShrink: 0, paddingTop: '12px' }}>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 800, 
                        color: '#2563eb', 
                        background: '#eff6ff', 
                        padding: '6px 14px', 
                        borderRadius: '10px',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)'
                      }}>
                        {time}
                      </div>
                      <div style={{ width: '2px', height: 'calc(100% - 32px)', background: '#e2e8f0', margin: '12px auto 0' }} />
                    </div>
                    
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                      {group.map(r => {
                        const cfg = statusConfig[r.status] || statusConfig.pending
                        const StatusIcon = cfg.icon
                        return (
                          <div key={r.id} className="card card-hover" style={{ 
                            padding: '0', 
                            borderRadius: '20px', 
                            overflow: 'hidden',
                            border: '1px solid #f1f5f9',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                          }}>
                            {/* Card Header Strip */}
                            <div style={{ height: '6px', background: cfg.text }} />
                            
                            <div style={{ padding: '20px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                <div>
                                  <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                                    {r.guestName || r.customerName || 'Khách vãng lai'}
                                  </h4>
                                  <p style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Clock size={13} /> {new Date(r.reservedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · {r.guestPhone || '--'}
                                  </p>
                                </div>
                                <div style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '6px', 
                                  padding: '4px 10px', 
                                  borderRadius: '8px', 
                                  background: cfg.bg, 
                                  color: cfg.text,
                                  fontSize: '12px',
                                  fontWeight: 700
                                }}>
                                  <StatusIcon size={14} />
                                  {cfg.label}
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <Users size={16} color="#64748b" />
                                  <div>
                                    <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Số khách</p>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{r.partySize} người</p>
                                  </div>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <MapPin size={16} color="#64748b" />
                                  <div>
                                    <p style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Số bàn</p>
                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>{r.tableNumber ? `Bàn ${r.tableNumber}` : 'Chưa xếp'}</p>
                                  </div>
                                </div>
                              </div>

                              {r.note && (
                                <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fef3c7', fontSize: '12px', color: '#92400e', marginBottom: '20px', fontStyle: 'italic' }}>
                                  "{r.note}"
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {r.status === 'pending' && (
                                  <button onClick={() => updateStatus(r.id, 'confirmed')} style={{ flex: 1, height: '34px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                    Xác nhận
                                  </button>
                                )}
                                {r.status === 'confirmed' && (
                                  <button onClick={() => updateStatus(r.id, 'seated')} style={{ flex: 1, height: '34px', borderRadius: '8px', border: 'none', background: '#9333ea', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                    Vào bàn
                                  </button>
                                )}
                                {r.status === 'seated' && (
                                  <button onClick={() => updateStatus(r.id, 'completed')} style={{ flex: 1, height: '34px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                    Xong
                                  </button>
                                )}
                                {!['completed', 'cancelled', 'no_show'].includes(r.status) && (
                                  <div style={{ display: 'flex', gap: '8px', width: r.status === 'pending' || r.status === 'confirmed' || r.status === 'seated' ? 'auto' : '100%' }}>
                                    <button onClick={() => updateStatus(r.id, 'cancelled')} style={{ padding: '0 12px', height: '34px', borderRadius: '8px', border: '1px solid #fee2e2', background: 'white', color: '#dc2626', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                      Hủy
                                    </button>
                                    <button onClick={() => updateStatus(r.id, 'no_show')} style={{ padding: '0 12px', height: '34px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                      Vắng
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Form */}
        {showModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div className="card animate-scale-in" style={{ padding: '0', width: '450px', maxWidth: '100%', borderRadius: '24px', overflow: 'hidden' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Tạo đặt bàn mới</h2>
                <button onClick={() => setShowModal(false)} style={{ background: '#f8fafc', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} color="#64748b" />
                </button>
              </div>
              
              <form onSubmit={create} style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gap: '20px' }}>
                  {/* Owner: ch\u1ecdn chi nh\u00e1nh khi th\u00eam m\u1edbi đ\u1ebft b\u00e0n */}
                  {isOwner && (
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Chi nhánh *</label>
                      <select 
                        required 
                        value={form.branchId} 
                        onChange={e => setForm({ ...form, branchId: e.target.value })}
                        className="input"
                        style={{ height: '45px', borderRadius: '12px' }}
                      >
                        <option value="">-- Chọn chi nhánh --</option>
                        {(branches as any[]).map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Tên khách hàng *</label>
                    <input 
                      required 
                      value={form.guestName} 
                      onChange={e => setForm({ ...form, guestName: e.target.value })}
                      className="input" 
                      style={{ height: '45px', borderRadius: '12px' }}
                      placeholder="VD: Anh Tuấn" 
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Số điện thoại</label>
                    <input 
                      value={form.guestPhone} 
                      onChange={e => setForm({ ...form, guestPhone: e.target.value })}
                      className="input" 
                      style={{ height: '45px', borderRadius: '12px' }}
                      placeholder="VD: 0901234567" 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Số khách</label>
                      <input 
                        type="number" 
                        min={1} 
                        value={form.partySize} 
                        onChange={e => setForm({ ...form, partySize: Number(e.target.value) })}
                        className="input" 
                        style={{ height: '45px', borderRadius: '12px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Thời gian đến *</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={form.reservedAt} 
                        onChange={e => setForm({ ...form, reservedAt: e.target.value })}
                        className="input" 
                        style={{ height: '45px', borderRadius: '12px', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>Ghi chú dịch vụ</label>
                    <textarea 
                      value={form.note} 
                      onChange={e => setForm({ ...form, note: e.target.value })}
                      className="input" 
                      style={{ minHeight: '80px', borderRadius: '12px', padding: '12px', resize: 'none' }}
                      placeholder="VD: Yêu cầu bàn VIP, tránh ồn..." 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, height: '48px', borderRadius: '14px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}>
                    Hủy bỏ
                  </button>
                  <button type="submit" style={{ flex: 1, height: '48px', borderRadius: '14px', border: 'none', background: '#2563eb', fontWeight: 700, color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
                    Xác nhận đặt bàn
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
