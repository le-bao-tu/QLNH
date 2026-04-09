'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI của nhà hàng. Tôi có thể giúp gì cho bạn? (Bạn có thể hỏi về món ăn, giá cả hoặc yêu cầu hỗ trợ)',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen, isMinimized])

  const handleSend = () => {
    if (!inputText.trim()) return

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')

    // Giả lập bot trả lời (Người dùng sẽ tự tích hợp AI thật vào đây)
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Cảm ơn bạn đã nhắn tin. Chức năng AI đang được kết nối. Bạn muốn biết thêm về món nào trong thực đơn không?',
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMsg])
    }, 1000)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className={`mb-4 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col transition-all duration-300 ${
          isMinimized ? 'h-16 w-64' : 'h-[500px] w-[350px] max-w-[calc(100vw-48px)]'
        }`}>
          {/* Header */}
          <div className="bg-gray-900 p-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <p className="font-black text-xs uppercase tracking-widest">AI Assistant</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Trực tuyến</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Body */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth"
              >
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        msg.sender === 'user' ? 'bg-indigo-600' : 'bg-white border border-gray-100 shadow-sm'
                      }`}>
                        {msg.sender === 'user' ? <User size={16} color="white" /> : <Bot size={16} className="text-blue-600" />}
                      </div>
                      <div className={`p-3 rounded-2xl text-sm font-medium ${
                        msg.sender === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-100' 
                        : 'bg-white text-gray-800 rounded-tl-none shadow-sm border border-gray-100'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Hỏi AI về món ăn..."
                  className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true)
            setIsMinimized(false)
          }}
          className="w-16 h-16 bg-gray-900 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all group relative border border-white/10"
        >
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
            <span className="text-[10px] font-black">1</span>
          </div>
          <MessageCircle size={28} />
          {/* Tooltip */}
          <div className="absolute right-full mr-4 bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-100">
            Hỏi trợ lý AI
          </div>
        </button>
      )}
    </div>
  )
}
