'use client'

import { useState } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useActiveOrders, useUpdateOrderStatus } from '@/hooks/useApi'
import { ShoppingCart, Clock, CheckCircle, Filter } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface Order { id: string; tableNumber: number; status: string; subtotal: number; totalAmount: number; itemCount: number; createdAt: string }

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ xử lý', className: 'badge-pending' },
  preparing: { label: 'Đang làm', className: 'badge-preparing' },
  ready: { label: 'Sẵn sàng', className: 'badge-ready' },
  served: { label: 'Đã phục vụ', className: 'badge-served' },
  paid: { label: 'Đã thanh toán', className: 'badge-paid' },
  cancelled: { label: 'Đã hủy', className: 'badge-cancelled' },
}

export default function OrdersPage() {
  const { user } = useAuth()
  const branchId = user?.branchId || ''

  const { data: orders = [], isLoading } = useActiveOrders(branchId)
  const updateStatus = useUpdateOrderStatus()
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [orderDetail, setOrderDetail] = useState<Record<string, unknown> | null>(null)
  const [paymentModal, setPaymentModal] = useState<string | null>(null)
  const [payMethod, setPayMethod] = useState('cash')
  const [discount, setDiscount] = useState('0')
  const [paying, setPaying] = useState(false)
console.log(orders);

  const filtered = filterStatus === 'all' ? orders : orders.filter((o: Order) => o.status === filterStatus)

  const loadDetail = async (orderId: string) => {
    if (selectedOrder === orderId) { setSelectedOrder(null); setOrderDetail(null); return }
    setSelectedOrder(orderId)
    const { data } = await api.get(`/api/orders/${orderId}`)
    setOrderDetail(data)
  }

  const handlePayment = async () => {
    if (!paymentModal) return
    setPaying(true)
    try {
      await api.post('/api/payments', {
        orderId: paymentModal,
        discount: parseFloat(discount),
        paymentMethod: payMethod,
      })
      setPaymentModal(null)
      setDiscount('0')
      updateStatus.mutate({ id: paymentModal, status: 'paid' })
    } finally { setPaying(false) }
  }

  return (
    <AuthLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={22} color="#2563eb" />
              Quản lý đơn hàng
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>{orders.length} đơn đang hoạt động</p>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Chờ xử lý' },
            { key: 'preparing', label: 'Đang làm' },
            { key: 'ready', label: 'Sẵn sàng' },
            { key: 'served', label: 'Đã phục vụ' },
          ].map(f => (
            <button
              key={f.key}
              className={`btn btn-sm ${filterStatus === f.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((order: Order) => (
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
                      {STATUS_MAP[order.status]?.label || order.status}
                    </span>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      {order.totalAmount.toLocaleString('vi-VN')}đ (Đã bao gồm thuế)
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {order.status !== 'paid' && order.status !== 'cancelled' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={e => { e.stopPropagation(); setPaymentModal(order.id) }}
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
                    </div>
                  </div>
                </div>

                {/* Order detail */}
                {selectedOrder === order.id && orderDetail && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {((orderDetail.items as Array<{ id: string; menuItemName: string; quantity: number; unitPrice: number; subTotal: number; status: string; note?: string }>) || []).map((item) => (
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
                            <span className={`badge badge-${item.status}`} style={{ fontSize: 10 }}>{item.status}</span>
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

        {filtered.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            <ShoppingCart size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>Không có đơn hàng nào</p>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card animate-fade-in" style={{ padding: 32, width: 400 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Thanh toán đơn hàng</h2>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Phương thức thanh toán</label>
                <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option value="cash">💵 Tiền mặt</option>
                  <option value="card">💳 Thẻ</option>
                  <option value="transfer">🔄 Chuyển khoản</option>
                  <option value="momo">📱 MoMo</option>
                  <option value="vnpay">💻 VNPay</option>
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Giảm giá (VNĐ)</label>
                <input className="input" type="number" value={discount} onChange={e => setDiscount(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPaymentModal(null)}>Hủy</button>
                <button className="btn btn-success" style={{ flex: 1 }} onClick={handlePayment} disabled={paying} id="confirm-payment-btn">
                  {paying ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
