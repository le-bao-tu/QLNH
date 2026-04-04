'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { 
  ChefHat, 
  Timer, 
  CheckCircle2, 
  Flame, 
  Clock, 
  AlertCircle,
  Hash,
  ArrowRight,
  Bell
} from 'lucide-react'

interface KitchenOrder {
  id: string
  orderItemId: string
  branchId: string
  tableNumber: number
  itemName: string
  quantity: number
  note?: string
  priority: number
  status: 'pending' | 'cooking' | 'ready' | 'served'
  receivedAt: string
  startedAt?: string
  completedAt?: string
}

export default function KitchenPage() {
  const { user } = useAuth()
  const branchId = user?.branchId || ''

  const [tickets, setTickets] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'cooking' | 'ready'>('all')

  const loadTickets = async () => {
    if (!branchId) return
    try {
      // In a real app, this should be a WebSocket/SignalR connection
      const { data } = await api.get(`/api/kitchen/branch/${branchId}`)
      setTickets(data)
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTickets()
    const interval = setInterval(loadTickets, 10000) // Poll every 10s for demo
    return () => clearInterval(interval)
  }, [branchId])

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/api/kitchen/${id}/status`, { status })
      loadTickets()
    } catch (err) {
      console.error(err)
    }
  }

  const getWaitTime = (receivedAt: string) => {
    const diff = Math.floor((Date.now() - new Date(receivedAt).getTime()) / 60000)
    return diff
  }

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return t.status !== 'served'
    return t.status === filter
  }).sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
  })

  return (
    <AuthLayout>
      <div className="p-6 bg-slate-900 min-h-screen text-white">
        {/* KDS Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/40">
              <ChefHat size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black border-none uppercase tracking-tighter">Kitchen Display System</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs font-bold text-orange-400 uppercase tracking-widest">
                  <Flame size={14} className="animate-pulse" /> Live Now
                </span>
                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                <span className="text-xs font-bold text-slate-400 transition-all uppercase tracking-widest">Branch #1 (Main)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex bg-slate-800 rounded-xl p-1 p-x-2 border border-slate-700/50">
               {['all', 'pending', 'cooking', 'ready'].map(f => (
                 <button 
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                 >
                   {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Cần làm' : f === 'cooking' ? 'Đang nấu' : 'Xong'}
                 </button>
               ))}
             </div>
             <button className="relative w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-700 transition-all border border-slate-700/50">
               <Bell size={20} className="text-slate-300" />
               <span className="absolute top-2 right-2 w-3 h-3 bg-red-600 rounded-full border-2 border-slate-800"></span>
             </button>
          </div>
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-20">
            <ChefHat size={80} className="mb-4" />
            <p className="text-2xl font-bold uppercase tracking-widest">Bếp trống - Không có đơn hàng</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredTickets.map((ticket) => {
              const wait = getWaitTime(ticket.receivedAt)
              const waitColor = wait > 15 ? 'text-red-500' : wait > 10 ? 'text-yellow-500' : 'text-green-500'
              
              return (
                <div 
                  key={ticket.id} 
                  className={`flex flex-col rounded-3xl overflow-hidden border-2 transition-all ${
                    ticket.status === 'cooking' ? 'border-orange-600 bg-orange-950/20 shadow-2xl shadow-orange-950/40' : 
                    ticket.status === 'ready' ? 'border-green-600 bg-green-950/10' : 
                    'border-slate-800 bg-slate-850/40'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className={`p-5 flex justify-between items-start ${
                    ticket.status === 'cooking' ? 'bg-orange-600/10' : 
                    ticket.status === 'ready' ? 'bg-green-600/10' : 
                    'bg-slate-800/20'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                        <span className="text-[10px] leading-none font-black uppercase opacity-60">Bàn</span>
                        <span className="text-xl leading-none font-black">{ticket.tableNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Hash size={12} className="text-slate-500" />
                          <span className="text-xs font-mono text-slate-400 truncate w-24">#{ticket.id.slice(0, 8)}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-black text-sm uppercase tracking-wider ${waitColor}`}>
                          <Timer size={14} />
                          {wait}m
                        </div>
                      </div>
                    </div>
                    {ticket.priority > 0 && (
                      <div className="px-2 py-1 bg-red-600 text-[10px] font-black uppercase rounded-lg shadow-lg shadow-red-900/40">URGENT</div>
                    )}
                  </div>

                  {/* Ticket Content */}
                  <div className="p-6 flex-1 min-h-[140px]">
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <h3 className="text-2xl font-black leading-tight text-slate-100">{ticket.itemName}</h3>
                      <div className="w-10 h-10 bg-slate-800 text-slate-100 rounded-xl flex items-center justify-center font-black text-xl border border-slate-700">
                        x{ticket.quantity}
                      </div>
                    </div>

                    {ticket.note && (
                      <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-900/30 rounded-2xl mb-4">
                        <AlertCircle size={14} className="text-red-500 mt-1 flex-shrink-0" />
                        <p className="text-sm font-bold text-red-100 italic">"{ticket.note}"</p>
                      </div>
                    )}
                  </div>

                  {/* Ticket Footer / Actions */}
                  <div className="p-4 bg-slate-900/40 mt-auto border-t border-slate-800/50">
                    {ticket.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(ticket.id, 'cooking')}
                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-900/30 active:scale-95"
                      >
                        Bắt đầu làm <ArrowRight size={18} />
                      </button>
                    )}
                    {ticket.status === 'cooking' && (
                      <button 
                        onClick={() => updateStatus(ticket.id, 'ready')}
                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-900/30 active:scale-95"
                      >
                        Hoàn thành <CheckCircle2 size={18} />
                      </button>
                    )}
                    {ticket.status === 'ready' && (
                      <button 
                        onClick={() => updateStatus(ticket.id, 'served')}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-900/30 active:scale-95"
                      >
                        Đã giao <ArrowRight size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx global>{`
        .bg-slate-850 { background-color: #1a2234; }
        .bg-slate-850\/40 { background-color: rgba(26, 34, 52, 0.4); }
      `}</style>
    </AuthLayout>
  )
}
