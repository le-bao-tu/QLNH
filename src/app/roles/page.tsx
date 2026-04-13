'use client'

import { useState } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useAuth } from '@/lib/auth'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '@/hooks/useApi'
import { Plus, Edit2, Trash2, KeyRound, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react'

const AVAILABLE_PERMISSIONS = [
  { id: 'DASHBOARD', label: 'Dashboard', desc: 'Xem thống kê tổng quan' },
  { id: 'POS', label: 'POS - Bán hàng', desc: 'Tạo đơn và bán hàng' },
  { id: 'KITCHEN', label: 'Bếp (KDS)', desc: 'Xem màn hình bếp' },
  { id: 'ORDERS', label: 'Đơn hàng', desc: 'Quản lý các đơn hàng' },
  { id: 'TABLES', label: 'Quản lý bàn', desc: 'Thiết lập trạng thái bàn' },
  { id: 'RESERVATIONS', label: 'Đặt bàn', desc: 'Quản lý lịch đặt bàn' },
  { id: 'MENU', label: 'Thực đơn', desc: 'Sửa danh mục và món ăn' },
  { id: 'PAYMENTS', label: 'Thanh toán', desc: 'Xem giao dịch thanh toán' },
  { id: 'PROMOTIONS', label: 'Khuyến mãi', desc: 'Tạo mã voucher, giảm giá' },
  { id: 'ACCOUNTS', label: 'Tài khoản', desc: 'Quản lý tài khoản nhân viên' },
  { id: 'RESTAURANTS', label: 'Nhà hàng', desc: 'Cấu hình nhà hàng' },
  { id: 'BRANCHES', label: 'Chi nhánh', desc: 'Khai báo chi nhánh' },
  { id: 'AUDIT', label: 'Audit Log', desc: 'Xem log hệ thống' },
]

export default function RolesPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId || ''
  
  const { data: roles = [], isLoading } = useRoles(restaurantId)
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  })

  const handleOpenModal = (role?: any) => {
    if (role) {
      setEditingRole(role)
      setFormData({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions || []
      })
    } else {
      setEditingRole(null)
      setFormData({ name: '', description: '', permissions: [] })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingRole(null)
  }

  const handleTogglePermission = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id) 
        ? prev.permissions.filter(p => p !== id)
        : [...prev.permissions, id]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRole) {
        await updateRole.mutateAsync({ id: editingRole.id, ...formData })
      } else {
        await createRole.mutateAsync({ restaurantId, ...formData })
      }
      handleCloseModal()
    } catch (error) {
      console.error(error)
      alert('Đã xảy ra lỗi khi lưu vai trò.')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      await deleteRole.mutateAsync(id)
    }
  }

  return (
    <AuthLayout>
      <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                <KeyRound size={28} />
              </div>
              Quản lý Vai trò & Phân quyền
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Thiết lập các nhóm quyền hạn cho nhân viên trong hệ thống</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            <Plus size={20} /> Thêm vai trò
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400 font-medium">Đang tải dữ liệu...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role: any) => (
              <div key={role.id} className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{role.name}</h3>
                      <p className="text-xs text-gray-400">{role.permissions.length} quyền được cấp</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(role)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(role.id)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">
                  {role.description || 'Chưa có mô tả'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.slice(0, 4).map((p: string) => (
                    <span key={p} className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold border border-gray-100">
                      {p}
                    </span>
                  ))}
                  {role.permissions.length > 4 && (
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                      +{role.permissions.length - 4} nữa
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCloseModal}></div>
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl relative z-10 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-black">{editingRole ? 'Sửa vai trò' : 'Thêm vai trò mới'}</h2>
                <button onClick={handleCloseModal} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto flex-1">
                <form id="roleForm" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Tên vai trò <span className="text-red-500">*</span></label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-medium"
                        placeholder="VD: Thu ngân"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Mô tả</label>
                      <input 
                        type="text" 
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-medium"
                        placeholder="Mô tả chức năng chính..."
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-bold text-gray-700">Quyền truy cập</label>
                      <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                        Đã chọn {formData.permissions.length} quyền
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {AVAILABLE_PERMISSIONS.map(perm => {
                        const isSelected = formData.permissions.includes(perm.id)
                        return (
                          <div 
                            key={perm.id}
                            onClick={() => handleTogglePermission(perm.id)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                              isSelected ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-gray-200 bg-white'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                            }`}>
                              {isSelected && <Check size={14} strokeWidth={3} />}
                            </div>
                            <div>
                              <p className={`font-bold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>{perm.label}</p>
                              <p className={`text-xs mt-1 ${isSelected ? 'text-indigo-600/80' : 'text-gray-500'}`}>{perm.desc}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-[2.5rem]">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">
                  Hủy
                </button>
                <button type="submit" form="roleForm" className="px-8 py-3 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                  <ShieldAlert size={18} />
                  Lưu thiết lập
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthLayout>
  )
}
