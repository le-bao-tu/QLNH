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
import { useAuth } from '@/lib/auth'
import { useBranches } from '@/hooks/useApi'
import { CheckboxMultiSelect } from '@/components/CheckboxMultiSelect'
import { SelectBox } from '@/components/SelectBox'
import { useToast } from '@/hooks/useToast'
import { Formik, useFormik } from 'formik'
import * as Yup from 'yup'
import { AlertCircle } from 'lucide-react'

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

const promoteTypes = [
    { value: 'percentage', label: 'Phần trăm (%)' },
    { value: 'fixed_amount', label: 'Số tiền cố định (đ)' },
]

export function CreatePromoteModal({ setShowModal, visible, editPromotion, onSuccess }: Props) {
    const { user } = useAuth()
    const restaurantId = user?.restaurantId || ''

    const toast = useToast()
    const [saving, setSaving] = useState(false)
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
    const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([])
    const [itemSearch, setItemSearch] = useState('')
    const [menuItems, setMenuItems] = useState<any[]>([])
    const [loadingItems, setLoadingItems] = useState(false)
    const branches = useBranches(restaurantId) || []
    const isEditMode = Boolean(editPromotion)

    const validationSchema = Yup.object({
        name: Yup.string().required('Tên khuyến mãi là bắt buộc').max(200, 'Tên không quá 200 ký tự'),
        discountValue: Yup.number().typeError('Giá trị phải là số').required('Giá trị là bắt buộc').positive('Giá trị phải lớn hơn 0'),
        startDate: Yup.date().required('Ngày bắt đầu là bắt buộc'),
        endDate: Yup.date().required('Ngày kết thúc là bắt buộc').min(Yup.ref('startDate'), 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu'),
        minOrderAmount: Yup.number().typeError('Đơn tối thiểu phải là số').min(0, 'Không được âm'),
        maxDiscountAmount: Yup.number().typeError('Giảm tối đa phải là số').min(0, 'Không được âm'),
    });

    const formik = useFormik({
        initialValues: DEFAULT_FORM,
        validationSchema,
        onSubmit: async (values) => {
            setSaving(true);
            try {
                const menuItemIdsStr = values.applyTo === 'item' && selectedItemIds.length > 0
                    ? JSON.stringify(selectedItemIds)
                    : null;

                const branchIdsStr = selectedBranchIds.length > 0
                    ? JSON.stringify(selectedBranchIds)
                    : null;

                if (isEditMode && editPromotion) {
                    await api.put(`/api/promotions/${editPromotion.id}`, {
                        ...values,
                        maxDiscount: values.maxDiscountAmount,
                        menuItemIds: menuItemIdsStr,
                        branchIds: branchIdsStr,
                    });
                } else {
                    await api.post('/api/promotions', {
                        restaurantId,
                        ...values,
                        maxDiscount: values.maxDiscountAmount,
                        menuItemIds: menuItemIdsStr,
                        branchIds: branchIdsStr,
                    });
                }

                toast.success(isEditMode ? 'Cập nhật khuyến mãi thành công' : 'Tạo khuyến mãi thành công');
                onSuccess?.();
                handleClose();
            } catch (err: any) {
                console.error(err);
                toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu khuyến mãi');
            } finally {
                setSaving(false);
            }
        }
    });

    const isItemMode = formik.values.applyTo === 'item'

    const handleClose = () => {
        setShowModal(false);
        formik.resetForm();
        setSelectedItemIds([]);
        setSelectedBranchIds([]);
        setItemSearch('');
    }

    // Khi editPromotion thay đổi, fill form
    useEffect(() => {
        if (editPromotion) {
            formik.setValues({
                name: editPromotion.name,
                description: editPromotion.description || '',
                type: editPromotion.type,
                applyTo: editPromotion.applyTo,
                discountValue: editPromotion.discountValue,
                minOrderAmount: editPromotion.minOrderAmount ?? 0,
                maxDiscountAmount: editPromotion.maxDiscount ?? 0,
                startDate: editPromotion.startDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
                endDate: editPromotion.endDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
                isVoucherRequired: false,
                voucherCode: ''
            })
            // Parse menuItemIds
            if (editPromotion.menuItemIds) {
                try {
                    const parsed = JSON.parse(editPromotion.menuItemIds)
                    setSelectedItemIds(Array.isArray(parsed) ? parsed : [])
                } catch {
                    setSelectedItemIds(editPromotion.menuItemIds.split(',').filter(Boolean))
                }
            } else {
                setSelectedItemIds([])
            }
            // Parse branchIds
            if (editPromotion.branchIds) {
                try {
                    const parsed = JSON.parse(editPromotion.branchIds)
                    setSelectedBranchIds(Array.isArray(parsed) ? parsed : [])
                } catch {
                    setSelectedBranchIds(editPromotion.branchIds.split(',').filter(Boolean))
                }
            } else {
                setSelectedBranchIds([])
            }
        } else {
            formik.resetForm();
            setSelectedItemIds([])
            setSelectedBranchIds([])
        }
    }, [editPromotion, visible])

    // Fetch menu items when switching to item mode
    useEffect(() => {
        if (isItemMode && menuItems.length === 0 && restaurantId) {
            setLoadingItems(true)
            api.get(`/api/menu/items/restaurant/${restaurantId}`)
                .then(({ data }) => setMenuItems(data || []))
                .catch(() => setMenuItems([]))
                .finally(() => setLoadingItems(false))
        }
    }, [isItemMode, restaurantId])

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
                        onSubmit={formik.handleSubmit}
                        className="flex flex-col overflow-y-auto p-8 gap-5 flex-shrink-0"
                        style={{ width: isItemMode ? '50%' : '100%', borderRight: isItemMode ? '1px solid #f3f4f6' : 'none' }}
                    >
                        <div id="promotion-form-content">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tên chương trình *</label>
                            <input
                                name="name"
                                type="text"
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className={`w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm ${formik.touched.name && formik.errors.name ? 'ring-2 ring-red-500' : ''}`}
                                placeholder="VD: Mừng khai trương, Giảm giá cuối tuần..."
                            />
                            {formik.touched.name && formik.errors.name && (
                                <p className="text-red-500 text-xs mt-1">{formik.errors.name}</p>
                            )}
                        </div>

                        {/* Mô tả */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Mô tả chi tiết</label>
                            <textarea
                                name="description"
                                value={formik.values.description}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                rows={2}
                                className="w-full bg-gray-50 border-0 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none text-sm"
                                placeholder="Mô tả các điều kiện áp dụng..."
                            />
                        </div>

                        {/* Loại + Giá trị */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Loại giảm giá</label>
                                <SelectBox
                                    options={promoteTypes}
                                    optionLabel='label'
                                    optionValue='value'
                                    onChange={val => formik.setFieldValue('type', val)}
                                    value={formik.values.type}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Giá trị giảm *</label>
                                <div className="relative">
                                    <input
                                        name="discountValue"
                                        type="number"
                                        value={formik.values.discountValue}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={`w-full bg-gray-50 border-0 rounded-2xl pl-4 pr-10 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm ${formik.touched.discountValue && formik.errors.discountValue ? 'ring-2 ring-red-500' : ''}`}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                                        {formik.values.type === 'percentage' ? '%' : 'đ'}
                                    </span>
                                </div>
                                {formik.touched.discountValue && formik.errors.discountValue && (
                                    <p className="text-red-500 text-xs mt-1">{formik.errors.discountValue}</p>
                                )}
                            </div>
                        </div>

                        {/* Ngày */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ngày bắt đầu</label>
                                <input
                                    name="startDate"
                                    type="date"
                                    value={formik.values.startDate}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className={`w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm ${formik.touched.startDate && formik.errors.startDate ? 'ring-2 ring-red-500' : ''}`}
                                />
                                {formik.touched.startDate && formik.errors.startDate && (
                                    <p className="text-red-500 text-xs mt-1">{formik.errors.startDate}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ngày kết thúc</label>
                                <input
                                    name="endDate"
                                    type="date"
                                    value={formik.values.endDate}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className={`w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm ${formik.touched.endDate && formik.errors.endDate ? 'ring-2 ring-red-500' : ''}`}
                                />
                                {formik.touched.endDate && formik.errors.endDate && (
                                    <p className="text-red-500 text-xs mt-1">{formik.errors.endDate}</p>
                                )}
                            </div>
                        </div>

                        {/* Đơn tối thiểu + Giảm tối đa */}
                        <div className="grid grid-cols-2 gap-4">
                            {
                                formik.values.applyTo !== 'item' &&
                                < div >
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Đơn tối thiểu (đ)</label>
                                    <input
                                        name="minOrderAmount"
                                        type="number"
                                        value={formik.values.minOrderAmount}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={`w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm ${formik.touched.minOrderAmount && formik.errors.minOrderAmount ? 'ring-2 ring-red-500' : ''}`}
                                    />
                                    {formik.touched.minOrderAmount && formik.errors.minOrderAmount && (
                                        <p className="text-red-500 text-xs mt-1">{formik.errors.minOrderAmount}</p>
                                    )}
                                </div>
                            }

                            {
                                (formik.values.type !== 'fixed_amount' && formik.values.applyTo !== 'item') &&
                                < div >
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Giảm tối đa (đ)</label>
                                    <input
                                        name="maxDiscountAmount"
                                        type="number"
                                        value={formik.values.maxDiscountAmount}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={`w-full bg-gray-50 border-0 rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-blue-600 outline-none transition-all text-sm ${formik.touched.maxDiscountAmount && formik.errors.maxDiscountAmount ? 'ring-2 ring-red-500' : ''}`}
                                    />
                                    {formik.touched.maxDiscountAmount && formik.errors.maxDiscountAmount && (
                                        <p className="text-red-500 text-xs mt-1">{formik.errors.maxDiscountAmount}</p>
                                    )}
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
                                            formik.setFieldValue('applyTo', opt.value)
                                        }}
                                        className={`text-left px-4 py-3 rounded-2xl border-2 transition-all ${formik.values.applyTo === opt.value
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

                        {/* Chi nhánh áp dụng (checkbox multi-select) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Chi nhánh áp dụng</label>
                            <CheckboxMultiSelect
                                options={branches.data as Array<{ id: string, name: string }> || []}
                                value={selectedBranchIds}
                                onChange={setSelectedBranchIds}
                                placeholder="Chọn chi nhánh..."
                            />
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
                                    <div>
                                        {isItemMode && selectedItemIds.length === 0 && (
                                            <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-center gap-2 text-amber-700 text-xs font-bold">
                                                <AlertCircle size={14} />
                                                Vui lòng chọn ít nhất một món ăn
                                            </div>
                                        )}
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
                                    </div>
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