'use client'

import { useState, useEffect, use } from 'react'
import {
  useMenuItems,
  useMenuCategories,
  useRestaurant,
  useTables,
  useTableById
} from '@/hooks/useApi'
import {
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  ChefHat,
  ArrowLeft,
  UtensilsCrossed,
  Clock,
  Info
} from 'lucide-react'
import api from '@/lib/api'
import { useToast } from '@/hooks/useToast'
import { ChatBot } from '@/components/ChatBot'

export default function GuestOrderPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params)
  const toast = useToast()

  // Since we don't have the restaurantId easily from branchId in current hooks, 
  // we'll fetch branch details first if needed, but for now 
  // let's assume we can use a generic "public" menu fetcher or use a fallback.
  // In a real app, the QR would contain the restaurantId.
  // For the demo, let's look for a table first to get its current status.

  const [restaurantId, setRestaurantId] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [cart, setCart] = useState<any[]>([])
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [ordered, setOrdered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const { data: menuCategories = [] } = useMenuCategories(restaurantId)
  const { data: menuItems = [] } = useMenuItems(restaurantId)
  const { data: restaurant } = useRestaurant(restaurantId)
  const { data: table, refetch: refetchTable } = useTableById(tableId)
  
  // Update fetchHistory or useTableById to poll more frequently on guest page
  useEffect(() => {
    const timer = setInterval(() => refetchTable(), 10000)
    return () => clearInterval(timer)
  }, [refetchTable])

  useEffect(() => {
    if (!tableId) return
    setLoading(true)
    setError('')

    // Set a timeout to abort if server doesn't respond
    const timer = setTimeout(() => {
      if (loading) {
        setError('Kết nối máy chủ bị quá hạn (Timeout). Vui lòng kiểm tra Internet.')
        setLoading(false)
      }
    }, 10000)


    if (table?.branchId) {
      api.get(`/api/branches/${table?.branchId}`, { timeout: 8000 })
        .then(({ data }) => {
          clearTimeout(timer)
          if (data && data.restaurantId) {
            setRestaurantId(data.restaurantId)
            setLoading(false)
          } else {
            setError('Không tìm thấy thông tin chi nhánh hợp lệ.')
            setLoading(false)
          }
        })
        .catch(err => {
          clearTimeout(timer)
          console.error('Failed to resolve restaurant from branch:', err)
          const errMsg = err.code === 'ECONNABORTED' ? 'Máy chủ không phản hồi (Timeout)' : 'Chi nhánh không tồn tại hoặc lỗi kết nối.'
          setError(errMsg)
          setLoading(false)
        })
    }

    return () => clearTimeout(timer)
  }, [table?.branchId])

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c
      return { ...c, quantity: c.quantity + delta }
    }).filter(c => c.quantity > 0))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.basePrice || item.price) * item.quantity, 0)

  const fetchHistory = async () => {
    if (!tableId) return
    try {
      const { data } = await api.get(`/api/orders/table/${tableId}`)
      // Assume the first one is the active order
      const activeOrder = data.find((o: any) => o.status !== 'paid' && o.status !== 'cancelled')
      if (activeOrder) {
        setHistoryItems(activeOrder.items || [])
      } else {
        setHistoryItems([])
      }
    } catch (err) {
      console.error('Failed to fetch order history', err)
    }
  }

  useEffect(() => {
    fetchHistory()
    const interval = setInterval(fetchHistory, 10000)
    return () => clearInterval(interval)
  }, [tableId])

  const handleOrder = async () => {
    setLoading(true)
    const isEmptyGuid = (id: any) => !id || id === '00000000-0000-0000-0000-000000000000';
    
    try {
      if (table?.currentOrderId && !isEmptyGuid(table.currentOrderId)) {
        // Add items to existing order
        for (const item of cart) {
          await api.post(`/api/orders/${table.currentOrderId}/items`, { 
            menuItemId: item.id, 
            quantity: item.quantity 
          })
        }
      } else {
        // Create new order
        await api.post('/api/orders', {
          tableId: tableId,
          items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity })),
          source: 'QR'
        })
      }
      setCart([])
      setOrdered(true)
      await refetchTable()
      fetchHistory()
      toast.success('Đã gửi món vào bếp')
    } catch (err) {
      toast.error('Lỗi khi đặt món. Vui lòng liên hệ nhân viên.')
    } finally {
      setLoading(false)
    }
  }

  const [showCart, setShowCart] = useState(false)

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-900 font-black uppercase tracking-widest text-sm">Đang kết nối thực đơn...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-red-100">
        <Info size={48} />
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Lỗi kết nối</h1>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">{error}</p>
      <button onClick={() => window.location.reload()} className="w-full max-w-xs py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
        Thử lại
      </button>
    </div>
  )

  if (ordered) return (
    <div className="min-h-screen bg-white p-8 wrap flex flex-col items-center justify-start text-center overflow-y-auto">
      <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-amber-100 animate-pulse mt-12 mx-auto shrink-0">
        <Clock size={48} />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight uppercase">Đã gửi yêu cầu!</h1>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">Vui lòng chờ nhân viên xác nhận đơn hàng của bạn.</p>
      
      {historyItems.length > 0 && (
        <div className="w-full max-w-sm mb-12">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left mb-2 ml-1">Đơn hàng hiện tại</p>
          <div className="space-y-3 mb-6">
          {historyItems.map((item: any, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
               <div className="text-left">
                 <p className="font-black text-xs text-gray-900 uppercase">{item.menuItemName}</p>
                 <p className="text-[10px] text-gray-400 font-bold">Số lượng: {item.quantity}</p>
               </div>
               <span className="text-blue-600 font-black text-xs">{item.subTotal.toLocaleString()}đ</span>
            </div>
          ))}
        </div>
      </div>
      )}

      <button onClick={() => setOrdered(false)} className="w-full max-w-xs py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl sticky bottom-4">
        Đặt thêm món
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gray-900 text-white p-8 rounded-b-[3rem] shadow-xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{restaurant?.name || 'Nhà hàng'}</h1>
            <div className="flex items-center gap-2 mt-1 opacity-70">
              <UtensilsCrossed size={14} />
              <span className="text-sm font-bold uppercase tracking-widest">Bàn số {table?.tableNumber}</span>
            </div>
          </div>
          <button onClick={() => setShowCart(true)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 relative">
            <ShoppingCart size={20} />
            {cart.length > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-gray-900">{cart.length}</span>}
          </button>
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-2 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors ${selectedCategory === 'all' ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'}`}>
            Tất cả
          </button>
          {menuCategories.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors ${selectedCategory === c.id ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 grid grid-cols-2 gap-4 mt-4">
        {menuItems.filter((i: any) => selectedCategory === 'all' || i.categoryId === selectedCategory).map((item: any) => (
          <div key={item.id} className="bg-white rounded-[2rem] p-3 shadow-sm border border-gray-100 flex flex-col">
            <div className="aspect-square bg-gray-50 rounded-2xl mb-3 flex items-center justify-center overflow-hidden relative">
              {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <UtensilsCrossed size={32} className="text-gray-200" />}
              <button
                onClick={() => addToCart(item)}
                className="absolute bottom-2 right-2 w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center transform active:scale-95 transition-transform"
              >
                <Plus size={20} />
              </button>
            </div>
            <h4 className="font-bold text-gray-900 text-xs px-1 line-clamp-1 truncate uppercase">{item.name}</h4>
            <p className="text-blue-600 font-black text-sm px-1 mt-1">{item.price.toLocaleString()}đ</p>
          </div>
        ))}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !showCart && (
        <div className="fixed bottom-6 left-6 right-6 z-40">
          <button 
            onClick={() => setShowCart(true)}
            className="w-full bg-gray-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between border border-white/10 animate-in slide-in-from-bottom flex active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black">{cart.reduce((s, i) => s + i.quantity, 0)}</div>
              <div className="text-left">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Xem giỏ hàng</p>
                <p className="font-black text-sm tracking-tight">{subtotal.toLocaleString()}đ</p>
              </div>
            </div>
            <Plus size={20} className="rotate-45" />
          </button>
        </div>
      )}

      {/* Full Cart Overlay */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex flex-col justify-end">
          <div className="bg-white rounded-t-[3rem] max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="p-8 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Giỏ hàng của bạn</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Bàn {table?.tableNumber}</p>
              </div>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"><Minus size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {cart.map((item, idx) => (
                <div key={`cart-${idx}`} className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0 border">
                    {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <UtensilsCrossed size={16} className="text-gray-200 mt-6 mx-auto" />}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="font-black text-xs text-gray-900 uppercase">{item.name}</h4>
                      <p className="text-blue-600 font-bold text-xs">{(item.price * item.quantity).toLocaleString()}đ</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex bg-white rounded-lg p-1 border">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-400"><Minus size={14} /></button>
                        <span className="w-8 flex items-center justify-center font-black text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-blue-600"><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {historyItems.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Các món đã gọi</h3>
                  <div className="space-y-3">
                    {historyItems.map((item: any, idx) => (
                      <div key={`history-${idx}`} className="flex items-center justify-between p-4 bg-gray-100 rounded-2xl opacity-80">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                             <CheckCircle2 size={16} className={item.status === 'cooking' ? 'text-green-500' : 'text-blue-500'} />
                          </div>
                          <div>
                            <p className="font-black text-[11px] text-gray-900 uppercase">{item.menuItemName}</p>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                              Số lượng: {item.quantity} • {item.status === 'awaiting_confirmation' ? 'Đang chờ duyệt' : item.status === 'cooking' ? 'Đang làm' : 'Đã phục vụ'}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-[11px] text-gray-400">{item.subTotal.toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 bg-gray-50 border-t space-y-6">
              <div className="flex justify-between items-end">
                {/* <span className="font-black text-lg text-gray-900 uppercase">Tổng cộng</span> */}
                {/* <span className="font-black text-2xl text-blue-600">{subtotal.toLocaleString()}đ</span> */}
              </div>
              <button
                onClick={handleOrder}
                disabled={loading || cart.length === 0}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Đang gửi món...' : <>XÁC NHẬN ĐẶT MÓN <Plus size={18} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {menuItems.length === 0 && !loading && (
        <div className="p-12 text-center opacity-30">
          <Info size={64} className="mx-auto mb-4" />
          <p className="text-xl font-bold uppercase">Menu đang cập nhật</p>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      {/* <ChatBot /> */}
    </div>
  )
}
