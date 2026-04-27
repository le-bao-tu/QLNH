'use client'

import { useState, useEffect, useRef } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import React from 'react'
import { Building2, Save, Globe, Phone, Mail, MapPin, FileText, Share2, CheckCircle, AlertCircle, CreditCard, UploadCloud } from 'lucide-react'
import { useRestaurant } from '@/hooks/useApi'
import { useAuth } from '@/lib/auth'

export default function RestaurantPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId || ''
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const toastTimeoutRef = useRef<number | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current)
    }
    setToast({ type, msg })
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 3000)
  }

  const { data: restaurant, isLoading, refetch } = useRestaurant(restaurantId)

  const validationSchema = Yup.object({
    name: Yup.string().required('Tên nhà hàng là bắt buộc').max(100, 'Tối đa 100 ký tự'),
    description: Yup.string().max(500, 'Tối đa 500 ký tự'),
    taxCode: Yup.string().max(20, 'Tối đa 20 ký tự'),
    website: Yup.string().url('Website không hợp lệ').nullable(),
    phone: Yup.string().required('Số điện thoại là bắt buộc').max(20, 'Tối đa 20 ký tự'),
    email: Yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
    address: Yup.string().required('Địa chỉ là bắt buộc').max(200, 'Tối đa 200 ký tự'),
    bankId: Yup.string().max(20, 'Tối đa 20 ký tự'),
    bankNumber: Yup.string().max(30, 'Tối đa 30 ký tự'),
    bankOwner: Yup.string().max(100, 'Tối đa 100 ký tự'),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      taxCode: '',
      website: '',
      phone: '',
      email: '',
      address: '',
      bankId: '',
      bankNumber: '',
      bankOwner: '',
      logoUrl: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        await api.put(`/api/restaurants/${restaurantId}`, values);
        refetch();
        showToast('success', 'Cập nhật thông tin thành công!');
      } catch {
        showToast('error', 'Lỗi khi cập nhật thông tin');
      } finally {
        setSaving(false);
      }
    }
  });

  useEffect(() => {
    if (restaurant) {
      formik.setValues({
        name: restaurant.name || '',
        description: restaurant.description || '',
        taxCode: restaurant.taxCode || '',
        website: restaurant.website || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        address: restaurant.address || '',
        bankId: restaurant.bankId || '',
        bankNumber: restaurant.bankNumber || '',
        bankOwner: restaurant.bankOwner || '',
        logoUrl: restaurant.logoUrl || ''
      });
    }
  }, [restaurant]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Vui lòng chọn file ảnh hợp lệ')
      return
    }

    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post(`/api/restaurants/${restaurantId}/upload-logo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      formik.setFieldValue('logoUrl', res.data.logoUrl);
      showToast('success', 'Tải logo lên thành công! (Hãy bấm Lưu thay đổi)')
    } catch {
      showToast('error', 'Lỗi khi tải logo lên')
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
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

  if (isLoading || !restaurant) return (
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
            onClick={() => formik.handleSubmit()}
            disabled={saving || !formik.isValid}
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
                      name="name"
                      type="text"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-lg ${formik.touched.name && formik.errors.name ? 'ring-2 ring-red-500' : ''}`}
                      placeholder="Tên nhà hàng của bạn"
                    />
                    {formik.touched.name && formik.errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{formik.errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Mô tả ngắn</label>
                    <textarea
                      name="description"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      rows={3}
                      className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium resize-none"
                      placeholder="Giới thiệu về nhà hàng..."
                    />
                  </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Mã số thuế</label>
                      <input
                        name="taxCode"
                        type="text"
                        value={formik.values.taxCode}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                        placeholder="0123456789"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Website</label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          name="website"
                          type="text"
                          value={formik.values.website}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          className={`w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium ${formik.touched.website && formik.errors.website ? 'ring-2 ring-red-500' : ''}`}
                          placeholder="https://..."
                        />
                      </div>
                      {formik.touched.website && formik.errors.website && <p className="text-red-500 text-xs mt-1 font-bold px-1">{formik.errors.website}</p>}
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
                      name="phone"
                      type="text"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium ${formik.touched.phone && formik.errors.phone ? 'ring-2 ring-red-500' : ''}`}
                      placeholder="028 1234 5678"
                    />
                  </div>
                  {formik.touched.phone && formik.errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{formik.errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      name="email"
                      type="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium ${formik.touched.email && formik.errors.email ? 'ring-2 ring-red-500' : ''}`}
                      placeholder="info@nhahanng.com"
                    />
                  </div>
                  {formik.touched.email && formik.errors.email && <p className="text-red-500 text-xs mt-1 font-bold">{formik.errors.email}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Địa chỉ trụ sở</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      name="address"
                      type="text"
                      value={formik.values.address}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium ${formik.touched.address && formik.errors.address ? 'ring-2 ring-red-500' : ''}`}
                      placeholder="123 Đường ABC, Quận 1, TP.HCM"
                    />
                  </div>
                  {formik.touched.address && formik.errors.address && <p className="text-red-500 text-xs mt-1 font-bold">{formik.errors.address}</p>}
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
                    name="bankId"
                    type="text"
                    value={formik.values.bankId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                    placeholder="VD: MB, VCB, ICB..."
                  />
                  <p className="text-[10px] text-gray-400 mt-2 px-1">Sử dụng mã BIN hoặc mã viết tắt của ngân hàng</p>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Số tài khoản</label>
                  <input
                    name="bankNumber"
                    type="text"
                    value={formik.values.bankNumber}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full bg-gray-50 border-0 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                    placeholder="Nhập số tài khoản ngân hàng"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Tên chủ tài khoản</label>
                  <input
                    name="bankOwner"
                    type="text"
                    value={formik.values.bankOwner}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
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
              
              <input
                type="file"
                ref={logoInputRef}
                className="hidden"
                accept="image/jpeg, image/png, image/webp, image/gif"
                onChange={handleLogoUpload}
              />

              <div 
                className={`w-44 h-44 bg-gray-50 rounded-[2rem] mx-auto mb-5 flex items-center justify-center border-4 border-dashed border-gray-200 overflow-hidden group relative cursor-pointer ${uploadingLogo ? 'opacity-50' : ''}`}
                onClick={() => !uploadingLogo && logoInputRef.current?.click()}
              >
                {formik.values.logoUrl ? (
                  <img src={formik.values.logoUrl} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-110" />
                ) : (
                  <div className="text-center">
                    <Building2 size={48} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-300 font-medium">Chưa có logo</p>
                  </div>
                )}
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <UploadCloud className="text-white mb-2" size={24} />
                  <span className="text-white text-xs font-bold">Thay đổi ảnh</span>
                </div>
                
                {/* Uploading loading overlay */}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                )}
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
                  <span className="font-medium text-sm">{restaurant?.createdAt ? new Date(restaurant.createdAt).toLocaleDateString('vi-VN') : '—'}</span>
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
