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
  usePromotions,
  useRestaurant,
  useBranches
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
  ChevronRight,
  UtensilsCrossed,
  Trash2,
  CheckCircle,
  CheckSquare,
  Info,
  Printer,
  BellRing
} from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import InvoicePrintModal, { type InvoiceData } from '@/components/InvoicePrintModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import { logUserAction, AuditModules } from '@/lib/audit'

interface CartItem {
  id: string
  name: string
  price: number
  unitPrice: number
  totalPrice?: number
  originalPrice: number
  oldQuantity: number
  quantity: number
  note?: string
  status?: string
  orderItemId?: string
}

interface Customer {
  id: string
  fullName: string
  phone: string
  loyaltyPoints: number
  loyaltyTier: string
}

export default function POSPage() {
  const { user } = useAuth()
  const branchId = user?.branchId || ''
  const restaurantId = user?.restaurantId || ''

  const [selectedTable, setSelectedTable] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [newCart, setNewCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [orderNote, setOrderNote] = useState('')

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null)

  const [orderSuccess, setOrderSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')

  // Invoice state
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)

  const toast = useToast()
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, action: 'pay' | null }>({ isOpen: false, action: null })

  const { data: tables = [], refetch: refetchTables } = useTables(branchId)
  const { data: categories = [] } = useMenuCategories(restaurantId)
  const { data: allItems = [] } = useMenuItems(restaurantId)
  const { data: allPromotions = [] } = usePromotions(restaurantId)
  const { data: restaurant } = useRestaurant(restaurantId)
  const { data: branchs } = useBranches(restaurantId)

  const createOrder = useCreateOrder()
  const addOrderItem = useAddOrderItem()

  useEffect(() => {
    if (selectedTable?.status === 'occupied' && selectedTable?.currentOrderId) {
      setLoading(true)
      api.get(`/api/orders/${selectedTable.currentOrderId}`)
        .then(({ data }) => {
            if (data && data.items) {
              const items = data.items
              const rawItems = items.map((i: any) => ({
                ...i,
                id: i.id, // Use unique OrderItemId
                menuItemId: i.menuItemId,
                name: i.menuItemName,
                price: i.unitPrice,
                unitPrice: i.unitPrice,
                totalPrice: i.subTotal,
                originalPrice: i.originalPrice,
                quantity: i.quantity,
                oldQuantity: i.quantity, // Persist DB quantity
                note: i.note,
                status: i.status,
                orderItemId: i.id
              }))
              setCart(rawItems)
            }
        })
        .catch(err => {
          console.error('Failed to load table order:', err)
          setCart([])
        })
        .finally(() => setLoading(false))
    } else {
      setCart([])
      setAppliedPromotion(null)
      setVoucherCode('')
    }
  }, [selectedTable?.id, selectedTable?.status, selectedTable?.currentOrderId])

  const getItemDiscountedPrice = (item: any) => {
    return item.discountPrice ?? item.price
  }

  const filteredItems = allItems.filter((item: any) => {
    const matchCategory = selectedCategory === 'all' || item.categoryId === selectedCategory
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch && item.isAvailable
  })

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const isTypePercentage = (type: string) => /percentage/i.test(type)
  const isTypeFixed = (type: string) => /fixed_amount/i.test(type)
  const isApplyToBill = (scope: string) => /bill/i.test(scope)

  const bestAutoBillPromo = allPromotions
    .filter((p: any) => isApplyToBill(p.applyTo) && p.isActive && !p.isVoucher)
    .reduce((best: any, p: any) => {
      if (subtotal < p.minOrderAmount) return best
      let currentDiscount = 0
      if (isTypePercentage(p.type)) {
        currentDiscount = (subtotal * p.discountValue) / 100
        if (p.maxDiscount && currentDiscount > p.maxDiscount) currentDiscount = p.maxDiscount
      } else if (isTypeFixed(p.type)) {
        currentDiscount = p.discountValue
      }
      if (!best || currentDiscount > best.amount) return { amount: currentDiscount, promotion: p }
      return best
    }, null)

  let discount = 0
  let promoSource = ''

  if (appliedPromotion && appliedPromotion.promotion) {
    const p = appliedPromotion.promotion
    const code = appliedPromotion.code
    if (isApplyToBill(p.applyTo)) {
      if (isTypePercentage(p.type)) {
        discount = (subtotal * p.discountValue) / 100
        if (p.maxDiscount && discount > p.maxDiscount) discount = p.maxDiscount
      } else {
        discount = p.discountValue
      }
      promoSource = `Voucher: ${code}`
    } else if (/item/i.test(p.applyTo)) {
      cart.forEach(item => {
        let itemDisc = isTypePercentage(p.type) ? (item.price * p.discountValue) / 100 : p.discountValue
        if (itemDisc > item.price) itemDisc = item.price
        discount += itemDisc * item.quantity
      })
      promoSource = `Voucher: ${code}`
    }
  } else if (bestAutoBillPromo) {
    discount = bestAutoBillPromo.amount
    promoSource = `KM tự động: ${bestAutoBillPromo.promotion.name}`
  }

  const tax = Math.round((subtotal - discount) * 0.10)
  const total = Math.max(0, subtotal - discount + tax)

  const getDiscountedItemPrice = (item: CartItem) => {
    if (!appliedPromotion || !appliedPromotion.promotion || !/item/i.test(appliedPromotion.promotion.applyTo)) return item.price
    const p = appliedPromotion.promotion
    const itemDisc = isTypePercentage(p.type) ? (item.price * p.discountValue) / 100 : p.discountValue
    return Math.max(0, item.price - itemDisc)
  }

  const addToCart = (item: any) => {
    const discountedPrice = getItemDiscountedPrice(item)
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { id: item.id, name: item.name, price: discountedPrice, unitPrice: item.price, originalPrice: item.price, quantity: 1, oldQuantity: 0 }]
    })
    setNewCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { id: item.id, name: item.name, price: discountedPrice, unitPrice: item.price, originalPrice: item.price, quantity: 1, oldQuantity: 0 }]
    })
  }

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id !== menuItemId) return c
      const newQty = c.quantity + delta
      return newQty < c.oldQuantity ? c : { ...c, quantity: newQty }
    }).filter(c => c.quantity > 0))
    setNewCart(prev => prev.map(c => {
      if (c.id !== menuItemId) return c
      return { ...c, quantity: c.quantity + delta }
    }).filter(c => c.quantity > 0))
  }

  const applyVoucher = async () => {
    if (!voucherCode) return
    setLoading(true)
    try {
      const { data: promo } = await api.get(`/api/promotions/vouchers/validate`, { params: { code: voucherCode, orderAmount: subtotal } })
      toast.success('Áp dụng mã giảm giá thành công')
      await logUserAction({
        action: `Áp dụng mã giảm giá: ${voucherCode}`,
        module: AuditModules.PROMOTION,
        targetId: promo.promotionId,
        newData: promo
      })
      setAppliedPromotion(promo)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Mã không hợp lệ')
      setAppliedPromotion(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSendToKitchen = async () => {
    if (!selectedTable) return
    setLoading(true)
    try {
      let orderId = selectedTable.currentOrderId
      
      // 1. If there's a new cart (manual staff entry), save it first
      if (newCart.length > 0) {
        if (orderId) {
          for (const item of newCart) {
            await addOrderItem.mutateAsync({ orderId, menuItemId: item.id, quantity: item.quantity, note: item.note })
          }
        } else {
          const order = await createOrder.mutateAsync({ 
            tableId: selectedTable.id, 
            customerId: selectedCustomer?.id, 
            guestCount: 1, 
            note: orderNote, 
            voucherCode: appliedPromotion?.code, 
            items: newCart.map(item => ({ menuItemId: item.id, quantity: item.quantity, note: item.note })) 
          })
          orderId = order.id
        }
<<<<<<< HEAD
=======
      } else {
        await createOrder.mutateAsync({ tableId: selectedTable.id, customerId: selectedCustomer?.id, restaurantId: restaurant?.id, guestCount: 1, note: orderNote, voucherCode: appliedPromotion?.code, items: newCart.map(item => ({ menuItemId: item.id, quantity: item.quantity, note: item.note })) })
>>>>>>> master
      }

      // 2. Trigger send to kitchen for all 'pending' items (including confirmed QR items and manual staff entries)
      if (orderId) {
        await api.post(`/api/orders/${orderId}/send-to-kitchen`)
      }

      setNewCart([]); setSelectedCustomer(null); setAppliedPromotion(null); setVoucherCode(''); setOrderSuccess(true);
      
      await logUserAction({
        action: `Gửi yêu cầu chế biến - Bàn ${selectedTable.tableNumber}`,
        module: AuditModules.POS,
        targetId: orderId || undefined,
        newData: { items: newCart, note: orderNote }
      })
      refetchTables() 
      
      // Reload order items to see updated status (cooking)
      const { data } = await api.get(`/api/orders/${orderId}`)
      setCart(data.items.map((i: any) => ({
        ...i,
        id: i.id,
        menuItemId: i.menuItemId,
        name: i.menuItemName,
        price: i.unitPrice,
        unitPrice: i.unitPrice,
        totalPrice: i.subTotal,
        originalPrice: i.originalPrice,
        quantity: i.quantity,
        oldQuantity: i.quantity,
        note: i.note,
        status: i.status,
        orderItemId: i.id
      })))

      setTimeout(() => setOrderSuccess(false), 3000)
    } finally { setLoading(false) }
  }

<<<<<<< HEAD
  const handleConfirmOrder = async () => {
    if (!selectedTable?.currentOrderId) return
    setLoading(true)
    try {
      await api.post(`/api/orders/${selectedTable.currentOrderId}/confirm`)
      toast.success('Đã xác nhận toàn bộ đơn hàng')
      await logUserAction({
        action: `Xác nhận toàn bộ đơn hàng QR - Bàn ${selectedTable.tableNumber}`,
        module: AuditModules.POS,
        targetId: selectedTable.currentOrderId,
        newData: { status: 'confirmed' }
      })
      // Refresh current order data
      const { data } = await api.get(`/api/orders/${selectedTable.currentOrderId}`)
      setCart(data.items.map((i: any) => ({
        ...i,
        id: i.id,
        menuItemId: i.menuItemId,
        name: i.menuItemName,
        price: i.unitPrice,
        unitPrice: i.unitPrice,
        totalPrice: i.subTotal,
        originalPrice: i.originalPrice,
        quantity: i.quantity,
        oldQuantity: i.quantity,
        note: i.note,
        status: i.status,
        orderItemId: i.id
      })))
      refetchTables()
    } catch {
      toast.error('Lỗi khi xác nhận đơn hàng')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmOneItem = async (orderItemId: string) => {
    setLoading(true)
    try {
      await api.post(`/api/orders/items/${orderItemId}/confirm`)
      toast.success('Đã xác nhận món')
      await logUserAction({
        action: `Xác nhận món ăn lẻ từ QR Order`,
        module: AuditModules.POS,
        targetId: orderItemId,
        newData: { itemStatus: 'confirmed' }
      })
      setCart(prev => prev.map(item => 
        item.orderItemId === orderItemId ? { ...item, status: 'pending' } : item
      ))
    } catch {
      toast.error('Lỗi khi xác nhận món')
    } finally {
      setLoading(false)
    }
  }

  const getVietQRUrl = () => {
    if (!restaurant?.bankId || !restaurant?.accountNo) return ''
    const memo = encodeURIComponent(`BAN ${selectedTable?.tableNumber || ''} ${new Date().getTime()}`)
    return `https://img.vietqr.io/image/${restaurant.bankId}-${restaurant.accountNo}-compact2.png?amount=${total}&addInfo=${memo}&accountName=${encodeURIComponent(restaurant.accountName || '')}`
  }

=======
>>>>>>> master
  const handleConfirmPayment = async () => {
    if (!selectedTable) return
    setConfirmDialog({ isOpen: true, action: 'pay' })
  }

  const executePayment = async () => {
    if (!selectedTable) return
    const orderId = selectedTable.currentOrderId
    setLoading(true)
    try {
      // POST /api/payment automatically sets order status to "paid" and table to "available"
      await api.post(`/api/payment`, {
        orderId,
        amount: total,
        method: paymentMethod,
        note: `Thanh toán bàn ${selectedTable.tableNumber}`
      })

      setShowPaymentModal(false)
      setSelectedTable(null)
      refetchTables()
      setCart([])
      setNewCart([])
      setAppliedPromotion(null)
      setVoucherCode('')
      setSelectedCustomer(null)
      toast.success('Thanh toán thành công')
      await logUserAction({
        action: `Thanh toán thành công - Bàn ${selectedTable.tableNumber}`,
        module: AuditModules.POS,
        targetId: orderId,
        newData: { total, method: 'Tiền mặt', customer: selectedCustomer?.fullName }
      })
    } catch (err) {
      toast.error('Có lỗi xảy ra khi thanh toán')
    } finally {
      setLoading(false)
      setConfirmDialog({ isOpen: false, action: null })
    }
  }

  const handlePrintInvoice = async () => {
    if (!selectedTable || !selectedTable.currentOrderId) return
    setLoading(true)
    try {
      const orderId = selectedTable.currentOrderId
      const { data: orderForInvoice } = await api.get(`/api/orders/${orderId}`)

      const invoice: InvoiceData = {
        orderId,
        tableNumber: selectedTable.tableNumber,
        items: (orderForInvoice.items || cart).map((i: any) => ({
          menuItemName: i.menuItemName || i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice || i.price,
          subTotal: i.subTotal ?? (i.unitPrice || i.price) * i.quantity,
          note: i.note,
        })),
        subtotal,
        discountAmount: discount, // Use calculated discount
        taxAmount: tax, // Use calculated tax
        totalAmount: total, // Use actual current total in POS
        paymentMethod: 'Tiền mặt', // Fallback, could be matched to true later
        customerName: selectedCustomer?.fullName,
        voucherCode: appliedPromotion?.code,
        restaurantName: restaurant?.name,
        restaurantAddress: restaurant?.address,
        restaurantPhone: restaurant?.phone,
        createdAt: orderForInvoice.createdAt,
        bankId: restaurant?.bankId,
        bankOwner: restaurant?.bankOwner,
        bankNumber: restaurant?.bankNumber,
        branchs: branchs || []
      }

      setInvoiceData(invoice)
      setShowInvoice(true)
      await logUserAction({
        action: `In hóa đơn - Bàn ${selectedTable.tableNumber}`,
        module: AuditModules.POS,
        targetId: orderId,
        newData: { total: invoice.totalAmount }
      })
    } catch(err) {
      console.error(err)
      toast.error("Không thể tải hóa đơn")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="flex h-[calc(100vh-40px)] gap-4 p-4 bg-gray-50 overflow-hidden">

        {/* LEFT: TABLE SELECTION */}
        <div className="w-20 md:w-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col p-3 gap-3 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-2">Bàn</div>
          {tables.map((t: any) => (
            <button key={t.id} onClick={() => setSelectedTable(t)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-2 relative ${selectedTable?.id === t.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : t.currentOrderStatus === 'awaiting_confirmation' ? 'bg-amber-50 border-amber-500 text-amber-600 animate-pulse' : t.status === 'occupied' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-gray-50 border-transparent text-gray-500 hover:border-gray-200'}`}>
              <span className="text-xl font-black">{t.tableNumber}</span>
              {t.currentOrderStatus === 'awaiting_confirmation' ? (
                 <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                   <BellRing size={10} color="white" />
                 </div>
              ) : t.status === 'occupied' && <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>}
            </button>
          ))}
        </div>

        {/* MIDDLE: MENU & ITEMS */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Tìm món ăn..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium" />
            </div>
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
              <button onClick={() => setSelectedCategory('all')} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>Tất cả</button>
              {categories.map((c: any) => (
                <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${selectedCategory === c.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{c.name}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item: any) => {
                const discountedPrice = getItemDiscountedPrice(item)
                return (
                  <button key={item.id} onClick={() => addToCart(item)} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all p-3 group relative">
                    <div className="aspect-square bg-gray-100 rounded-2xl mb-3 flex items-center justify-center overflow-hidden">
                      {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <UtensilsCrossed size={32} className="text-gray-300" />}
                      <div className="absolute bottom-2 right-2 bg-white/90 px-3 py-1.5 rounded-xl font-black text-sm shadow-sm">{discountedPrice.toLocaleString()}đ</div>
                    </div>
                    <div className="text-left px-1">
                      <h4 className="font-bold text-gray-900 text-xs truncate">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{item.categoryName}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: CART */}
        <div className="w-[340px] md:w-[400px] flex flex-col gap-4 overflow-hidden">
          <div className="bg-gray-900 text-white rounded-[2.5rem] p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-black text-lg tracking-tight">Chi tiết đơn {selectedTable && `#${selectedTable.tableNumber}`}</h2>
              <button onClick={() => { setCart([]); setNewCart([]) }} className="text-gray-400 hover:text-white"><Trash2 size={20} /></button>
            </div>

            <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center justify-between">
              {selectedCustomer ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/30 text-blue-400 rounded-xl flex items-center justify-center font-black">{selectedCustomer.fullName[0]}</div>
                  <div><p className="font-black text-sm">{selectedCustomer.fullName}</p><p className="text-[10px] text-blue-400">{selectedCustomer.loyaltyPoints}đ</p></div>
                </div>
              ) : <p className="text-sm font-bold text-gray-500 ml-2">Khách vãng lai</p>}
              <button onClick={() => setShowCustomerSearch(!showCustomerSearch)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"><Plus size={18} /></button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cart.map((item: any, idx) => (
                <div key={idx} className={`flex flex-col gap-2 p-4 rounded-3xl shadow-sm ${item.status === 'awaiting_confirmation' ? 'bg-amber-50 border border-amber-200' : item.status === 'pending' ? 'bg-blue-50/50 border border-blue-100' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-black text-sm text-gray-900 uppercase">{item.name}</span>
                      {item.status === 'awaiting_confirmation' && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase mt-0.5">
                          <BellRing size={10} /> Chờ xác nhận (QR)
                        </div>
                      )}
                      {item.status === 'pending' && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase mt-0.5">
                          <CheckSquare size={10} /> Sẵn sàng gửi bếp
                        </div>
                      )}
                      {item.status === 'cooking' && (
                        <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase mt-0.5">
                          <ChefHat size={10} /> Đang chế biến
                        </div>
                      )}
                    </div>
                    <span className="font-black text-blue-600 text-sm">{(item.price * item.quantity).toLocaleString()}đ</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex bg-white rounded-xl p-1 border border-gray-100">
                      <button disabled={item.status === 'cooking'} onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-gray-400 disabled:opacity-30"><Minus size={12} /></button>
                      <span className="w-8 flex items-center justify-center font-black text-xs">{item.quantity}</span>
                      <button disabled={item.status === 'cooking'} onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-blue-600 disabled:opacity-30"><Plus size={12} /></button>
                    </div>
                    {item.status === 'awaiting_confirmation' && (
                       <button onClick={() => handleConfirmOneItem(item.orderItemId)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                         Duyệt món
                       </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-gray-50 border-t border-gray-100 space-y-4">
              <div className="flex gap-2">
                <input placeholder="Voucher..." value={voucherCode} onChange={e => setVoucherCode(e.target.value)} className="flex-1 bg-white border rounded-xl px-4 py-3 text-xs font-bold outline-none" />
                <button onClick={applyVoucher} className="bg-gray-900 text-white px-5 rounded-xl text-xs font-black uppercase">Dùng</button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase"><span>Tạm tính</span><span>{subtotal.toLocaleString()}đ</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-[10px] text-green-600 font-bold uppercase"><span>Giảm giá</span><span>-{Math.round(discount).toLocaleString()}đ</span></div>
                )}
                <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase"><span>Thuế VAT (10%)</span><span>{tax.toLocaleString()}đ</span></div>
                <div className="flex justify-between items-end pt-2">
                  <span className="font-black text-lg text-gray-900">Tổng cộng</span>
                  <span className="font-black text-2xl text-blue-600">{total.toLocaleString()}đ</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button disabled={!selectedTable || loading || (newCart.length === 0 && !cart.some((i: any) => i.status === 'pending'))} onClick={handleSendToKitchen} className="bg-orange-600 disabled:opacity-50 text-white rounded-2xl py-4 flex flex-col items-center justify-center gap-1 shadow-lg shadow-orange-100">
                  <ChefHat size={20} /><span className="text-[10px] font-black uppercase tracking-widest">VÀO BẾP</span>
                </button>
                <div className="grid grid-cols-1 gap-2">
                  <button disabled={!selectedTable || loading || total <= 0} onClick={() => setShowPaymentModal(true)} className="bg-blue-600 disabled:opacity-50 text-white rounded-xl py-2 flex flex-col items-center justify-center gap-1 shadow-md shadow-blue-100">
                    <CreditCard size={16} /><span className="text-[10px] font-black uppercase tracking-widest">THANH TOÁN</span>
                  </button>
                  {cart.some((i: any) => i.status === 'awaiting_confirmation') && (
                    <button onClick={handleConfirmOrder} className="bg-amber-500 text-white rounded-xl py-2 flex flex-col items-center justify-center gap-1 shadow-md shadow-amber-100 animate-pulse">
                      <BellRing size={16} /><span className="text-[10px] font-black uppercase tracking-widest">DUYỆT VÀO GIỎ</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <CreditCard size={20} /> Xác nhận thanh toán
                </h2>
                <p className="text-blue-200 text-sm mt-0.5">Bàn #{selectedTable?.tableNumber}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-6 space-y-2">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Chi tiết đơn hàng</p>
                {cart.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Không có món nào</p>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0">{item.quantity}</span>
                        <span className="text-sm font-bold text-gray-800 truncate">{item.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className="text-sm font-black text-gray-900">{(getDiscountedItemPrice(item) * item.quantity).toLocaleString()}đ</span>
                        {getDiscountedItemPrice(item) < item.price && (
                          <p className="text-[10px] text-gray-400 line-through">{(item.price * item.quantity).toLocaleString()}đ</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="mx-6 mb-4 bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-500 font-semibold">
                  <span>Tạm tính</span>
                  <span>{subtotal.toLocaleString()}đ</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-green-600 font-bold">
                    <span>Giảm giá {promoSource && <span className="font-normal opacity-70">({promoSource})</span>}</span>
                    <span>-{Math.round(discount).toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-gray-500 font-semibold">
                  <span>VAT (10%)</span>
                  <span>{tax.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-1">
                  <span className="font-black text-gray-900">Tổng cộng</span>
                  <span className="text-xl font-black text-blue-600">{total.toLocaleString()}đ</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="px-6 pb-4">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Phương thức thanh toán</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'cash', label: 'Tiền mặt', icon: '💵' },
                    { value: 'card', label: ' Thẻ', icon: '💳' },
                    { value: 'transfer', label: 'Chuyển khoản', icon: '🔄' },
                  ].map(m => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`py-3 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${paymentMethod === m.value ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className={`text-[10px] font-black uppercase ${paymentMethod === m.value ? 'text-blue-600' : 'text-gray-500'}`}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 bg-gray-50 border-t flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="py-3 px-5 bg-gray-200 hover:bg-gray-300 rounded-2xl font-black uppercase text-xs transition-colors"
              >
                Đóng
              </button>
              <button
                disabled={!selectedTable || loading || cart.length === 0}
                onClick={handlePrintInvoice}
                className="flex items-center gap-2 bg-gray-800 disabled:opacity-50 text-white px-5 rounded-2xl font-black uppercase text-xs shadow-md transition-opacity"
              >
                <Printer size={14} /> In HĐ
              </button>
              <button
                disabled={loading || cart.length === 0}
                onClick={handleConfirmPayment}
                className="flex-1 py-3 bg-blue-600 disabled:opacity-50 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle size={16} />
                {loading ? 'Đang xử lý...' : `Xác nhận · ${total.toLocaleString()}đ`}
              </button>
            </div>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className="fixed top-24 right-8 bg-green-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right z-[100] font-black uppercase text-sm">
          <CheckCircle className="text-white" /> Đã gửi món vào bếp!
        </div>
      )}

      {/* Invoice Print Modal */}
      {showInvoice && invoiceData && (
        <InvoicePrintModal
          onClose={() => { setShowInvoice(false); setInvoiceData(null) }}
          data={invoiceData}
        />
      )}

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title="Xác nhận thanh toán"
        message={`Xác nhận khách tại ${selectedTable?.tableNumber} đã thanh toán số tiền ${total.toLocaleString()}đ?`}
        type="info"
        confirmText="Đã thanh toán"
        isLoading={loading}
        onConfirm={executePayment}
        onCancel={() => setConfirmDialog({ isOpen: false, action: null })}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </AuthLayout>
  )
}
