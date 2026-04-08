'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useAuth } from '@/lib/auth'
import api from '@/lib/api'
import {
  UserRound, UserPlus, Trash2, Shield, ChefHat,
  User, CreditCard, Users, Eye, EyeOff, Building2,
  GitBranch, Search, X, Check, AlertTriangle
} from 'lucide-react'
import { SelectBox } from '@/components/SelectBox'
import { useToast } from '@/hooks/useToast'
import { ConfirmModal } from '@/components/ConfirmModal'

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  owner:     { label: 'Chủ sở hữu', color: 'text-purple-700', bg: 'bg-purple-100', icon: Shield },
  manager:   { label: 'Quản lý',    color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Users },
  cashier:   { label: 'Thu ngân',   color: 'text-green-700',  bg: 'bg-green-100',  icon: CreditCard },
  waiter:    { label: 'Phục vụ',    color: 'text-orange-700', bg: 'bg-orange-100', icon: User },
  chef:      { label: 'Bếp trưởng', color: 'text-red-700',    bg: 'bg-red-100',    icon: ChefHat },
  bartender: { label: 'Pha chế',    color: 'text-cyan-700',   bg: 'bg-cyan-100',   icon: UserRound },
}

interface Account {
  id: string
  username: string
  email: string
  fullName: string
  role: string
  restaurantId: string
  branchId: string
  createdAt: string
}

interface Branch {
  id: string
  name: string
}

const defaultForm = {
  username: '', email: '', password: '', fullName: '', role: 'waiter'
}

const accountTypes = [
  { value: 'manager', label: 'Quản lý' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'waiter', label: 'Phục vụ' },
  { value: 'chef', label: 'Bếp trưởng' },
  { value: 'bartender', label: 'Pha chế' },
]

export default function AccountsPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId || ''
  const branchId = user?.branchId || ''

  const [accounts, setAccounts] = useState<Account[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ ...defaultForm, branchId })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null)
  const toast = useToast()

  const isOwner = user?.role?.toLowerCase() === 'owner'
  const isManager = user?.role?.toLowerCase() === 'manager' || isOwner

  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.branchId || '')
  const activeBranchId = isOwner ? selectedBranchId : (user?.branchId || '')

  const fetchData = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    try {
      const branchParam = activeBranchId ? `&branchId=${activeBranchId}` : ''
      const [accRes, brRes] = await Promise.all([
        api.get(`/api/auth/users?restaurantId=${restaurantId}${branchParam}`),
        api.get(`/api/branches/restaurant/${restaurantId}`)
      ])
      setAccounts(accRes.data)
      setBranches(brRes.data)

      if (brRes.data) {
        setForm(p => ({ ...p, branchId: p.branchId || brRes.data[0]?.id || '' }))
      }
    } catch {
      toast.error('Không thể tải dữ liệu tài khoản')
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => { fetchData() }, [fetchData, activeBranchId])

  // Tự động chọn chi nhánh đầu tiên cho Owner nếu chưa chọn
  useEffect(() => {
    if (isOwner && !selectedBranchId && branches.length > 0) {
      setSelectedBranchId(branches[0].id)
    }
  }, [isOwner, selectedBranchId, branches])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/auth/create-staff', {
        ...form,
        restaurantId,
        branchId: form.branchId || branchId
      })
      toast.success('Tạo tài khoản thành công!')
      setShowCreate(false)
      setForm({ ...defaultForm, branchId })
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo tài khoản')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/api/auth/users/${deleteTarget.id}`)
      toast.success('Đã xóa tài khoản vĩnh viễn')
      setDeleteTarget(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa tài khoản')
    }
  }

  const filtered = accounts.filter(a =>
    a.fullName.toLowerCase().includes(search.toLowerCase()) ||
    a.username.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  )

  const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || 'Chưa xác định'

  return (
    <AuthLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Users size={24} />
              </div>
              Quản lý Tài khoản
            </h1>
            <p className="text-gray-500 mt-1">Tạo và phân quyền tài khoản cho nhân viên của nhà hàng</p>
          </div>
          {isManager && (
            <div className="flex items-center gap-3">
              {isOwner && (
                <div className="w-64">
                   <SelectBox 
                    options={[{id: '', name: 'Tất cả chi nhánh'}, ...branches]} 
                    optionLabel='name' 
                    optionValue='id' 
                    onChange={val => setSelectedBranchId(val)} 
                    value={selectedBranchId}
                   />
                </div>
              )}
              <button
                onClick={() => setShowCreate(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <UserPlus size={20} />
                Thêm tài khoản
              </button>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
            const count = accounts.filter(a => a.role === role).length
            const Icon = cfg.icon
            return (
              <div key={role} className={`${cfg.bg} rounded-3xl p-4 flex items-center gap-4`}>
                <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                  <Icon size={20} className={cfg.color} />
                </div>
                <div>
                  <p className={`text-2xl font-black ${cfg.color}`}>{count}</p>
                  <p className={`text-xs font-bold uppercase tracking-wider ${cfg.color} opacity-70`}>{cfg.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm tài khoản theo tên, username hoặc vai trò..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-6 py-3.5 outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-sm"
          />
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-gray-400">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
              Đang tải danh sách tài khoản...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center opacity-30">
              <Users size={64} className="mx-auto mb-4" />
              <p className="font-black text-lg">Chưa có tài khoản nào</p>
              <p className="text-sm">Bấm "Thêm tài khoản" để bắt đầu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Nhân viên</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vai trò</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">Chi nhánh</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Email</th>
                    <th className="text-left px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hidden lg:table-cell">Ngày tạo</th>
                    {isOwner && <th className="px-4 py-4"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((acc) => {
                    const cfg = ROLE_CONFIG[acc.role] || { label: acc.role, color: 'text-gray-700', bg: 'bg-gray-100', icon: User }
                    const Icon = cfg.icon
                    const isMe = acc.id === user?.id
                    return (
                      <tr key={acc.id} className={`hover:bg-gray-50/50 transition-colors ${isMe ? 'bg-indigo-50/30' : ''}`}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center font-black text-sm ${cfg.color} uppercase`}>
                              {acc.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{acc.fullName} {isMe && <span className="text-xs text-indigo-500 font-black">(Bạn)</span>}</p>
                              <p className="text-xs text-gray-400 font-medium">@{acc.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                            <Icon size={12} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-5 hidden md:table-cell">
                          <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                            <GitBranch size={14} className="text-gray-400" />
                            {getBranchName(acc.branchId)}
                          </span>
                        </td>
                        <td className="px-4 py-5 hidden lg:table-cell text-sm text-gray-500">{acc.email || '—'}</td>
                        <td className="px-4 py-5 hidden lg:table-cell text-sm text-gray-400">
                          {new Date(acc.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        {isOwner && (
                          <td className="px-4 py-5">
                            {!isMe && acc.role !== 'Owner' && (
                              <button
                                onClick={() => setDeleteTarget(acc)}
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE ACCOUNT MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Tạo tài khoản mới</h2>
                <p className="text-gray-500 text-sm mt-1">Nhân viên sẽ đăng nhập bằng tài khoản này</p>
              </div>
              <button type="button" onClick={() => setShowCreate(false)} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Họ và tên *</label>
                  <input
                    required value={form.fullName}
                    onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Username *</label>
                  <input
                    required value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    className="w-full bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                    placeholder="nhanvien01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-gray-50 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                  placeholder="nhanvien@email.com (tuỳ chọn)"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mật khẩu *</label>
                <div className="relative">
                  <input
                    required type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full bg-gray-50 rounded-2xl px-4 py-3 pr-12 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                    placeholder="Tối thiểu 6 ký tự"
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Vai trò *</label>
                  <SelectBox options={accountTypes} optionLabel='label' optionValue='value' onChange={val => setForm(p => ({ ...p, role: val }))} value={form.role}/>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Chi nhánh *</label>

                  <SelectBox options={branches} optionLabel='name' optionValue='id' onChange={val => setForm(p => ({ ...p, branchId: val }))} value={form.branchId}/>
                  </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl transition-colors"
                >
                  Hủy
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        title="Xóa tài khoản?"
        message={`Tài khoản ${deleteTarget?.fullName || ''} (@${deleteTarget?.username || ''}) sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
        type="danger"
        confirmText="Xóa tài khoản"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AuthLayout>
  )
}
