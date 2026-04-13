'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { useToast } from '@/hooks/useToast'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '3px solid #e2e8f0',
            borderTopColor: '#2563eb', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
          }} />
          <div style={{ color: '#64748b', fontSize: 14 }}>Đang tải...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div>
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
