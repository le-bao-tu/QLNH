'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { UtensilsCrossed, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()
  const { success } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      router.push('/dashboard')
      success('Đăng nhập thành công!')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.05,
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <div className="animate-fade-in" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Card */}
        <div className="card" style={{ padding: 40 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(37,99,235,0.3)'
            }}>
              <UtensilsCrossed size={32} color="white" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              Chào mừng trở lại!
            </h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              Đăng nhập vào hệ thống quản lý nhà hàng
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '10px 14px', marginBottom: 20, color: '#b91c1c', fontSize: 14
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Tên đăng nhập
              </label>
              <input
                type="text"
                className="input"
                placeholder="Nhập tên đăng nhập..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                id="username"
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  id="password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 15, justifyContent: 'center' }}
              disabled={loading}
              id="login-btn"
            >
              {loading ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
            Chưa có tài khoản?{' '}
            <Link href="/register" style={{ color: '#2563eb', fontWeight: 600 }}>
              Đăng ký ngay
            </Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 24 }}>
          © 2025 Restaurant Management System
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
