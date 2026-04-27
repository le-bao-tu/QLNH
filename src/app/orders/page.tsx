'use client'

import { useEffect, useState } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { ShoppingCart, X, CreditCard, Printer, CheckCircle, Search } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import InvoicePrintModal, { type InvoiceData } from '@/components/InvoicePrintModal'
import { useRestaurant, useBranches, useOrders } from '@/hooks/useApi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { SelectBox } from '@/components/SelectBox'

interface Order { id: string; tableNumber: number; status: string; subtotal: number; totalAmount: number; itemCount: number; createdAt: string }

const ORDER_ITEM_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ xử lý', className: 'badge-pending' },
  cooking: { label: 'Đang làm', className: 'badge-cooking' },
  ready: { label: 'Sẵn sàng', className: 'badge-ready' },
  served: { label: 'Đã phục vụ', className: 'badge-served' },
  paid: { label: 'Đã thanh toán', className: 'badge-paid' },
  cancelled: { label: 'Đã hủy', className: 'badge-cancelled' },
}

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ xử lý', className: 'badge-pending' },
  preparing: { label: 'Đang làm', className: 'badge-cooking' },
  ready: { label: 'Sẵn sàng', className: 'badge-ready' },
  served: { label: 'Đã phục vụ', className: 'badge-served' },
  paid: { label: 'Đã thanh toán', className: 'badge-paid' },
  cancelled: { label: 'Đã hủy', className: 'badge-cancelled' },
}

export default function OrdersPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId || ''
  const branchId = user?.branchId || ''
  const isOwner = user?.isOwner
  const queryClient = useQueryClient()
  const toast = useToast()

  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [orderDetail, setOrderDetail] = useState<any>(null)
  const [paymentModal, setPaymentModal] = useState<any>(null)
  const [payMethod, setPayMethod] = useState('cash')
  const [paying, setPaying] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, action: 'pay' | null }>({ isOpen: false, action: null })
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branchId)

  const { pageIndex, pageSize, search, setSearch, setPage, paginationParams } = usePagination(20)
  const { data: orderData, isLoading } = useOrders(restaurantId, selectedBranchId, { ...paginationParams, status: filterStatus })

  const orders = orderData?.items || (Array.isArray(orderData) ? orderData : [])
  const totalCount = orderData?.totalCount || orders.length
  const totalPages = orderData?.totalPages || 1

  const { data: restaurant } = useRestaurant(restaurantId)
  const { data: branchs = [] } = useBranches(restaurantId)

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => api.patch(`/api/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['active-orders'] })
      toast.success('Cập nhật trạng thái đơn hàng thành công')
    },
    onError: () => toast.error('Cập nhật trạng thái đơn hàng thất bại')
  })

  // Invoice state
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)

  const loadDetail = async (orderId: string) => {
    if (selectedOrder === orderId) { setSelectedOrder(null); setOrderDetail(null); return }
    setSelectedOrder(orderId)
    const { data } = await api.get(`/api/orders/${orderId}`)
    setOrderDetail(data)
  }

  const handleOpenPayment = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const { data } = await api.get(`/api/orders/${order.id}`)
      setPaymentModal(data)
    } catch (err) {
      toast.error("Không thể tải thông tin đơn hàng")
    }
  }

  const handleConfirmPayment = () => {
    if (!paymentModal) return
    setConfirmDialog({ isOpen: true, action: 'pay' })
  }

  const executePayment = async () => {
    if (!paymentModal) return
    setPaying(true)
    try {
      await api.post('/api/payment', {
        orderId: paymentModal.id,
        amount: paymentModal.totalAmount,
        method: payMethod,
        note: `Thanh toán tại màn quản lý đơn hàng`
      })

      setPaymentModal(null)
      setConfirmDialog({ isOpen: false, action: null })
      toast.success('Thanh toán thành công')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    } catch (err) {
      toast.error('Có lỗi xảy ra khi thanh toán')
    } finally {
      setPaying(false)
    }
  }

  const handlePrintFromModal = async () => {
    if (!paymentModal) return
    const orderDetail = paymentModal
    const sub = orderDetail.subtotal ?? 0
    const discountAmt = orderDetail.discountAmount ?? 0
    const taxAmt = orderDetail.taxAmount ?? Math.round((sub - discountAmt) * 0.1)
    const finalTotal = orderDetail.totalAmount ?? Math.max(0, sub - discountAmt + taxAmt)

    const invoice: InvoiceData = {
      orderId: orderDetail.id,
      tableNumber: orderDetail.tableNumber,
      items: (orderDetail.items || [])
        .filter((i: any) => i.status !== 'awaiting_confirmation')
        .map((i: any) => ({
          menuItemName: i.menuItemName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          originalPrice: i.originalPrice,
          subTotal: i.subTotal,
          note: i.note,
        })),
      subtotal: sub,
      discountAmount: discountAmt,
      taxAmount: taxAmt,
      totalAmount: finalTotal,
      paymentMethod: payMethod === 'cash' ? 'Tiền mặt' : payMethod === 'card' ? 'Thẻ' : 'Chuyển khoản',
      restaurantName: restaurant?.name,
      restaurantAddress: restaurant?.address,
      restaurantPhone: restaurant?.phone,
      createdAt: orderDetail.createdAt,
      bankId: restaurant?.bankId,
      bankOwner: restaurant?.bankOwner,
      bankNumber: restaurant?.bankNumber,
      branchs: branchs || []
    }
    setInvoiceData(invoice)
    setShowInvoice(true)
  }

  useEffect(() => {
    if (isOwner && branchs.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branchs[0].id)
    }
  }, [isOwner, branchs, selectedBranchId])


  return (
    <AuthLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={22} color="#2563eb" />
              Quản lý đơn hàng
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>{totalCount} đơn hàng</p>
          </div>
          {
            isOwner && (
              <div className='w-52'>
                <SelectBox value={selectedBranchId} options={branchs} optionLabel='name' optionValue='id' onChange={(val) => setSelectedBranchId(val)} />
              </div>
            )
          }
        </div>

        {/* Filter and Search */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'pending', label: 'Chờ xử lý' },
              { key: 'preparing', label: 'Đang làm' },
              { key: 'ready', label: 'Sẵn sàng' },
              { key: 'paid', label: 'Đã thanh toán' },
              { key: 'cancelled', label: 'Đã hủy' },
            ].map(f => (
              <button
                key={f.key}
                className={`btn btn-sm ${filterStatus === f.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setFilterStatus(f.key); setPage(1); }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, height: 32, fontSize: 13 }}
              placeholder="Tìm theo số bàn..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Orders list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map((order: Order) => (
            <div key={order.id}>
              <div
                className="card"
                style={{
                  padding: '14px 20px', cursor: 'pointer',
                  border: selectedOrder === order.id ? '2px solid #2563eb' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
                onClick={() => loadDetail(order.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, background: '#dbeafe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 800, color: '#1d4ed8'
                    }}>
                      {order.tableNumber}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Bàn {order.tableNumber}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {order.itemCount} món · {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className={`badge badge-${order.status}`}>
                      {ORDER_STATUS[order.status]?.label || order.status}
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      {order.totalAmount.toLocaleString('vi-VN')}đ (Đã bao gồm thuế)
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {order.status !== 'paid' && order.status !== 'cancelled' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={e => handleOpenPayment(order, e)}
                        >
                          Thanh toán
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: order.id, status: 'served' }) }}
                        >
                          Đã phục vụ
                        </button>
                      )}
                      {order.status === 'paid' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={e => handleOpenPayment(order, e)}
                        >
                          Hóa đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order detail */}
                {selectedOrder === order.id && orderDetail && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {((orderDetail.items as Array<any>) || [])
                        .filter(item => item.status !== 'awaiting_confirmation')
                        .map((item) => (
                          <div key={item.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '6px 10px', background: '#f8fafc', borderRadius: 6
                          }}>
                            <div>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{item.menuItemName}</span>
                              <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 8 }}>x{item.quantity}</span>
                              {item.note && <span style={{ color: '#94a3b8', fontSize: 11, marginLeft: 8 }}>({item.note})</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span className={`badge badge-${item.status}`} style={{ fontSize: 10 }}>{ORDER_ITEM_STATUS[item.status]?.label || item.status}</span>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>{item.subTotal.toLocaleString('vi-VN')}đ</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalCount > 0 && (
          <div className="mt-8">
            <Pagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}

        {orders.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <ShoppingCart size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>Không có đơn hàng nào</p>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <CreditCard size={20} /> {paymentModal.status === 'paid' ? 'Chi tiết hóa đơn' : 'Xác nhận thanh toán'}
                  </h2>
                  <p className="text-blue-200 text-sm mt-0.5">Bàn #{paymentModal.tableNumber}</p>
                </div>
                <button onClick={() => setPaymentModal(null)} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Order Items */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Chi tiết đơn hàng</p>
                <div className="space-y-2">
                  {(paymentModal.items || [])
                    .filter((item: any) => item.status !== 'awaiting_confirmation')
                    .map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0">{item.quantity}</span>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-gray-800 truncate">{item.menuItemName}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <span className="text-sm font-black text-gray-900">{item.subTotal.toLocaleString()}đ</span>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Totals */}
                <div className="mt-6 bg-gray-50 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>Tạm tính</span>
                    <span>{paymentModal.subtotal.toLocaleString()}đ</span>
                  </div>
                  {paymentModal.discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-green-600 font-bold">
                      <span>Giảm giá</span>
                      <span>-{paymentModal.discountAmount.toLocaleString()}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>VAT (10%)</span>
                    <span>{paymentModal.taxAmount.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-1">
                    <span className="font-black text-gray-900">Tổng cộng</span>
                    <span className="text-xl font-black text-blue-600">{paymentModal.totalAmount.toLocaleString()}đ</span>
                  </div>
                </div>

                {/* Payment Method */}
                {paymentModal.status !== 'paid' && (
                  <div className="mt-6">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Phương thức thanh toán</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'cash', label: 'Tiền mặt', icon: '💵' },
                        { value: 'card', label: ' Thẻ', icon: '💳' },
                        { value: 'transfer', label: 'Chuyển khoản', icon: '🔄' },
                      ].map(m => (
                        <button
                          key={m.value}
                          onClick={() => setPayMethod(m.value)}
                          className={`py-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${payMethod === m.value ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                        >
                          <span className="text-lg">{m.icon}</span>
                          <span className={`text-[10px] font-black uppercase ${payMethod === m.value ? 'text-blue-600' : 'text-gray-500'}`}>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 bg-gray-50 border-t flex gap-3 flex-shrink-0">
                <button onClick={() => setPaymentModal(null)} className="py-3 px-5 bg-gray-200 hover:bg-gray-300 rounded-2xl font-black uppercase text-xs transition-colors">
                  Đóng
                </button>
                <button onClick={handlePrintFromModal} className="flex items-center gap-2 bg-gray-800 text-white px-5 rounded-2xl font-black uppercase text-xs shadow-md transition-opacity">
                  <Printer size={14} /> In HĐ
                </button>
                {paymentModal.status !== 'paid' && (
                  <button
                    disabled={paying}
                    onClick={handleConfirmPayment}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle size={16} />
                    {paying ? 'Đang xử lý...' : `Xác nhận · ${paymentModal.totalAmount.toLocaleString()}đ`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title="Xác nhận thanh toán"
          message={`Xác nhận khách tại bàn ${paymentModal?.tableNumber} đã thanh toán số tiền ${paymentModal?.totalAmount?.toLocaleString()}đ?`}
          type="info"
          confirmText="Đã thanh toán"
          isLoading={paying}
          onConfirm={executePayment}
          onCancel={() => setConfirmDialog({ isOpen: false, action: null })}
        />

        {/* Invoice Print Modal */}
        {showInvoice && invoiceData && (
          <InvoicePrintModal
            data={invoiceData}
            onClose={() => { setShowInvoice(false); setInvoiceData(null) }}
          />
        )}
      </div>
    </AuthLayout>
  )
}
