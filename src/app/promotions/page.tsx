'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import {
  TicketPercent,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Gift,
  Tag,
  Pencil,
} from 'lucide-react'
import { VoucherDetailModal } from './components/VoucherDetailModal'
import { CreatePromoteModal } from './components/CreatePromoteModal'

const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001'

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showVouchersModal, setShowVouchersModal] = useState(false)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | any>(null)
  const [vouchersList, setVouchersList] = useState<VoucherCode[]>([])

  // Edit state
  const [editPromotion, setEditPromotion] = useState<Promotion | null>(null)

  const loadPromotions = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/promotions/restaurant/${RESTAURANT_ID}`)
      console.log(data);
      
      setPromotions(data)
    } catch (err) {
      console.error(err)
      setPromotions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPromotions()
  }, [])

  const toggleStatus = async (promo: Promotion) => {
    try {
      await api.patch(`/api/promotions/${promo.id}/toggle`)
      loadPromotions()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) return
    try {
      await api.delete(`/api/promotions/${id}`)
      loadPromotions()
    } catch (err) {
      console.error(err)
    }
  }

  const handleEdit = (promo: Promotion) => {
    setEditPromotion(promo)
    setShowModal(true)
  }

  const handleCreateNew = () => {
    setEditPromotion(null)
    setShowModal(true)
  }

  const handleModalClose = (isShow: boolean) => {
    setShowModal(isShow)
    if (!isShow) setEditPromotion(null)
  }

  const viewVouchers = async (promo: Promotion) => {
    setSelectedPromotion(promo)
    setShowVouchersModal(true)
    try {
      const { data } = await api.get(`/api/promotions/${promo.id}/vouchers`)
      setVouchersList(data || [])
    } catch (err) {
      console.error(err)
      setVouchersList([])
    }
  }

  return (
    <AuthLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <TicketPercent className="text-blue-600" size={32} />
              Khuyến mãi &amp; Vouchers
            </h1>
            <p className="text-gray-500 mt-1">Quản lý các chương trình giảm giá và mã quà tặng</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            Tạo khuyến mãi mới
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Đang hoạt động</p>
                <p className="text-2xl font-bold">{promotions.filter(p => p.isActive).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sắp diễn ra</p>
                <p className="text-2xl font-bold">{promotions.filter(p => new Date(p.startDate) > new Date()).length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <Gift size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Mã Voucher đã tạo</p>
                <p className="text-2xl font-bold">128</p>
              </div>
            </div>
          </div>
        </div>

        {/* Promotions Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 animate-pulse">Đang tải danh sách khuyến mãi...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <TicketPercent className="text-gray-300" size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có chương trình khuyến mãi nào</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-8">Hãy tạo chương trình đầu tiên để thu hút khách hàng đến với nhà hàng của bạn.</p>
            <button
              onClick={handleCreateNew}
              className="text-blue-600 font-bold hover:underline"
            >
              + Tạo khuyến mãi ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {promotions.map((promo) => (
              <div key={promo.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${promo.isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Tag size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{promo.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-1">{promo.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={promo.isActive}
                          onChange={() => toggleStatus(promo)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <span className={`text-xs font-bold uppercase tracking-wider ${promo.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                        {promo.isActive ? 'ĐANG CHẠY' : 'DỪNG'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Mức giảm</p>
                      <p className="text-2xl font-black text-blue-600">
                        {promo.type === 'percentage' ? `${promo.discountValue}%` : `${promo.discountValue.toLocaleString()}đ`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Đơn tối thiểu</p>
                      <p className="text-lg font-bold text-gray-900">
                        {promo.minOrderAmount ? `${promo.minOrderAmount.toLocaleString()}đ` : 'Không có'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-gray-400" />
                      <span>{new Date(promo.startDate).toLocaleDateString('vi-VN')} - {new Date(promo.endDate).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-gray-900">
                      <Plus size={14} />
                      {promo.voucherCodes?.length || 0} mã
                    </div>
                  </div>
                </div>

                {/* Action bar — hiện khi hover */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => viewVouchers(promo)}
                    className="text-blue-600 text-sm font-bold hover:underline"
                  >
                    Xem chi tiết &amp; Mã Voucher
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="flex items-center gap-1.5 text-amber-600 text-sm font-bold hover:underline"
                    >
                      <Pencil size={14} />
                      Sửa
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-red-500 text-sm font-bold hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Promote Modal */}
        <CreatePromoteModal
          setShowModal={handleModalClose}
          visible={showModal}
          editPromotion={editPromotion ?? undefined}
          onSuccess={loadPromotions}
        />

        {/* Voucher Modal */}
        <VoucherDetailModal
          setShowModal={setShowVouchersModal}
          visible={showVouchersModal}
          selectedPromotion={selectedPromotion}
          vouchersList={vouchersList}
        />
      </div>
    </AuthLayout>
  )
}
