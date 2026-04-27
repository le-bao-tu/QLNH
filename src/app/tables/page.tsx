'use client'

import { useEffect, useState } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useTables, useUpdateTableStatus, useBranches } from '@/hooks/useApi'
import { Plus, Edit2, Trash2, RefreshCw, Grid3x3, QrCode } from 'lucide-react'
import api from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import { SelectBox } from '@/components/SelectBox'
import { useToast } from '@/hooks/useToast'
import { ConfirmModal } from '@/components/ConfirmModal'
import { BranchSelector } from '@/components/BranchSelector'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { X } from 'lucide-react'

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

const tableStatuses = [
  { value: 'available', label: 'Trống' },
  { value: 'occupied', label: 'Có khách' },
  { value: 'reserved', label: 'Đặt trước' },
  { value: 'cleaning', label: 'Đang dọn' },
]

export default function TablesPage() {
  const { user } = useAuth()
  const isOwner = user?.isOwner
  const restaurantId = user?.restaurantId || ''
  const toast = useToast()
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.branchId || '')

  const workingId = isOwner && !selectedBranchId ? restaurantId : selectedBranchId
  const mode = isOwner && !selectedBranchId ? 'restaurant' : 'branch'

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null })
  const { data: branches = [] } = useBranches(restaurantId)

  const { data: tables = [], refetch } = useTables(workingId, mode)
  const updateStatus = useUpdateTableStatus()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [qrModal, setQrModal] = useState<Table | null>(null)
  const [editTable, setEditTable] = useState<Table | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'occupied' | 'reserved' | 'cleaning'>('all')
  const filteredTables = filterStatus === 'all' ? tables : tables.filter((t: Table) => t.status === filterStatus)
  const validationSchema = Yup.object({
    tableNumber: Yup.number().typeError('Số bàn phải là số').required('Số bàn là bắt buộc').positive('Số bàn phải lớn hơn 0'),
    capacity: Yup.number().typeError('Sức chứa phải là số').required('Sức chứa là bắt buộc').positive('Sức chứa phải lớn hơn 0'),
    branchId: isOwner ? Yup.string().required('Vui lòng chọn chi nhánh') : Yup.string(),
  });

  useEffect(() => {
    if (isOwner && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id)
    }
  }, [isOwner, branches, selectedBranchId])

  const formik = useFormik({
    initialValues: { tableNumber: '', capacity: '4', note: '', branchId: '' },
    validationSchema,
    onSubmit: async (values) => {
      const targetBranchId = isOwner ? values.branchId || selectedBranchId : (user?.branchId || '');

      setLoading(true);
      try {
        const payload = {
          branchId: targetBranchId,
          tableNumber: parseInt(values.tableNumber),
          capacity: parseInt(values.capacity),
          note: values.note,
        };

        if (editTable) {
          await api.put(`/api/tables/${editTable.id}`, {
            tableNumber: payload.tableNumber,
            capacity: payload.capacity,
            note: payload.note
          });
          toast.success('Đã cập nhật bàn thành công');
        } else {
          await api.post('/api/tables', payload);
          toast.success('Đã tạo bàn thành công');
        }
        queryClient.invalidateQueries({ queryKey: ['tables'] });
        setShowForm(false);
        setEditTable(null);
        formik.resetForm();
      } catch (err: any) {
        console.error(err);
        const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin bàn';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
  });

  const handleEdit = (table: Table) => {
    setEditTable(table);
    formik.setValues({
      tableNumber: table.tableNumber.toString(),
      capacity: table.capacity.toString(),
      note: table.note || '',
      branchId: table.branchId || ''
    });
    setShowForm(true);
  }

  const deleteTable = async () => {
    if (!confirmDialog.id) return
    try {
      await api.delete(`/api/tables/${confirmDialog.id}`)
      toast.success('Đã xoá bàn thành công')
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    } catch (err) {
      console.error(err)
      toast.error('Có lỗi xảy ra khi xóa bàn')
    } finally {
      setConfirmDialog({ isOpen: false, id: null })
    }
  }

  const cardBg = (status: string) => ({
    available: { bg: '#f0fdf4', border: '#bbf7d0', headerBg: '#dcfce7' },
    occupied: { bg: '#fef2f2', border: '#fca5a5', headerBg: '#fee2e2' },
    reserved: { bg: '#fffbeb', border: '#fde68a', headerBg: '#fef3c7' },
    cleaning: { bg: '#eff6ff', border: '#bfdbfe', headerBg: '#dbeafe' },
  }[status] || { bg: '#f8fafc', border: '#e2e8f0', headerBg: '#f1f5f9' })

  const getQRUrl = (table: Table) => {
    if (typeof window === 'undefined') return ''
    console.log(`${window.location.origin}/order/${table.id}`);

    return `${window.location.origin}/order/${table.id}`
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
            <p style={{ color: '#64748b', fontSize: 13 }}>{tables.length} bàn {selectedBranchId ? `· ${branches.find((b: any) => b.id === selectedBranchId)?.name || ''}` : '· Tất cả chi nhánh'}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {
              isOwner && (
                <div className='w-52'>
                  <SelectBox value={selectedBranchId} options={branches} optionLabel='name' optionValue='id' onChange={(val) => setSelectedBranchId(val)} />
                </div>
              )
            }
            <button className="btn btn-secondary flex-shrink-0" onClick={() => refetch()}>
              <RefreshCw size={15} />
              Làm mới
            </button>
            <button className="btn btn-primary flex-shrink-0" onClick={() => { setShowForm(true); setEditTable(null); formik.resetForm(); }} id="add-table-btn">
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
              className={`btn ${filterStatus === s.key ? 'btn-primary' : 'btn-secondary'} `}
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
                style={{ border: `2px solid ${colors.border} `, background: colors.bg, overflow: 'hidden' }}
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
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDialog({ isOpen: true, id: table.id })} style={{ padding: 4 }}>
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
                    <span className={`badge badge - ${table.status} `}>
                      {STATUS_LABELS[table.status] || table.status}
                    </span>
                  </div>

                  {table.note && (
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontStyle: 'italic' }}>
                      {table.note}
                    </div>
                  )}

                  {/* Quick status change */}
                  <SelectBox options={tableStatuses} onChange={val => updateStatus.mutate({ id: table.id, status: val })} value={table.status} optionLabel='label' optionValue='value' />
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
              <form onSubmit={formik.handleSubmit}>
                {/* Owner: chọn chi nhánh khi tạo bàn mới */}
                {isOwner && !editTable && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Chi nhánh *</label>
                    <SelectBox
                      options={branches}
                      onChange={val => formik.setFieldValue('branchId', val)}
                      value={formik.values.branchId}
                      optionLabel='name'
                      optionValue='id'
                    />
                    {formik.touched.branchId && formik.errors.branchId && (
                      <p className="text-red-500 text-xs mt-1">{formik.errors.branchId}</p>
                    )}
                  </div>
                )}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Số bàn *</label>
                  <input
                    name="tableNumber"
                    className={`input ${formik.touched.tableNumber && formik.errors.tableNumber ? 'border-red-500' : ''}`}
                    type="number"
                    value={formik.values.tableNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="VD: 1"
                  />
                  {formik.touched.tableNumber && formik.errors.tableNumber && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.tableNumber}</p>
                  )}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Số chỗ ngồi *</label>
                  <input
                    name="capacity"
                    className={`input ${formik.touched.capacity && formik.errors.capacity ? 'border-red-500' : ''}`}
                    type="number"
                    value={formik.values.capacity}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.capacity && formik.errors.capacity && (
                    <p className="text-red-500 text-xs mt-1">{formik.errors.capacity}</p>
                  )}
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Ghi chú</label>
                  <input
                    name="note"
                    className="input"
                    value={formik.values.note}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="VD: Gần cửa sổ"
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowForm(false); setEditTable(null); formik.resetForm(); }}>
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
                  style={{ width: '100%', height: 'auto', borderRadius: 8, border: '4px solid white' }
                  }
                />
              </div >

              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Bàn số {qrModal.tableNumber}</p>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>Khách hàng có thể quét mã này để đặt món</p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(getQRUrl(qrModal))}&size=500x500&bgcolor=ffffff`
                  const printWindow = window.open('', '_blank', 'width=500,height=700')
                  if (!printWindow) return
                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8" />
                        <title>QR Bàn ${qrModal.tableNumber}</title>
                        <style>
                          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                          * { margin: 0; padding: 0; box-sizing: border-box; }
                          body {
                            font-family: 'Inter', -apple-system, blinkmacsystemfont, 'Segoe UI', roboto, oxygen, ubuntu, cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            padding: 40px;
                            background: #fff;
                            color: #1e293b;
                          }
                          .container {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            text-align: center;
                            max-width: 400px;
                          }
                          .qr-wrapper {
                            padding: 24px;
                            background: #fff;
                            border: 2px solid #e2e8f0;
                            border-radius: 24px;
                            margin-bottom: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                          }
                          img {
                            width: 300px;
                            height: 300px;
                            display: block;
                          }
                          h1 {
                            font-size: 42px;
                            font-weight: 800;
                            margin-bottom: 12px;
                            letter-spacing: -0.02em;
                            color: #0f172a;
                          }
                          p {
                            font-size: 16px;
                            line-height: 1.5;
                            color: #64748b;
                            font-weight: 400;
                            max-width: 280px;
                          }
                          @media print {
                            body { padding: 0; }
                            .container { padding: 20px; }
                            @page { margin: 0; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <div class="qr-wrapper">
                            <img src="${qrUrl}" alt="QR Code" />
                          </div>
                          <h1>Bàn ${qrModal.tableNumber}</h1>
                          <p>Khách hàng có thể quét mã này để đặt món</p>
                        </div>
                        <script>
                          window.onload = function() {
                            setTimeout(() => {
                              window.print();
                              window.onafterprint = function() { window.close(); };
                            }, 500);
                          };
                        <\/script>
                      </body>
                    </html>
                  `)
                  printWindow.document.close()
                }}>
                  In mã QR
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setQrModal(null)}>
                  Đóng
                </button>
              </div>
            </div >
          </div >
        )}

        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title="Xác nhận xóa bàn"
          message="Bạn có chắc chắn muốn xóa bàn này không? Hành động này không thể hoàn tác."
          type="danger"
          onConfirm={deleteTable}
          onCancel={() => setConfirmDialog({ isOpen: false, id: null })}
        />
      </div >
    </AuthLayout >
  )
}


