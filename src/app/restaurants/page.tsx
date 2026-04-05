'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import { Building2, Save, Globe, Phone, Mail, MapPin, FileText, Share2, CheckCircle, AlertCircle, CreditCard } from 'lucide-react'
import { useRestaurant } from '@/hooks/useApi'
import { useAuth } from '@/lib/auth'

export default function RestaurantPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId || ''

  const { data: restaurant, isLoading, refetch } = useRestaurant(restaurantId)
  const [formData, setFormData] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  useEffect(() => {
    if (restaurant) setFormData({ ...restaurant })
  }, [restaurant])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/api/restaurant/${restaurantId}`, formData)
      refetch()
      showToast('success', 'Cập nhật thông tin thành công!')
    } catch {
      showToast('error', 'Lỗi khi cập nhật thông tin')
    } finally {
      setSaving(false)
    }
  }

  // Tài khoản cũ chưa có restaurantId trong token → cần đăng nhập lại
  if (!restaurantId) return (
    <AuthLayout>
      <div className="p-8 max-w-md mx-auto mt-24 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <Building2 size={38} className="text-amber-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-3">Phiên đăng nhập cũ</h2>
        <p className="text-gray-500 leading-relaxed">
          Vui lòng <strong className="text-gray-800">đăng xuất</strong> và <strong className="text-gray-800">đăng nhập lại</strong> để hệ thống nhận diện nhà hàng của bạn.
        </p>
      </div>
    </AuthLayout>
  )

  if (isLoading || !formData) return (
    <AuthLayout>
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Đang tải thông tin nhà hàng...</p>
        </div>
      </div>
    </AuthLayout>
  )

  return (
    <AuthLayout>
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl font-semibold text-sm animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-200">
                <Building2 size={32} />
              </div>
              Hồ sơ Nhà hàng
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Quản lý thông tin doanh nghiệp và nhận diện thương hiệu</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Save size={20} />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Info */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="text-blue-600" size={20} />
                Thông tin cơ bản
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Tên nhà hàng</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-lg"
                    placeholder="Tên nhà hàng của bạn"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Mô tả ngắn</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium resize-none"
                    placeholder="Giới thiệu về nhà hàng..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Mã số thuế</label>
                    <input
                      type="text"
                      value={formData.taxCode || ''}
                      onChange={e => setFormData({...formData, taxCode: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                      placeholder="0123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={formData.website || ''}
                        onChange={e => setFormData({...formData, website: e.target.value})}
                        className="w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Share2 className="text-blue-600" size={20} />
                Thông tin liên hệ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                      placeholder="028 1234 5678"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                      placeholder="info@nhahanng.com"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Địa chỉ trụ sở</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                      placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Info for VietQR */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="text-blue-600" size={20} />
                Thông tin thanh toán (VietQR)
              </h2>
              <p className="text-sm text-gray-500 mb-6 font-medium">Cấu hình thông tin ngân hàng để tự động tạo mã QR thanh toán Napas cho khách hàng.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Ngân hàng (Bank ID)</label>
                  <input
                    type="text"
                    value={formData.bankId || ''}
                    onChange={e => setFormData({...formData, bankId: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                    placeholder="VD: MB, VCB, ICB..."
                  />
                  <p className="text-[10px] text-gray-400 mt-2 px-1">Sử dụng mã BIN hoặc mã viết tắt của ngân hàng</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Số tài khoản</label>
                  <input
                    type="text"
                    value={formData.accountNo || ''}
                    onChange={e => setFormData({...formData, accountNo: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                    placeholder="Nhập số tài khoản ngân hàng"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Tên chủ tài khoản</label>
                  <input
                    type="text"
                    value={formData.accountName || ''}
                    onChange={e => setFormData({...formData, accountName: e.target.value})}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium uppercase"
                    placeholder="VD: NGUYEN VAN A"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Logo + Stats */}
          <div className="space-y-8">
            {/* Logo */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Logo nhà hàng</label>
              <div className="w-44 h-44 bg-gray-50 rounded-[2rem] mx-auto mb-5 flex items-center justify-center border-4 border-dashed border-gray-200 overflow-hidden group relative cursor-pointer">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" />
                ) : (
                  <div className="text-center">
                    <Building2 size={48} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-300 font-medium">Chưa có logo</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">Thay đổi ảnh</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Khuyến nghị 512×512px, định dạng PNG hoặc JPG</p>
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100">
              <h3 className="text-xl font-bold mb-6">Thông tin hệ thống</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="opacity-70 text-sm">Tên chủ sở hữu:</span>
                  <span className="font-bold text-sm">{user?.fullName || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="opacity-70 text-sm">Ngày tạo:</span>
                  <span className="font-medium text-sm">{formData.createdAt ? new Date(formData.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/20 pt-4">
                  <span className="opacity-70 text-sm">Số chi nhánh:</span>
                  <span className="font-black text-2xl">{restaurant?.branches?.length ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
