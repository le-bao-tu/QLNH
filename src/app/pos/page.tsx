'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import {
  useTables,
  useMenuCategories,
  useMenuItems,
  useCreateOrder,
  useAddOrderItem,
  useCustomers,
  usePromotions
} from '@/hooks/useApi'
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Search,
  ChefHat,
  User,
  TicketPercent,
  CreditCard,
  History,
  Info,
  ChevronRight,
  UtensilsCrossed
} from 'lucide-react'
import api from '@/lib/api'

const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001'
const BRANCH_ID = '00000000-0000-0000-0000-000000000001'

interface CartItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
  note?: string
}

interface Customer {
  id: string
  fullName: string
  phone: string
  loyaltyPoints: number
  loyaltyTier: string
}

export default function POSPage() {
  const [selectedTable, setSelectedTable] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [orderNote, setOrderNote] = useState('')

  // Advanced Features
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null)

  const [orderSuccess, setOrderSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: tables = [], refetch: refetchTables } = useTables(BRANCH_ID)
  const { data: categories = [] } = useMenuCategories(RESTAURANT_ID)
  const { data: allItems = [] } = useMenuItems(RESTAURANT_ID)
  const { data: customers = [] } = useCustomers(RESTAURANT_ID, customerSearch)

  const createOrder = useCreateOrder()
  const addOrderItem = useAddOrderItem()

  const filteredItems = allItems.filter((item: any) => {
    const matchCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch && item.isAvailable
  })

  // Calculate Totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  let discount = 0
  if (appliedPromotion && appliedPromotion.promotion) {
    const p = appliedPromotion.promotion
    if (p.applyTo === 'bill') {
      if (p.type === 'percentage') {
        discount = (subtotal * p.discountValue) / 100
        if (p.maxDiscount && discount > p.maxDiscount) {
          discount = p.maxDiscount
        }
      } else {
        discount = p.discountValue
      }
    } else if (p.applyTo === 'item') {
      let totalItemDiscount = 0
      cart.forEach(item => {
        let itemDiscountAmount = 0
        if (p.type === 'percentage') {
          itemDiscountAmount = (item.price * p.discountValue) / 100
        } else {
          itemDiscountAmount = p.discountValue
        }
        if (itemDiscountAmount > item.price) itemDiscountAmount = item.price
        totalItemDiscount += itemDiscountAmount * item.quantity
      })
      discount = totalItemDiscount
    }
  }
  const total = Math.max(0, subtotal - discount)

  const getDiscountedItemPrice = (item: CartItem) => {
    if (!appliedPromotion || !appliedPromotion.promotion || appliedPromotion.promotion.applyTo !== 'item') return item.price
    const p = appliedPromotion.promotion
    let itemDiscountAmount = 0
    if (p.type === 'percentage') {
      itemDiscountAmount = (item.price * p.discountValue) / 100
    } else {
      itemDiscountAmount = p.discountValue
    }
    return Math.max(0, item.price - itemDiscountAmount)
  }

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id)
      if (existing) {
        return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }]
    })
  }

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.menuItemId !== menuItemId) return c
      const newQty = c.quantity + delta
      return newQty <= 0 ? c : { ...c, quantity: newQty }
    }).filter(c => c.quantity > 0))
  }

  const applyVoucher = async () => {
    if (!voucherCode) return
    try {
      const { data } = await api.get(`/api/promotions/vouchers/validate`, {
        params: { code: voucherCode, orderAmount: subtotal }
      })
      setAppliedPromotion(data)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Mã không hợp lệ')
      setAppliedPromotion(null)
    }
  }

  const handleSendToKitchen = async () => {
    if (!selectedTable || cart.length === 0) return
    setLoading(true)
    try {
      if (selectedTable.currentOrderId) {
        // Append to existing order
        for (const item of cart) {
          await addOrderItem.mutateAsync({
            orderId: selectedTable.currentOrderId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            note: item.note,
          })
        }
      } else {
        // Create new order
        await createOrder.mutateAsync({
          tableId: selectedTable.id,
          customerId: selectedCustomer?.id,
          guestCount: 1,
          note: orderNote,
          items: cart.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            note: item.note,
          }))
        })
      }
      setCart([])
      setSelectedCustomer(null)
      setAppliedPromotion(null)
      setVoucherCode('')
      setOrderSuccess(true)
      refetchTables()
      setTimeout(() => setOrderSuccess(false), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="flex h-[calc(100vh-80px)] gap-4 p-4 bg-gray-50 overflow-hidden">

        {/* LEFT: TABLE SELECTION (Narrow) */}
        <div className="w-20 md:w-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col p-3 gap-3 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-2">Bàn</div>
          {tables.map((t: any) => (
            <button
              key={t.id}
              onClick={() => setSelectedTable(t)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-2 relative ${selectedTable?.id === t.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105 z-10' :
                  t.status === 'occupied' ? 'bg-red-50 border-red-100 text-red-600' :
                    t.status === 'reserved' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' :
                      'bg-gray-50 border-transparent text-gray-500 hover:border-gray-200'
                }`}
            >
              <span className="text-xl font-black">{t.tableNumber}</span>
              {t.status === 'occupied' && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
            </button>
          ))}
        </div>

        {/* MIDDLE: MENU & ITEMS */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Menu Header / Search */}
          <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm món ăn nhanh..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Tất cả
              </button>
              {categories.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === c.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredItems.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden p-3 group relative active:scale-95"
                >
                  <div className="aspect-square bg-gray-100 rounded-2xl mb-3 flex items-center justify-center overflow-hidden relative">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <UtensilsCrossed size={32} className="text-gray-300" />
                    )}
                    <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl font-black text-blue-600 text-sm shadow-sm">
                      {item.price.toLocaleString()}đ
                    </div>
                  </div>
                  <div className="text-left px-1">
                    <h4 className="font-bold text-gray-900 line-clamp-1 leading-tight group-hover:text-blue-600 transition-colors uppercase text-xs tracking-tight">{item.name}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{item.categoryName} · {item.unit}</p>
                  </div>
                  {cart.find(c => c.menuItemId === item.id) && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center font-black text-xs animate-in zoom-in">
                      {cart.find(c => c.menuItemId === item.id)?.quantity}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: CART & CHECKOUT (Wide) */}
        <div className="w-[340px] md:w-[400px] flex flex-col gap-4 overflow-hidden">

          {/* Order Header */}
          <div className="bg-gray-900 text-white rounded-[2.5rem] p-6 shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h2 className="font-black text-lg tracking-tight">Chi tiết đơn</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    {selectedTable ? `BÀN ${selectedTable.tableNumber}` : 'CHƯA CHỌN BÀN'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setCart([]); setSelectedCustomer(null); setAppliedPromotion(null); }}
                className="text-gray-400 hover:text-white transition-colors"
                title="Xóa giỏ hàng"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Customer Section */}
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center justify-between group">
              {selectedCustomer ? (
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-blue-600/30 text-blue-400 rounded-xl flex items-center justify-center font-black uppercase">
                    {selectedCustomer.fullName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-sm truncate">{selectedCustomer.fullName}</p>
                    <p className="text-[10px] font-bold text-blue-400">{selectedCustomer.loyaltyPoints.toLocaleString()} đ · {selectedCustomer.loyaltyTier.toUpperCase()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 text-gray-500 rounded-xl flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <p className="text-sm font-bold text-gray-500">Tìm khách hàng...</p>
                </div>
              )}
              <button
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <Plus size={18} />
              </button>
            </div>

            {showCustomerSearch && (
              <div className="mt-3 bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-top-2 duration-200">
                <input
                  autoFocus
                  placeholder="Nhập tên hoặc SĐT..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="w-full p-4 border-b outline-none text-sm font-bold"
                />
                <div className="max-h-40 overflow-y-auto">
                  {customers.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); }}
                      className="w-full p-4 text-left hover:bg-blue-50 border-b last:border-0 transition-colors flex justify-between"
                    >
                      <span className="font-bold text-sm">{c.fullName} - {c.phone}</span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <ShoppingCart size={48} className="mb-2" />
                  <p className="font-black uppercase tracking-widest text-xs">Giỏ hàng trống</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.menuItemId} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-3xl group shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col flex-1">
                        <span className="font-black text-sm text-gray-900 uppercase tracking-tight">{item.name}</span>
                        {appliedPromotion && appliedPromotion.promotion?.applyTo === 'item' && (
                          <span className="text-[10px] text-green-600 font-bold uppercase">Áp dụng KM: {getDiscountedItemPrice(item).toLocaleString()}đ/sp</span>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-blue-600 text-sm">{(getDiscountedItemPrice(item) * item.quantity).toLocaleString()}đ</span>
                        {appliedPromotion && appliedPromotion.promotion?.applyTo === 'item' && (
                          <span className="text-[10px] line-through text-gray-400 font-bold">{(item.price * item.quantity).toLocaleString()}đ</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                        <button onClick={() => updateQuantity(item.menuItemId, -1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"><Minus size={14} /></button>
                        <span className="w-10 flex items-center justify-center font-black text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.menuItemId, 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-50 transition-colors"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => updateQuantity(item.menuItemId, -item.quantity)} className="text-gray-300 hover:text-red-500 transition-colors"><X size={16} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order Summary & Actions */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 space-y-6">
              {/* Voucher Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <TicketPercent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    placeholder="Mã giảm giá..."
                    value={voucherCode}
                    onChange={e => setVoucherCode(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                  />
                </div>
                <button
                  onClick={applyVoucher}
                  className="bg-gray-900 text-white px-5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Áp dụng
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-500 font-bold text-xs uppercase tracking-widest">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString()}đ</span>
                </div>
                {appliedPromotion && appliedPromotion.promotion && (
                  <div className="flex justify-between text-green-600 font-black text-xs uppercase tracking-widest">
                    <span>Giảm giá ({appliedPromotion.code || appliedPromotion.promotion.name})</span>
                    <span>-{discount.toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between items-end border-t border-gray-200 pt-4">
                  <span className="font-black text-xl text-gray-900 leading-none">Tổng chi phí</span>
                  <span className="font-black text-3xl text-blue-600 leading-none tracking-tighter">{total.toLocaleString()}đ</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  disabled={!selectedTable || cart.length === 0 || loading}
                  onClick={handleSendToKitchen}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-200 text-white rounded-2xl py-4 flex flex-col items-center justify-center gap-1 transition-all shadow-lg shadow-orange-100 group active:scale-95"
                >
                  <ChefHat size={20} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{loading ? 'Xử lý...' : 'VÀO BẾP'}</span>
                </button>
                <button
                  disabled={!selectedTable || loading}
                  id="checkout-btn"
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-2xl py-4 flex flex-col items-center justify-center gap-1 transition-all shadow-lg shadow-blue-100 group active:scale-95"
                >
                  <CreditCard size={20} className="group-hover:-translate-y-1 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">THANH TOÁN</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {orderSuccess && (
        <div className="fixed top-24 right-8 bg-green-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-500 z-[100] font-black uppercase tracking-widest text-sm">
          <CheckCircle className="text-white" /> Đơn hàng đã được ghi nhận!
        </div>
      )}

      {/* Styled Icons & Scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </AuthLayout>
  )
}

function Trash2(props: any) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  )
}

function CheckCircle(props: any) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
