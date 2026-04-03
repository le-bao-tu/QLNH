'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import {
    XCircle,
    Search,
    Check,
    UtensilsCrossed,
    ChevronRight,
} from 'lucide-react'

const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001'

interface Props {
    setShowModal: (isShow: boolean) => void
    visible: boolean
    editPromotion?: Promotion | null
    onSuccess?: () => void
}

const DEFAULT_FORM = {
    name: '',
    description: '',
    type: 'percentage',
    applyTo: 'bill',
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isVoucherRequired: false,
    voucherCode: ''
}

export function CreatePromoteModal({ setShowModal, visible, editPromotion, onSuccess }: Props) {
    const isEditMode = !!editPromotion

    const [form, setForm] = useState(DEFAULT_FORM)
    const [saving, setSaving] = useState(false)

    const [menuItems, setMenuItems] = useState<MenuItemDTO[]>([])
    const [loadingItems, setLoadingItems] = useState(false)
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
    const [itemSearch, setItemSearch] = useState('')

    const isItemMode = form.applyTo === 'item'

    // Khi editPromotion thay đổi, fill form
    useEffect(() => {
        if (editPromotion) {
            setForm({
                name: editPromotion.name,
                description: editPromotion.description || '',
                type: editPromotion.type,
                applyTo: editPromotion.applyTo,
                discountValue: editPromotion.discountValue,
                minOrderAmount: editPromotion.minOrderAmount ?? 0,
                maxDiscountAmount: editPromotion.maxDiscount ?? editPromotion.maxDiscountAmount ?? 0,
                startDate: editPromotion.startDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
                endDate: editPromotion.endDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
                isVoucherRequired: false,
                voucherCode: ''
            })
            // Parse menuItemIds (JSON array string hoặc comma-separated)
            if (editPromotion.menuItemIds) {
                try {
                    const parsed = JSON.parse(editPromotion.menuItemIds)
                    console.log(parsed);

                    setSelectedItemIds(Array.isArray(parsed) ? parsed : [])
                } catch {
                    setSelectedItemIds(editPromotion.menuItemIds.split(',').filter(Boolean))
                }
            } else {
                setSelectedItemIds([])
            }
        } else {
            setForm(DEFAULT_FORM)
            setSelectedItemIds([])
        }
    }, [editPromotion, visible])

    // Fetch menu items when switching to item mode
    useEffect(() => {
        if (isItemMode && menuItems.length === 0) {
            setLoadingItems(true)
            api.get(`/api/menu/items/restaurant/${RESTAURANT_ID}`)
                .then(({ data }) => setMenuItems(data || []))
                .catch(() => setMenuItems([]))
                .finally(() => setLoadingItems(false))
        }
    }, [isItemMode])

    const toggleItem = (id: string) => {
        setSelectedItemIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        setSelectedItemIds(
            selectedItemIds.length === filteredItems.length
                ? []
                : filteredItems.map(m => m.id)
        )
    }

    const filteredItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(itemSearch.toLowerCase())
    )

    const handleClose = () => {
        setShowModal(false)
        setForm(DEFAULT_FORM)
        setSelectedItemIds([])
        setItemSearch('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const menuItemIdsStr = isItemMode && selectedItemIds.length > 0
                ? JSON.stringify(selectedItemIds)
                : null

            if (isEditMode && editPromotion) {
                // Update
                await api.put(`/api/promotions/${editPromotion.id}`, {
                    name: form.name,
                    description: form.description,
                    type: form.type,
                    applyTo: form.applyTo,
                    discountValue: form.discountValue,
                    minOrderAmount: form.minOrderAmount,
                    maxDiscount: form.maxDiscountAmount,
                    startDate: form.startDate,
                    endDate: form.endDate,
                    menuItemIds: menuItemIdsStr,
                })
            } else {
                // Create
                await api.post('/api/promotions', {
                    restaurantId: RESTAURANT_ID,
                    ...form,
                    maxDiscount: form.maxDiscountAmount,
                    menuItemIds: menuItemIdsStr,
                    ...(isItemMode ? { menuItemIds: menuItemIdsStr } : {})
                })
            }

            onSuccess?.()
            handleClose()
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    return (
        visible &&
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            {/* Modal container — widens when item mode is active */}
            <div
                className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
                style={{ width: isItemMode ? '90vw' : '42rem', maxWidth: '1200px', maxHeight: '90vh' }}
            >
                {/* ── Header ── */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {isEditMode ? 'Chỉnh sửa khuyến mãi' : 'Tạo chương trình khuyến mãi'}
                        </h2>
                        {isItemMode && (
                            <p className="text-sm text-blue-600 mt-0.5 font-medium flex items-center gap-1">
                                <ChevronRight size={14} />
                                Chọn món ăn áp dụng ở bảng bên phải
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    >
                        <XCircle size={24} />
                    </button>
                </div>

                {/* ── Body — horizontal split ── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ═══ LEFT — Promotion form ═══ */}
                    <form
                        id="promotion-form"
                        onSubmit={handleSubmit}
                        className="flex flex-col overflow-y-auto p-8 gap-5 flex-shrink-0"
                        style={{ width: isItemMode ? '50%' : '100%', borderRight: isItemMode ? '1px solid #f3f4f6' : 'none' }}
                    >
                        {/* Tên */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tên chương trình *</label>
                            <input
                                required
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm"
                                placeholder="VD: Mừng khai trương, Giảm giá cuối tuần..."
                            />
                        </div>

                        {/* Mô tả */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả chi tiết</label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={2}
                                className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none text-sm"
                                placeholder="Mô tả các điều kiện áp dụng..."
                            />
                        </div>

                        {/* Loại + Giá trị */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Loại giảm giá</label>
                                <select
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value as any })}
                                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all appearance-none text-sm"
                                >
                                    <option value="percentage">Phần trăm (%)</option>
                                    <option value="fixed_amount">Số tiền cố định (đ)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Giá trị giảm *</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="number"
                                        value={form.discountValue}
                                        onChange={e => setForm({ ...form, discountValue: Number(e.target.value) })}
                                        className="w-full bg-gray-50 border-0 rounded-2xl pl-4 pr-10 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                                        {form.type === 'percentage' ? '%' : 'đ'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Ngày */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ngày bắt đầu</label>
                                <input
                                    type="date"
                                    value={form.startDate}
                                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ngày kết thúc</label>
                                <input
                                    type="date"
                                    value={form.endDate}
                                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                                    className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Đơn tối thiểu + Giảm tối đa */}
                        <div className="grid grid-cols-2 gap-4">
                            {
                                form.applyTo !== 'item' &&
                                < div >
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Đơn tối thiểu (đ)</label>
                                    <input
                                        type="number"
                                        value={form.minOrderAmount}
                                        onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                                        className="w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm"
                                    />
                                </div>
                            }

                            {
                                (form.type !== 'fixed_amount' && form.applyTo !== 'item') &&
                                < div >
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Giảm tối đa (đ)</label>
                                    <input
                                        type="number"
                                        disabled={form.type === 'fixed_amount' || form.applyTo === 'item'}
                                        value={form.maxDiscountAmount}
                                        onChange={e => setForm({ ...form, maxDiscountAmount: Number(e.target.value) })}
                                        className={`w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm ${form.type === 'fixed_amount' ? 'opacity-50' : ''}`}
                                    />
                                </div>
                            }
                        </div>

                        {/* Áp dụng cho */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Áp dụng cho</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'bill', label: 'Toàn bộ Đơn hàng', desc: 'Giảm cho cả đơn' },
                                    { value: 'item', label: 'Từng Món ăn', desc: 'Chọn món cụ thể' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                            setForm({ ...form, applyTo: opt.value as any })
                                        }}
                                        className={`text-left px-4 py-3 rounded-2xl border-2 transition-all ${form.applyTo === opt.value
                                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                                            }`}
                                    >
                                        <p className="font-bold text-sm">{opt.label}</p>
                                        <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Spacer push buttons to bottom */}
                        <div className="flex-1" />

                        {/* Action buttons */}
                        <div className="flex gap-4 pt-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 py-3.5 border-2 border-gray-100 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-all text-sm"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all text-sm"
                            >
                                {saving ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Xác nhận & Lưu'}
                            </button>
                        </div>
                    </form>

                    {/* ═══ RIGHT — Menu items table (chỉ hiện khi item mode) ═══ */}
                    {isItemMode && (
                        <div className="flex flex-col flex-1 overflow-hidden bg-gray-50/50">
                            {/* Table header bar */}
                            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-gray-800 text-sm">Danh sách món ăn</h3>
                                    {selectedItemIds.length > 0 && (
                                        <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                                            {selectedItemIds.length} đã chọn
                                        </span>
                                    )}
                                </div>
                                {/* Search */}
                                <div className="relative flex-1 max-w-xs">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={itemSearch}
                                        onChange={e => setItemSearch(e.target.value)}
                                        placeholder="Tìm theo tên món..."
                                        className="w-full bg-gray-50 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-y-auto flex-1">
                                {loadingItems ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                                        <p className="text-sm">Đang tải danh sách món...</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-white z-10">
                                            <tr className="border-b border-gray-100">
                                                <th className="px-6 py-3 w-10">
                                                    <button
                                                        type="button"
                                                        onClick={toggleAll}
                                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedItemIds.length === filteredItems.length && filteredItems.length > 0
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'border-gray-300 hover:border-blue-400'
                                                            }`}
                                                    >
                                                        {selectedItemIds.length === filteredItems.length && filteredItems.length > 0 && (
                                                            <Check size={11} className="text-white" strokeWidth={3} />
                                                        )}
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Tên món</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Ảnh</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wider">Danh mục</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-500 text-xs uppercase tracking-wider">Giá</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5}>
                                                        <div className="flex flex-col items-center py-16 text-gray-400">
                                                            <UtensilsCrossed size={36} className="mb-3 opacity-40" />
                                                            <p className="font-medium">Không tìm thấy món ăn</p>
                                                            <p className="text-xs mt-1 opacity-70">Thử thay đổi từ khóa tìm kiếm</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredItems.map((item, idx) => {
                                                    const selected = selectedItemIds.includes(item.id)
                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            onClick={() => toggleItem(item.id)}
                                                            className={`cursor-pointer border-b border-gray-50 transition-colors ${selected
                                                                ? 'bg-blue-50 hover:bg-blue-100/70'
                                                                : idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/40 hover:bg-gray-100/60'
                                                                }`}
                                                        >
                                                            <td className="px-6 py-3">
                                                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                                    {selected && <Check size={11} className="text-white" strokeWidth={3} />}
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`font-medium ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
                                                                    {item.name}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {item.imageUrl ? (
                                                                    <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-md" />
                                                                ) : (
                                                                    <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-md flex items-center justify-center">
                                                                        <span className="text-gray-500 text-xs">IMG</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {item.categoryName ? (
                                                                    <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                                                                        {item.categoryName}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-300 text-xs">—</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-semibold text-gray-700">
                                                                {item.price !== undefined
                                                                    ? `${item.price.toLocaleString()}đ`
                                                                    : <span className="text-gray-300">—</span>
                                                                }
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Footer summary */}
                            {selectedItemIds.length > 0 && (
                                <div className="px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
                                    <p className="text-sm text-gray-500">
                                        Đã chọn <span className="font-bold text-blue-600">{selectedItemIds.length}</span> / {menuItems.length} món
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedItemIds([])}
                                        className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors"
                                    >
                                        Bỏ chọn tất cả
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div >
        </div >
    )
}