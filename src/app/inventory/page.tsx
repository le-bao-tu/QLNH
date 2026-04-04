'use client'

import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'

import { useAuth } from '@/lib/auth'

interface InventoryItem {
  id: string
  name: string
  unit: string
  currentQuantity: number
  minQuantity: number
  costPrice: number
  supplierName?: string
  isLowStock: boolean
}

interface Supplier {
  id: string
  name: string
  contactName?: string
  phone?: string
  email?: string
}

export default function InventoryPage() {
  const { user } = useAuth()
  const branchId = user?.branchId || ''
  const restaurantId = user?.restaurantId || ''

  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [tab, setTab] = useState<'inventory' | 'suppliers'>('inventory')
  const [loading, setLoading] = useState(true)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showTxModal, setShowTxModal] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState({ name: '', unit: 'kg', minQuantity: 0, costPrice: 0, supplierId: '' })
  const [txForm, setTxForm] = useState({ type: 'import', quantityChange: 0, note: '' })

  const loadItems = async () => {
    if (!branchId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/api/inventory/items/branch/${branchId}`)
      setItems(data)
    } catch { setItems([]) } finally { setLoading(false) }
  }

  const loadSuppliers = async () => {
    if (!restaurantId) return
    setLoading(true)
    try {
      const { data } = await api.get(`/api/inventory/suppliers/restaurant/${restaurantId}`)
      setSuppliers(data)
    } catch { setSuppliers([]) } finally { setLoading(false) }
  }

  useEffect(() => {
    if (tab === 'inventory') loadItems()
    else loadSuppliers()
  }, [tab, branchId, restaurantId])

  const lowStock = items.filter(i => i.isLowStock)

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchId) return
    await api.post('/api/inventory/items', {
      branchId: branchId,
      supplierId: itemForm.supplierId || null,
      name: itemForm.name, unit: itemForm.unit,
      minQuantity: itemForm.minQuantity, costPrice: itemForm.costPrice,
    })
    setShowItemModal(false)
    loadItems()
  }

  const recordTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showTxModal) return
    await api.post('/api/inventory/transactions', {
      inventoryItemId: showTxModal,
      type: txForm.type,
      quantityChange: txForm.type === 'export' || txForm.type === 'waste' ? -Math.abs(txForm.quantityChange) : Math.abs(txForm.quantityChange),
      note: txForm.note,
    })
    setShowTxModal(null)
    setTxForm({ type: 'import', quantityChange: 0, note: '' })
    loadItems()
  }

  return (
    <AuthLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kho nguyên liệu</h1>
            <p className="text-gray-500 text-sm mt-1">Theo dõi tồn kho và nhà cung cấp</p>
          </div>
          {tab === 'inventory' && (
            <button onClick={() => setShowItemModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Thêm nguyên liệu
            </button>
          )}
        </div>

        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-red-500 text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-700">Cảnh báo tồn kho thấp</p>
              <p className="text-sm text-red-600">{lowStock.map(i => i.name).join(', ')} đang dưới mức tối thiểu</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {[{ key: 'inventory', label: '📦 Kho hàng' }, { key: 'suppliers', label: '🏭 Nhà cung cấp' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Inventory Tab */}
        {tab === 'inventory' && (
          loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Nguyên liệu</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Tồn kho</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Tối thiểu</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Giá nhập</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">NCC</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">Chưa có nguyên liệu nào</td></tr>
                  ) : items.map(item => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {item.isLowStock && <span className="w-2 h-2 bg-red-500 rounded-full" title="Tồn kho thấp" />}
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${item.isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                        {item.currentQuantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{item.minQuantity} {item.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{item.costPrice.toLocaleString()}đ</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{item.supplierName || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setShowTxModal(item.id)}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 whitespace-nowrap">
                          Xuất/Nhập
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Suppliers Tab */}
        {tab === 'suppliers' && (
          loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.length === 0 ? (
                <div className="col-span-3 bg-white rounded-xl p-12 text-center border">
                  <div className="text-4xl mb-3">🏭</div>
                  <p className="text-gray-500">Chưa có nhà cung cấp nào</p>
                </div>
              ) : suppliers.map(sup => (
                <div key={sup.id} className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-lg">🏭</div>
                    <div>
                      <p className="font-semibold text-gray-900">{sup.name}</p>
                      {sup.contactName && <p className="text-xs text-gray-500">{sup.contactName}</p>}
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {sup.phone && <div>📱 {sup.phone}</div>}
                    {sup.email && <div>✉️ {sup.email}</div>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Add Item Modal */}
        {showItemModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Thêm nguyên liệu</h2>
                <form onSubmit={createItem} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tên nguyên liệu *</label>
                    <input required value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Đơn vị</label>
                      <select value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                        className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {['kg', 'g', 'lít', 'ml', 'cái', 'hộp', 'gói', 'chai'].map(u => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">T.thiểu</label>
                      <input type="number" min={0} step="0.001" value={itemForm.minQuantity} onChange={e => setItemForm({ ...itemForm, minQuantity: Number(e.target.value) })}
                        className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Giá nhập (VNĐ)</label>
                    <input type="number" min={0} value={itemForm.costPrice} onChange={e => setItemForm({ ...itemForm, costPrice: Number(e.target.value) })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Hủy</button>
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Thêm</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Modal */}
        {showTxModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm">
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Nhập/Xuất kho</h2>
                <form onSubmit={recordTransaction} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Loại giao dịch</label>
                    <select value={txForm.type} onChange={e => setTxForm({ ...txForm, type: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="import">Nhập kho</option>
                      <option value="export">Xuất kho</option>
                      <option value="adjust">Điều chỉnh</option>
                      <option value="waste">Hàng hỏng</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Số lượng</label>
                    <input type="number" min={0} step="0.001" required value={txForm.quantityChange} onChange={e => setTxForm({ ...txForm, quantityChange: Number(e.target.value) })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                    <input value={txForm.note} onChange={e => setTxForm({ ...txForm, note: e.target.value })}
                      className="w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowTxModal(null)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Hủy</button>
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Xác nhận</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
