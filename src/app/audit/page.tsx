'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import {
  History,
  Search,
  Filter,
  User,
  Activity,
  Clock,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { SelectBox } from '@/components/SelectBox'
import { useAuth } from '@/lib/auth'
import { useBranches, useAuditLogs } from '@/hooks/useApi'
import { BranchSelector } from '@/components/BranchSelector'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/Pagination'

interface AuditLog {
  id: string
  userId: string
  userName?: string
  action: string 
  module: string 
  targetId?: string
  oldData?: string 
  newData?: string 
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

const modules = [
  { id: 'All', name: 'Tất cả' },
  { id: 'Order', name: 'Đơn hàng' },
  { id: 'Menu', name: 'Thực đơn' },
  { id: 'Employee', name: 'Nhân viên' },
  { id: 'Customer', name: 'Khách hàng' },
  { id: 'Auth', name: 'Bảo mật' },
  { id: 'Inventory', name: 'Kho hàng' },
]

export default function AuditLogsPage() {
  const [mounted, setMounted] = useState(false)
  const { user, selectedBranchId } = useAuth()
  const isOwner = user?.isOwner
  const restaurantId = user?.restaurantId || ''

  const { data: branches = [] } = useBranches(isOwner ? restaurantId : '')

  const { pageIndex, pageSize, search, setPage, setSearch, paginationParams } = usePagination(20)
  const [module, setModule] = useState('All')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const { data: auditData, isLoading: loading, refetch: loadLogs } = useAuditLogs({
    ...paginationParams,
    module: module === 'All' ? undefined : module,
    branchId: isOwner ? selectedBranchId! : undefined
  } as any)

  const logs = auditData?.items || (Array.isArray(auditData) ? auditData : [])
  const totalCount = auditData?.totalCount || logs.length
  const totalPages = auditData?.totalPages || 1

  useEffect(() => {
    setMounted(true)
  }, [])

  const getActionColor = (action: string) => {
    const a = action.toLowerCase()
    if (a.includes('create')) return 'bg-green-100 text-green-700'
    if (a.includes('update')) return 'bg-blue-100 text-blue-700'
    if (a.includes('delete')) return 'bg-red-100 text-red-700'
    if (a.includes('login')) return 'bg-purple-100 text-purple-700'
    return 'bg-gray-100 text-gray-700'
  }

  if (!mounted) return null

  return (
    <AuthLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <History className="text-blue-600" size={32} />
              Lịch sử hệ thống (Audit Log)
            </h1>
            <p className="text-gray-500 mt-1">Theo dõi mọi thay đổi dữ liệu và truy cập của nhân viên</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm theo ID thực thể, IP, hoặc Người dùng..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-0 rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <SelectBox options={modules} optionLabel='name' optionValue='id' onChange={val => { setModule(val); setPage(1); }} value={module} />
            </div>
            <button
              onClick={loadLogs}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl transition-all shadow-lg shadow-blue-100"
            >
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Thời gian</th>
                  <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Người dùng</th>
                  <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Hành động</th>
                  <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Module</th>
                  <th className="px-6 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-6 h-16 bg-white"></td>
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <Database className="text-gray-200" size={64} />
                        <p className="text-gray-500 font-medium">Không tìm thấy bản ghi nào</p>
                      </div>
                    </td>
                  </tr>
                ) : logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <Clock className="text-gray-400" size={16} />
                        <div suppressHydrationWarning>
                          <p className="font-bold text-gray-900">{new Date(log.createdAt).toLocaleTimeString('vi-VN')}</p>
                          <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 border border-gray-200">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{log.userName || 'Hệ thống'}</p>
                          <p className="text-xs text-gray-400">{log.ipAddress || 'No IP'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 font-bold text-gray-700">
                        <ShieldCheck className="text-blue-300" size={16} />
                        {log.module}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {log.targetId ? `ID: ${log.targetId}` : 'Hành động chung'}
                      </p>
                      <button className="text-blue-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
                        Xem chi tiết JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        {/* JSON Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${getActionColor(selectedLog.action)}`}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Chi tiết thay đổi dữ liệu</h2>
                    <p className="text-gray-500 text-sm">Entity ID: {selectedLog.targetId || 'Not applicable'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedLog(null)} className="bg-white hover:bg-gray-100 text-gray-400 w-12 h-12 rounded-2xl border border-gray-100 flex items-center justify-center transition-all shadow-sm">
                  <ChevronRight className="rotate-45" size={24} />
                </button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
                <div>
                  <div className="flex items-center gap-2 mb-4 text-red-600 font-bold uppercase tracking-widest text-xs">
                    <AlertCircle size={14} /> Dữ liệu cũ
                  </div>
                  <div className="bg-gray-900 rounded-3xl p-6 overflow-hidden">
                    <pre className="text-green-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {selectedLog.oldData ? JSON.stringify(JSON.parse(selectedLog.oldData), null, 2) : '// Không có dữ liệu cũ'}
                    </pre>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-4 text-green-600 font-bold uppercase tracking-widest text-xs">
                    <CheckCircle2 size={14} /> Dữ liệu mới
                  </div>
                  <div className="bg-gray-900 rounded-3xl p-6 overflow-hidden">
                    <pre className="text-blue-400 font-mono text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed">
                      {selectedLog.newData ? JSON.stringify(JSON.parse(selectedLog.newData), null, 2) : '// Không có dữ liệu mới'}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold transition-all"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
