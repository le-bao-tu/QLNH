'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Utensils, CalendarCheck, Phone, ArrowLeft, Sparkles, Store, MapPin, Moon, Sun } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useRestaurant, useBranches } from '@/hooks/useApi'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  isTyping?: boolean
}

const SUGGESTIONS = [
  { id: '1', icon: Utensils, text: 'Thực đơn hôm nay có gì đặc sắc?', label: 'Hỏi thực đơn' },
  { id: '2', icon: CalendarCheck, text: 'Kiểm tra bàn trống tối nay lúc 19:00', label: 'Tình trạng bàn' },
  { id: '3', icon: Phone, text: 'Tôi muốn liên hệ đặt bàn ngay bây giờ.', label: 'Liên hệ đặt bàn' }
]

export default function ChatbotPage() {
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isDark, setIsDark] = useState(true) // Theme State
  const [selectedBranch, setSelectedBranch] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])

  const scrollRef = useRef<HTMLDivElement>(null)

  const { restaurantId } = useParams()

  const { data: restaurant } = useRestaurant(restaurantId as string)
  const { data: branches, isLoading: branchesLoading } = useBranches(restaurantId as string)

  // Initialize welcome message when a branch is selected
  useEffect(() => {
    if (selectedBranch) {
      setMessages([
        {
          id: 'welcome',
          text: `Kính chào quý khách! Chào mừng đến với ${selectedBranch.name}. Tôi là trợ lý ảo của nhà hàng. Quý khách muốn tìm hiểu về thực đơn, kiểm tra bàn trống hay cần hỗ trợ đặt bàn ạ?`,
          sender: 'bot',
          timestamp: new Date()
        }
      ])
    }
  }, [selectedBranch])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleSend = (text: string = inputText) => {
    const trimmedText = text.trim()
    if (!trimmedText) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: trimmedText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    // Simulate bot thinking and responding
    setTimeout(() => {
      setIsTyping(false)
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Cảm ơn quý khách đã quan tâm. Hiện tại hệ thống đang được nâng cấp, thông tin chi tiết sẽ sớm được cập nhật. Quý khách có muốn để lại số điện thoại để nhân viên trực tiếp tư vấn không ạ?',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMsg])
    }, 1500)
  }

  return (
    <div className={`flex flex-col h-screen font-sans transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a] text-gray-100 selection:bg-amber-500/30' : 'bg-gray-50 text-gray-900 selection:bg-amber-500/20'
      }`}>

      {/* Branch Selection Popup */}
      <AnimatePresence>
        {!selectedBranch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${isDark
                ? 'bg-gray-900 border-gray-700/50 shadow-amber-900/20'
                : 'bg-white border-gray-200 shadow-orange-500/10'
                }`}
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30">
                  {restaurant?.logoUrl ? (
                    <img src={restaurant.logoUrl} alt={restaurant?.name} className="w-full h-full object-cover  rounded-xl" />
                  ) : (
                    <Store size={32} className="text-white" />
                  )}
                </div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Chào mừng quý khách
                </h2>
                <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Vui lòng chọn chi nhánh {restaurant?.name ? `của ${restaurant.name}` : 'nhà hàng'} bạn muốn nhận tư vấn
                </p>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {branchesLoading ? (
                  <div className={`p-4 rounded-xl text-center text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Đang tải danh sách chi nhánh...
                  </div>
                ) : branches && branches.length > 0 ? (
                  branches.map((branch: any) => (
                    <button
                      key={branch.id}
                      onClick={() => setSelectedBranch(branch)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-95 group ${isDark
                        ? 'bg-gray-800 border-gray-700 hover:border-amber-500/50 hover:bg-gray-700/50'
                        : 'bg-gray-50 border-gray-200 hover:border-orange-500/50 hover:bg-orange-50'
                        }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <MapPin size={18} className={isDark ? 'text-amber-500' : 'text-orange-600'} />
                          <h3 className={`font-semibold ${isDark ? 'text-gray-100 group-hover:text-amber-400' : 'text-gray-900 group-hover:text-orange-600'}`}>
                            {branch.name}
                          </h3>
                        </div>
                        {branch.address && (
                          <p className={`text-xs pl-6 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {branch.address}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className={`p-4 rounded-xl text-center text-sm font-medium ${isDark ? 'text-gray-400 bg-gray-800' : 'text-gray-600 bg-gray-50'}`}>
                    Không tìm thấy chi nhánh nào.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-[20%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-500 ${isDark ? 'bg-amber-600/10' : 'bg-amber-400/20'
          }`} />
        <div className={`absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-500 ${isDark ? 'bg-orange-600/10' : 'bg-orange-400/20'
          }`} />
      </div>

      {/* Header */}
      <header className={`relative z-10 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b shrink-0 transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-gray-200'
        }`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-orange-500/20">
              {restaurant?.logoUrl ? (
                <img src={restaurant.logoUrl} alt={restaurant?.name} className="w-full h-full object-cover  rounded-xl" />
              ) : (
                <Bot size={20} className="text-white" />
              )}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 ${isDark ? 'border-[#121212]' : 'border-white'
                }`} />
            </div>
            <div>
              <h1 className={`font-bold text-base tracking-wide flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'
                }`}>
                {restaurant ? restaurant.name : 'Lumière Assistant'}
                <Sparkles size={14} className="text-amber-500" />
              </h1>
              <p className={`text-xs font-medium tracking-wider max-w-[200px] truncate ${isDark ? 'text-amber-400/80' : 'text-amber-600/90'
                }`}>
                {selectedBranch ? selectedBranch.name : 'Luôn sẵn sàng phục vụ'}
              </p>
            </div>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`p-2.5 rounded-xl transition-all ${isDark
            ? 'bg-white/5 hover:bg-white/10 text-amber-400 border border-white/10'
            : 'bg-white hover:bg-gray-50 text-orange-500 border border-gray-200 shadow-sm'
            }`}
          title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Main Chat Area */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 scroll-smooth" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                  {/* Avatar */}
                  <div className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden ${msg.sender === 'user'
                    ? (isDark ? 'bg-gray-800 border border-gray-700' : 'bg-[#1e1e1e] border border-gray-300 shadow-sm')
                    : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-orange-500/20'
                    }`}>
                    {msg.sender === 'user'
                      ? <User size={16} className={isDark ? "text-gray-300" : "text-white"} />
                      : (restaurant?.logoUrl ? <img src={restaurant.logoUrl} className="w-full h-full object-cover" /> : <Bot size={18} className="text-white" />)
                    }
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-4 rounded-2xl sm:rounded-3xl shadow-sm text-[15px] leading-relaxed transition-colors duration-500 ${msg.sender === 'user'
                    ? (isDark
                      ? 'bg-gray-800 border border-gray-700 text-gray-100 rounded-tr-none'
                      : 'bg-[#1e1e1e] border border-[#1e1e1e] text-white rounded-tr-none shadow-md')
                    : (isDark
                      ? 'bg-white/10 backdrop-blur-md border border-white/10 text-gray-50 rounded-tl-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-md')
                    }`}>
                    {msg.text}
                    <div className={`text-[10px] sm:text-xs mt-2 opacity-60 flex items-center gap-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex justify-start"
              >
                <div className="flex gap-3 max-w-[85%] sm:max-w-[75%]">
                  <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center overflow-hidden shadow-md shadow-orange-500/20">
                    {restaurant?.logoUrl ? <img src={restaurant.logoUrl} className="w-full h-full object-cover" /> : <Bot size={18} className="text-white" />}
                  </div>
                  <div className={`p-4 rounded-2xl sm:rounded-3xl flex items-center gap-1.5 transition-colors duration-500 rounded-tl-none ${isDark
                    ? 'bg-white/10 backdrop-blur-md border border-white/10 text-gray-50'
                    : 'bg-white border border-gray-200 shadow-md'
                    }`}>
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Input Area */}
      <footer className={`relative z-20 backdrop-blur-xl border-t pt-4 pb-6 px-4 shrink-0 transition-colors duration-500 ${isDark ? 'bg-[#0a0a0a]/80 border-white/10' : 'bg-gray-50/90 border-gray-200'
        }`}>
        <div className="max-w-4xl mx-auto space-y-4">

          {/* Suggestions */}
          {messages.length === 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x pointer-events-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSend(s.text)}
                  disabled={!selectedBranch}
                  className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                    ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300'
                    : 'bg-white hover:bg-orange-50 border border-gray-200 text-gray-700 shadow-sm'
                    }`}
                >
                  <s.icon size={16} className={isDark ? "text-amber-500" : "text-amber-600"} />
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Chat Form */}
          <div className="relative group">
            <div className={`absolute -inset-0.5 rounded-[2rem] blur opacity-50 transition duration-500 ${isDark
              ? 'bg-gradient-to-br from-amber-500/30 to-orange-600/30 group-focus-within:opacity-100'
              : 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 group-focus-within:opacity-80'
              }`}></div>
            <div className={`relative flex items-end gap-2 border rounded-[2rem] p-2 pr-2.5 shadow-xl transition-colors duration-500 ${isDark
              ? 'bg-gray-900 border-gray-700/50'
              : 'bg-white border-gray-200'
              }`}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={!selectedBranch}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={selectedBranch ? "Nhập yêu cầu của bạn (đặt bàn, món ăn, hỗ trợ)..." : "Vui lòng chọn chi nhánh trước..."}
                className={`flex-1 max-h-32 min-h-[44px] bg-transparent border-0 px-4 py-3 resize-none focus:ring-0 text-[15px] focus:outline-none transition-colors disabled:cursor-not-allowed ${isDark
                  ? 'text-gray-100 placeholder-gray-500'
                  : 'text-gray-900 placeholder-gray-400'
                  }`}
                rows={1}
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isTyping || !selectedBranch}
                className="shrink-0 mb-0.5 p-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-orange-500/25 hover:shadow-orange-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-90"
              >
                <Send size={18} className="translate-x-[-1px] translate-y-[-1px]" />
              </button>
            </div>
          </div>

          <p className={`text-center text-[10px] uppercase tracking-widest px-4 transition-colors ${isDark ? 'text-gray-600' : 'text-gray-400'
            }`}>
            Trợ lý AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.
          </p>
        </div>
      </footer>
    </div>
  )
}
