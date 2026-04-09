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
  const [ordered, setOrdered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const { data: menuCategories = [] } = useMenuCategories(restaurantId)
  const { data: menuItems = [] } = useMenuItems(restaurantId)
  const { data: restaurant } = useRestaurant(restaurantId)
  const { data: table } = useTableById(tableId)

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

  const handleOrder = async () => {
    setLoading(true)
    try {
      await api.post('/api/orders', {
        tableId: tableId,
        items: cart.map(i => ({ menuItemId: i.id, quantity: i.quantity })),
        source: 'QR'
      })
      setCart([])
      setOrdered(true)
      toast.success('Đã gửi món vào bếp')
    } catch (err) {
      toast.error('Lỗi khi đặt món. Vui lòng liên hệ nhân viên.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-900 font-black uppercase tracking-widest text-sm">Đang kết nối thực đơn...</p>
        <p className="text-gray-400 text-[10px] mt-4 font-mono break-all opacity-50">
          Branch: {table?.branchId || 'waiting...'} <br />
          Table: {table?.id || 'waiting...'}
        </p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 bg-red-100 text-red-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-red-100">
        <Info size={48} />
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight tracking-tighter">Lỗi kết nối</h1>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto text-sm">{error}</p>
      <div className="w-full space-y-3">
        <button onClick={() => window.location.reload()} className="w-full max-w-xs py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">
          Thử lại
        </button>
        <p className="text-[10px] font-mono text-gray-300 break-all px-4">
          ID: {table?.branchId || 'waiting...'} <br />
          API: {api.defaults.baseURL || 'relative'}
        </p>
      </div>
    </div>
  )

  if (ordered) return (
    <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-amber-100 animate-pulse">
        <Clock size={48} />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight uppercase">Đang chờ xác nhận...</h1>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto">Đơn hàng của bạn đã được gửi. Vui lòng chờ nhân viên xác nhận để bắt đầu chế biến.</p>
      <button onClick={() => setOrdered(false)} className="w-full max-w-xs py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl">
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
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
            <ShoppingCart size={20} />
          </div>
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

      {/* Floating Bottom Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 z-50">
          <div className="bg-gray-900 text-white rounded-[2.5rem] p-4 shadow-2xl shadow-blue-900/40 border border-white/10 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-3">
                <ChefHat className="text-blue-400" size={24} />
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đang chọn {cart.length} món</p>
                  <p className="font-black text-xl tracking-tighter">{subtotal.toLocaleString()}đ</p>
                </div>
              </div>
              <button onClick={() => setCart([])} className="text-gray-500 hover:text-white"><Minus size={20} /></button>
            </div>

            <button
              onClick={handleOrder}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
            >
              {loading ? 'Đang gửi món...' : 'Gửi yêu cầu đặt món'}
            </button>
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
      <ChatBot />
    </div>
  )
}
