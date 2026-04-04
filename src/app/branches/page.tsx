'use client'

import { useState } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useBranches } from '@/hooks/useApi'
import { GitBranch, Plus, MapPin, Phone, Edit3, CheckCircle2, XCircle } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function BranchesPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId || ''

  const { data: branches, isLoading, refetch } = useBranches(restaurantId)
  const [showModal, setShowModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState<any>(null)
  const [formData, setFormData] = useState({ name: '', address: '', phone: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const openAddModal = () => {
    setEditingBranch(null)
    setFormData({ name: '', address: '', phone: '', isActive: true })
    setError('')
    setShowModal(true)
  }

  const openEditModal = (branch: any) => {
    setEditingBranch(branch)
    setFormData({ name: branch.name, address: branch.address, phone: branch.phone, isActive: branch.isActive })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) { setError('Vui lòng nhập tên chi nhánh'); return }
    setSaving(true)
    setError('')
    try {
      if (editingBranch) {
        await api.put(`/api/branches/${editingBranch.id}`, { ...formData, restaurantId })
      } else {
        await api.post('/api/branches', { ...formData, restaurantId })
      }
      await refetch()
      setShowModal(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi lưu chi nhánh')
    } finally {
      setSaving(false)
    }
  }

  if (!restaurantId) return (
    <AuthLayout>
      <div className="p-8 max-w-md mx-auto mt-24 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <GitBranch size={38} className="text-amber-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Phiên đăng nhập cũ</h2>
        <p className="text-gray-500 leading-relaxed mb-6">
          Vui lòng <strong className="text-gray-800">đăng xuất</strong> và <strong className="text-gray-800">đăng nhập lại</strong> để hệ thống nhận diện nhà hàng của bạn.
        </p>
      </div>
    </AuthLayout>
  )

  if (isLoading) return (
    <AuthLayout>
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Đang tải chi nhánh...</p>
        </div>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
                <GitBranch size={32} />
              </div>
              Quản lý Chi nhánh
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Thiết lập các cơ sở kinh doanh — hiện có <strong className="text-indigo-600">{branches?.length || 0}</strong> chi nhánh
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-2xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            Thêm chi nhánh mới
          </button>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches?.map((branch: any) => (
            <div key={branch.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 transition-all hover:shadow-xl hover:shadow-indigo-50/50 hover:-translate-y-1 group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-30 transition-opacity">
                 {branch.isActive ? <CheckCircle2 className="text-green-500" size={64} /> : <XCircle className="text-red-500" size={64} />}
               </div>

               <div className="flex items-start justify-between mb-5">
                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                   <GitBranch size={22} className="text-indigo-600" />
                 </div>
                 <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   {branch.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                 </span>
               </div>

               <h3 className="text-xl font-black text-gray-900 mb-5 pr-4 line-clamp-2">{branch.name}</h3>

               <div className="space-y-3 mb-6">
                 <div className="flex items-start gap-3">
                   <MapPin className="text-gray-400 mt-0.5 shrink-0" size={16} />
                   <p className="text-gray-600 text-sm font-medium leading-relaxed">{branch.address || '—'}</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <Phone className="text-gray-400 shrink-0" size={16} />
                   <p className="text-gray-600 text-sm font-medium">{branch.phone || '—'}</p>
                 </div>
               </div>

               <div className="pt-5 border-t border-gray-50">
                 <button
                   onClick={() => openEditModal(branch)}
                   className="w-full bg-gray-50 hover:bg-indigo-50 text-indigo-600 py-2.5 rounded-xl transition-all font-bold text-sm flex items-center justify-center gap-2"
                 >
                   <Edit3 size={16} />
                   Chỉnh sửa
                 </button>
               </div>
            </div>
          ))}

          {(!branches || branches.length === 0) && (
            <div className="col-span-full py-24 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
               <GitBranch className="mx-auto text-gray-300 mb-5" size={72} />
               <p className="text-gray-500 font-black text-xl mb-2">Chưa có chi nhánh nào</p>
               <p className="text-gray-400 text-sm mb-6">Hãy thêm chi nhánh đầu tiên để bắt đầu quản lý</p>
               <button onClick={openAddModal} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                 <Plus size={18} /> Thêm chi nhánh đầu tiên
               </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    {editingBranch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
                  </h2>
                  <p className="text-gray-400 text-sm mt-0.5">Điền thông tin chi nhánh bên dưới</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                  <XCircle size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-8 space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <XCircle size={16} /> {error}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tên chi nhánh *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="VD: Chi nhánh Quận 1"
                    className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium text-lg"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Địa chỉ</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM"
                    className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="VD: 028 1234 5678"
                    className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${formData.isActive ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="font-bold text-gray-700">Chi nhánh đang hoạt động</span>
                </label>
              </div>

              <div className="p-8 border-t border-gray-100 flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100"
                >
                  {saving ? 'Đang lưu...' : (editingBranch ? 'Cập nhật' : 'Tạo chi nhánh')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
