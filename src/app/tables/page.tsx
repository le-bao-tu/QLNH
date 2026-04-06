'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useTables, useUpdateTableStatus, useBranches } from '@/hooks/useApi'
import { Plus, Edit2, Trash2, RefreshCw, Grid3x3, QrCode } from 'lucide-react'
import api from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'

interface Table {
  id: string
  tableNumber: number
  capacity: number
  status: string
  note?: string
  currentOrderId?: string
  branchId?: string
}

const STATUS_LABELS: Record<string, string> = {
  available: '✅ Trống',
  occupied: '🔴 Có khách',
  reserved: '🟡 Đặt trước',
  cleaning: '🔵 Đang dọn',
}

export default function TablesPage() {
  const { user } = useAuth()
  const isOwner = user?.role?.toLowerCase() === 'owner'
  const restaurantId = user?.restaurantId || ''

  // Owner có thể chọn chi nhánh, Manager lấy từ tài khoản
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.branchId || '')
  const activeBranchId = isOwner ? selectedBranchId : (user?.branchId || '')

  const { data: branches = [] } = useBranches(isOwner ? restaurantId : '')


  // T\u1ef1 đ\u1ed9ng ch\u1ecdn chi nh\u00e1nh đầu ti\u00ean cho Owner n\u1ebfu chưa ch\u1ecdn
  useEffect(() => {
    if (isOwner && !selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id)
    }
  }, [isOwner, selectedBranchId, branches])

  const { data: tables = [], refetch } = useTables(activeBranchId)
  const updateStatus = useUpdateTableStatus()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [qrModal, setQrModal] = useState<Table | null>(null)
  const [editTable, setEditTable] = useState<Table | null>(null)
  const [form, setForm] = useState({ tableNumber: '', capacity: '4', note: '', branchId: '' })
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredTables = filterStatus === 'all' ? tables :
    tables.filter((t: Table) => t.status === filterStatus)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetBranchId = isOwner ? form.branchId || selectedBranchId : (user?.branchId || '')
    
    if (!targetBranchId || targetBranchId === 'all') {
      alert('Vui lòng chọn chi nhánh!')
      return
    }

    const tableNo = parseInt(form.tableNumber)
    const cap = parseInt(form.capacity)

    if (isNaN(tableNo) || isNaN(cap)) {
      alert('Số bàn và sức chứa phải là số hợp lệ!')
      return
    }

    setLoading(true)
    try {
      if (editTable) {
        await api.put(`/api/tables/${editTable.id}`, {
          tableNumber: tableNo,
          capacity: cap,
          note: form.note
        })
      } else {
        await api.post('/api/tables', {
          branchId: targetBranchId,
          tableNumber: tableNo,
          capacity: cap,
          note: form.note
        })
      }
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      setShowForm(false)
      setEditTable(null)
      setForm({ tableNumber: '', capacity: '4', note: '', branchId: '' })
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin bàn'
      alert(msg)
    }
    setLoading(false)
  }

  const handleEdit = (table: Table) => {
    setEditTable(table)
    setForm({ tableNumber: table.tableNumber.toString(), capacity: table.capacity.toString(), note: table.note || '', branchId: '' })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn xóa bàn này?')) return
    await api.delete(`/api/tables/${id}`)
    queryClient.invalidateQueries({ queryKey: ['tables'] })
  }

  const cardBg = (status: string) => ({
    available: { bg: '#f0fdf4', border: '#bbf7d0', headerBg: '#dcfce7' },
    occupied: { bg: '#fef2f2', border: '#fca5a5', headerBg: '#fee2e2' },
    reserved: { bg: '#fffbeb', border: '#fde68a', headerBg: '#fef3c7' },
    cleaning: { bg: '#eff6ff', border: '#bfdbfe', headerBg: '#dbeafe' },
  }[status] || { bg: '#f8fafc', border: '#e2e8f0', headerBg: '#f1f5f9' })

  const getQRUrl = (table: Table) => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/order/${table.branchId}/${table.tableNumber}`
  }

  return (
    <AuthLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Grid3x3 size={22} color="#2563eb" />
              Quản lý bàn
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>{tables.length} bàn {activeBranchId ? `· Chi nhánh đang xem` : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => refetch()}>
              <RefreshCw size={15} />
              Làm mới
            </button>
            <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditTable(null); setForm({ tableNumber: '', capacity: '4', note: '', branchId: '' }) }} id="add-table-btn">
              <Plus size={15} />
              Thêm bàn
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Tất cả', count: tables.length },
            { key: 'available', label: 'Trống', count: tables.filter((t: Table) => t.status === 'available').length },
            { key: 'occupied', label: 'Có khách', count: tables.filter((t: Table) => t.status === 'occupied').length },
            { key: 'reserved', label: 'Đặt trước', count: tables.filter((t: Table) => t.status === 'reserved').length },
          ].map(s => (
            <button
              key={s.key}
              className={`btn ${filterStatus === s.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(s.key)}
            >
              {s.label} <span style={{ fontWeight: 700, marginLeft: 4 }}>({s.count})</span>
            </button>
          ))}
        </div>

        {/* Table Grid */}
        <div className="table-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
          {filteredTables.map((table: Table) => {
            const colors = cardBg(table.status)
            return (
              <div
                key={table.id}
                className="card card-hover"
                style={{ border: `2px solid ${colors.border}`, background: colors.bg, overflow: 'hidden' }}
              >
                {/* Card header */}
                <div style={{ background: colors.headerBg, padding: '12px 14px', marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                      Bàn {table.tableNumber}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setQrModal(table)} style={{ padding: 4, background: '#fff', border: '1px solid #e2e8f0' }} title="Mã QR gọi món">
                        <QrCode size={13} color="#2563eb" />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(table)} style={{ padding: 4 }}>
                        <Edit2 size={13} color="#64748b" />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(table.id)} style={{ padding: 4 }}>
                        <Trash2 size={13} color="#dc2626" />
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '10px 14px' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                    👥 {table.capacity} chỗ ngồi
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <span className={`badge badge-${table.status}`}>
                      {STATUS_LABELS[table.status] || table.status}
                    </span>
                  </div>

                  {table.note && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontStyle: 'italic' }}>
                      {table.note}
                    </div>
                  )}

                  {/* Quick status change */}
                  <select
                    className="input"
                    style={{ fontSize: 12, padding: '4px 8px' }}
                    value={table.status}
                    onChange={e => updateStatus.mutate({ id: table.id, status: e.target.value })}
                  >
                    <option value="available">Trống</option>
                    <option value="occupied">Có khách</option>
                    <option value="reserved">Đặt trước</option>
                    <option value="cleaning">Đang dọn</option>
                  </select>
                </div>
              </div>
            )
          })}
        </div>

        {filteredTables.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <Grid3x3 size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>Không có bàn nào</p>
          </div>
        )}

        {/* Modal Form */}
        {showForm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
          }}>
            <div className="card animate-fade-in" style={{ padding: 32, width: 400, maxWidth: '90vw' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
                {editTable ? 'Sửa thông tin bàn' : 'Thêm bàn mới'}
              </h2>
              <form onSubmit={handleSubmit}>
                {/* Owner: ch\u1ecdn chi nh\u00e1nh khi t\u1ea1o b\u00e0n m\u1edbi */}
                {isOwner && !editTable && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Chi nhánh *</label>
                    <select
                      className="input"
                      required
                      value={form.branchId}
                      onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}
                    >
                      <option value="">-- Chọn chi nhánh --</option>
                      {(branches as Array<{id: string; name: string}>).map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Số bàn *</label>
                  <input className="input" type="number" required value={form.tableNumber}
                    onChange={e => setForm(p => ({ ...p, tableNumber: e.target.value }))} placeholder="VD: 1" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Số chỗ ngồi *</label>
                  <input className="input" type="number" required value={form.capacity}
                    onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Ghi chú</label>
                  <input className="input" value={form.note}
                    onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="VD: Gần cửa sổ" />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowForm(false); setEditTable(null) }}>
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading} id="save-table-btn">
                    {loading ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {qrModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
          }}>
            <div className="card animate-fade-in" style={{ padding: 32, width: 360, maxWidth: '90vw', textAlign: 'center' }}>
              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Mã QR gọi món</h2>
                <button onClick={() => setQrModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ background: '#f8fafc', padding: 24, borderRadius: 16, marginBottom: 20 }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(getQRUrl(qrModal))}&size=250x250&bgcolor=ffffff`}
                  alt="QR Code"
                  style={{ width: '100%', height: 'auto', borderRadius: 8, border: '4px solid white' }}
                />
              </div>

              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Bàn số {qrModal.tableNumber}</p>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Khách hàng có thể quét mã này để đặt món</p>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => window.print()}>
                  In mã QR
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setQrModal(null)}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}

function X(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
