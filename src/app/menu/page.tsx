'use client'

import { useState, useRef, JSX, useEffect, startTransition } from 'react'
import AuthLayout from '@/components/AuthLayout'
import {
  useMenuCategories, useCreateMenuCategory, useUpdateMenuCategory, useDeleteMenuCategory,
  useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
  useBranches, useMenuItemsInBranch
} from '@/hooks/useApi'
import { Plus, Edit2, Trash2, BookOpen, Search, ToggleLeft, ToggleRight, ImagePlus, X, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/hooks/useToast'
import { ConfirmModal } from '@/components/ConfirmModal'
import { CheckboxMultiSelect } from '@/components/CheckboxMultiSelect'
import { SelectBox } from '@/components/SelectBox'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/Pagination'
import { useFormik } from 'formik'
import * as Yup from 'yup'

interface MenuComboItem { id: string; name: string; price: number; imageUrl?: string; quantity: number }
interface MenuItem { id: string; name: string; price: number; discountPrice?: number; discountType?: string; discountValue?: number; imageUrl?: string; unit: string; isAvailable: boolean; categoryId: string; categoryName: string; description: string; sortOrder: number; itemType: string; comboItems?: MenuComboItem[], branchIds?: string }
interface MenuCategory { id: string; name: string; sortOrder: number; branchIds?: string }

export default function MenuPage() {
  const { user } = useAuth()
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.branchId || '')
  const restaurantId = user?.restaurantId || ''
  const toast = useToast()
  const isOwner = user?.isOwner
  const branchId = user?.branchId || ''
  const [activeCategory, setActiveCategory] = useState('all')
  const { pageIndex, pageSize, search, setSearch, setPage, paginationParams } = usePagination(20)

  const { data: categories = [] } = useMenuCategories(restaurantId, selectedBranchId)
  const { data: menuData, isLoading: isItemsInRestaurantLoading } = useMenuItems(restaurantId, selectedBranchId, { ...paginationParams, categoryId: activeCategory === 'all' ? undefined : activeCategory })

  // Backward compatibility check
  const items: MenuItem[] = menuData?.items || (Array.isArray(menuData) ? menuData : [])
  const totalCount = menuData?.totalCount || items.length
  const totalPages = menuData?.totalPages || 1

  const { data: itemsInBranch = [], isLoading: isItemsInBranchLoading } = useMenuItemsInBranch(branchId)
  const { data: branches = [] } = useBranches(restaurantId)

  const createItem = useCreateMenuItem()
  const updateItem = useUpdateMenuItem()
  const deleteItem = useDeleteMenuItem()

  const createCategory = useCreateMenuCategory()
  const updateCategory = useUpdateMenuCategory()
  const deleteCategory = useDeleteMenuCategory()

  const [showItemForm, setShowItemForm] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [editCat, setEditCat] = useState<MenuCategory | null>(null)
  const [catForm, setCatForm] = useState({ name: '', sortOrder: '0' })
  const [catBranchIds, setCatBranchIds] = useState<string[]>([branchId])
  const [previewCombo, setPreviewCombo] = useState<MenuItem | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, itemId: string | null, type: 'item' | 'category' }>({ isOpen: false, itemId: null, type: 'item' })
  const [itemForm, setItemForm] = useState<{ name: string; price: string; description: string; unit: string; categoryId: string; sortOrder: string; imageUrl: string; itemType: string; comboItemIds: string[] }>({
    name: '', price: '', description: '', unit: 'phần', categoryId: '', sortOrder: '0', imageUrl: '', itemType: 'single', comboItemIds: []
  })
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([branchId])
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageDragOver, setImageDragOver] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [comboItemSearch, setComboItemSearch] = useState('')

  // Use items directly since server handles search and category filtering
  const displayItems = items

  const catValidationSchema = Yup.object({
    name: Yup.string().required('Tên danh mục là bắt buộc'),
    sortOrder: Yup.number().typeError('Thứ tự phải là số').required('Thứ tự là bắt buộc'),
  });

  const catFormik = useFormik({
    initialValues: { name: '', sortOrder: '0' },
    validationSchema: catValidationSchema,
    onSubmit: async (values) => {
      if (!restaurantId) return;
      setSaving(true);
      try {
        const branchIdsStr = catBranchIds.length > 0 ? JSON.stringify(catBranchIds) : null;
        const payload = {
          restaurantId,
          name: values.name,
          sortOrder: parseInt(values.sortOrder),
          branchIds: branchIdsStr
        };

        if (editCat) {
          await updateCategory.mutateAsync({ id: editCat.id, ...payload });
        } else {
          await createCategory.mutateAsync(payload);
        }

        setShowCatForm(false);
        setEditCat(null);
        catFormik.resetForm();
        setCatBranchIds([]);
        toast.success('Đã lưu danh mục');
      } finally { setSaving(false); }
    }
  });

  const handleEditCategory = (cat: MenuCategory) => {
    setEditCat(cat);
    catFormik.setValues({ name: cat.name, sortOrder: cat.sortOrder.toString() });
    setCatBranchIds(cat.branchIds ? JSON.parse(cat.branchIds) : []);
    setShowCatForm(true);
  }

  const handleImageChange = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh!'); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const itemValidationSchema = Yup.object({
    name: Yup.string().required('Tên món là bắt buộc'),
    price: Yup.number().typeError('Giá phải là số').min(0, 'Giá không được âm').required('Giá là bắt buộc'),
    categoryId: Yup.string().required('Vui lòng chọn danh mục'),
    sortOrder: Yup.number().typeError('Thứ tự phải là số').required('Thứ tự là bắt buộc'),
    itemType: Yup.string().required(),
    comboItemIds: Yup.array().when('itemType', {
      is: 'combo',
      then: (schema) => schema.min(1, 'Combo phải có ít nhất một món'),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const itemFormik = useFormik({
    initialValues: {
      name: '', price: '', description: '', unit: 'phần', categoryId: '',
      sortOrder: '0', imageUrl: '', itemType: 'single', comboItemIds: [] as string[]
    },
    validationSchema: itemValidationSchema,
    onSubmit: async (values) => {
      setSaving(true);
      try {
        let finalImageUrl = values.imageUrl;

        if (imageFile) {
          setUploadingImage(true);
          try {
            const formData = new FormData();
            formData.append('file', imageFile);
            const { data } = await api.post('/api/menu/items/upload-image', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            finalImageUrl = data.url;
          } finally {
            setUploadingImage(false);
          }
        }

        const branchIdsStr = selectedBranchIds.length > 0 ? JSON.stringify(selectedBranchIds) : null;

        const payload = {
          ...values,
          imageUrl: finalImageUrl,
          price: parseFloat(values.price as string),
          sortOrder: parseInt(values.sortOrder),
        };
        if (editItem) {
          await updateItem.mutateAsync({ id: editItem.id, ...payload, branchIds: branchIdsStr });
        } else {
          await createItem.mutateAsync({ ...payload, restaurantId, branchIds: branchIdsStr });
        }
        setShowItemForm(false);
        setEditItem(null);
        itemFormik.resetForm();
        setImageFile(null);
        setImagePreview('');
        toast.success('Đã lưu món ăn');
      } finally { setSaving(false); }
    }
  });

  const handleEditItem = (item: MenuItem) => {
    setEditItem(item)
    setItemForm({
      name: item.name, price: item.price.toString(), description: item.description,
      unit: item.unit, categoryId: item.categoryId, sortOrder: item.sortOrder.toString(),
      imageUrl: item.imageUrl || '', itemType: item.itemType || 'single', comboItemIds: item.comboItems?.map(c => c.id) || []
    })
    setSelectedBranchIds(item.branchIds ? JSON.parse(item.branchIds) : [])
    setImageFile(null)
    setImagePreview(item.imageUrl || '')
    setShowItemForm(true)
  }

  const handleToggleAvailable = async (item: MenuItem) => {
    await updateItem.mutateAsync({ id: item.id, isAvailable: !item.isAvailable })
  }

  // Nếu là owner và chưa có chi nhánh nào được chọn, tự động chọn chi nhánh đầu tiên
  useEffect(() => {
    if (isOwner && !selectedBranchId && branches.length > 0) {
      startTransition(() => {
        setSelectedBranchId(prev => prev || branches[0].id)
      })
    }
  }, [isOwner, selectedBranchId, branches])

  return (
    <AuthLayout>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={22} color="#2563eb" />
              Quản lý thực đơn
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>{items.length} món · {categories.length} danh mục</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {
              isOwner && (
                <div className='w-52'>
                  <SelectBox value={selectedBranchId} options={branches} optionLabel='name' optionValue='id' onChange={(val) => setSelectedBranchId(val)} />
                </div>
              )
            }
            <button className="btn btn-secondary shrink-0" onClick={() => setShowCatForm(true)} id="add-category-btn">
              <Plus size={15} />
              Thêm danh mục
            </button>
            <button className="btn btn-primary shrink-0" onClick={() => { setShowItemForm(true); setEditItem(null); setItemForm({ name: '', price: '', description: '', unit: 'phần', categoryId: categories[0]?.id || '', sortOrder: '0', imageUrl: '', itemType: 'single', comboItemIds: [] }) }} id="add-item-btn">
              <Plus size={15} />
              Thêm món
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', marginRight: 8 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="input"
              style={{ paddingLeft: 32, width: 200, height: 36 }}
              placeholder="Tìm món..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className={`btn btn-sm ${activeCategory !== 'all' ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setActiveCategory('all')}>
            Tất cả ({totalCount})
          </button>
          {categories.map((cat: MenuCategory) => {
            return (
              <div key={cat.id} className="relative group">
                <button
                  className={`btn btn-sm ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.name}
                </button>
                {isOwner && (
                  <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditCategory(cat) }}
                      className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700"
                    >
                      <Edit2 size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDialog({ isOpen: true, itemId: cat.id, type: 'category' }) }}
                      className="w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-700"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Tên món', 'Ảnh', 'Loại', 'Danh mục', 'Đơn vị', 'Giá', 'Trạng thái', 'Thao tác'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item: MenuItem, idx: number) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 14 }}>{item.name}</div>
                      {item.description && (
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.description}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '4px' }} />
                      )}
                    </td>

                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: item.itemType === 'combo' ? '#f59e0b' : '#3b82f6', color: 'white', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {item.itemType === 'combo' ? 'Tổng hợp' : 'Đơn lẻ'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{item.categoryName}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{item.unit}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14 }}>
                      {item.discountPrice && item.discountPrice < item.price ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>
                            {item.price.toLocaleString('vi-VN')}đ
                          </span>
                          <span style={{ fontWeight: 700, color: '#ef4444' }}>
                            {item.discountPrice.toLocaleString('vi-VN')}đ
                          </span>
                          <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase' }}>
                            {item.discountType === 'percentage' ? `-${item.discountValue}%` : 'Giảm giá'}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 700, color: '#2563eb' }}>
                          {item.price.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => handleToggleAvailable(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.isAvailable ? (
                          <><ToggleRight size={22} color="#16a34a" /><span style={{ fontSize: 12, color: '#16a34a' }}>Đang bán</span></>
                        ) : (
                          <><ToggleLeft size={22} color="#94a3b8" /><span style={{ fontSize: 12, color: '#94a3b8' }}>Tạm ngừng</span></>
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {item.itemType === 'combo' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => setPreviewCombo(item)}>
                            <Search size={13} />
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditItem(item)}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDialog({ isOpen: true, itemId: item.id, type: 'item' }) }} className="btn btn-danger btn-sm">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {items.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                {isItemsInRestaurantLoading || isItemsInBranchLoading ? 'Đang tải...' : 'Không có món nào'}
              </div>
            )}
          </div>
          <Pagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>

        {showCatForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card animate-fade-in" style={{ padding: 32, width: 400 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editCat ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
              <form onSubmit={catFormik.handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tên danh mục *</label>
                  <input
                    name="name"
                    className={`input ${catFormik.touched.name && catFormik.errors.name ? 'border-red-500' : ''}`}
                    value={catFormik.values.name}
                    onChange={catFormik.handleChange}
                    onBlur={catFormik.handleBlur}
                    placeholder="VD: Món chính"
                  />
                  {catFormik.touched.name && catFormik.errors.name && (
                    <p className="text-red-500 text-xs mt-1">{catFormik.errors.name}</p>
                  )}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Thứ tự</label>
                  <input
                    name="sortOrder"
                    className={`input ${catFormik.touched.sortOrder && catFormik.errors.sortOrder ? 'border-red-500' : ''}`}
                    type="number"
                    value={catFormik.values.sortOrder}
                    onChange={catFormik.handleChange}
                    onBlur={catFormik.handleBlur}
                  />
                  {catFormik.touched.sortOrder && catFormik.errors.sortOrder && (
                    <p className="text-red-500 text-xs mt-1">{catFormik.errors.sortOrder}</p>
                  )}
                </div>
                {isOwner && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Chi nhánh áp dụng</label>
                    <CheckboxMultiSelect
                      options={branches as Array<{ id: string; name: string }>}
                      value={catBranchIds}
                      onChange={setCatBranchIds}
                      placeholder="Tất cả chi nhánh"
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowCatForm(false); setEditCat(null); catFormik.resetForm(); setCatBranchIds([]); }}>Hủy</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>Lưu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showItemForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
            <div
              className="animate-fade-in"
              style={{
                background: 'white', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                width: itemForm.itemType === 'combo' ? '90vw' : '480px',
                maxWidth: 1200, maxHeight: '90vh',
                transition: 'width 0.3s ease'
              }}
            >
              <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>{editItem ? 'Sửa món ăn' : 'Thêm món mới'}</h2>
                  {itemForm.itemType === 'combo' && (
                    <p style={{ fontSize: 12, color: '#2563eb', margin: '2px 0 0', fontWeight: 500 }}>▸ Chọn các món đơn lẻ trong combo ở bảng bên phải</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setShowItemForm(false); setEditItem(null); setImageFile(null); setImagePreview('') }}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 18, fontWeight: 700 }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <form
                  onSubmit={itemFormik.handleSubmit}
                  style={{
                    width: itemFormik.values.itemType === 'combo' ? '50%' : '100%',
                    flexShrink: 0, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
                    borderRight: itemFormik.values.itemType === 'combo' ? '1px solid #f1f5f9' : 'none',
                    transition: 'width 0.3s ease'
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>Tên món *</label>
                    <input
                      name="name"
                      className={`input ${itemFormik.touched.name && itemFormik.errors.name ? 'border-red-500' : ''}`}
                      placeholder="VD: Phở bò tái"
                      value={itemFormik.values.name}
                      onChange={itemFormik.handleChange}
                      onBlur={itemFormik.handleBlur}
                    />
                    {itemFormik.touched.name && itemFormik.errors.name && <p className="text-red-500 text-[10px]">{itemFormik.errors.name}</p>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>Giá (VNĐ) *</label>
                    <input
                      name="price"
                      type="number"
                      className={`input ${itemFormik.touched.price && itemFormik.errors.price ? 'border-red-500' : ''}`}
                      placeholder="85000"
                      value={itemFormik.values.price}
                      onChange={itemFormik.handleChange}
                      onBlur={itemFormik.handleBlur}
                    />
                    {itemFormik.touched.price && itemFormik.errors.price && <p className="text-red-500 text-[10px]">{itemFormik.errors.price}</p>}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>Mô tả</label>
                    <input
                      name="description"
                      className="input"
                      placeholder="Mô tả ngắn về món"
                      value={itemFormik.values.description}
                      onChange={itemFormik.handleChange}
                      onBlur={itemFormik.handleBlur}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151' }}>Đơn vị</label>
                    <input
                      name="unit"
                      className="input"
                      placeholder="phần, ly, đĩa..."
                      value={itemFormik.values.unit}
                      onChange={itemFormik.handleChange}
                      onBlur={itemFormik.handleBlur}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Ảnh món ăn</label>
                    <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageChange(e.target.files?.[0] ?? null)} />
                    {imagePreview ? (
                      <div style={{ position: 'relative', width: '100%', height: 150, borderRadius: 10, overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                        <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: 0, transition: 'opacity 0.2s' }}
                        >
                          <button type="button" onClick={() => imageInputRef.current?.click()} style={{ background: 'white', color: '#0f172a', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <ImagePlus size={14} /> Đổi ảnh
                          </button>
                          <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); itemFormik.setFieldValue('imageUrl', '') }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <X size={14} /> Xóa
                          </button>
                        </div>
                        {uploadingImage && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <Loader2 size={24} color="#2563eb" style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 600 }}>Đang tải ảnh...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => imageInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setImageDragOver(true) }}
                        onDragLeave={() => setImageDragOver(false)}
                        onDrop={e => { e.preventDefault(); setImageDragOver(false); handleImageChange(e.dataTransfer.files?.[0] ?? null) }}
                        style={{ width: '100%', height: 110, border: `2px dashed ${imageDragOver ? '#2563eb' : '#cbd5e1'}`, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 5, transition: 'all 0.2s', background: imageDragOver ? '#eff6ff' : '#f8fafc' }}
                      >
                        <ImagePlus size={26} color={imageDragOver ? '#2563eb' : '#94a3b8'} />
                        <span style={{ fontSize: 13, color: imageDragOver ? '#2563eb' : '#64748b', fontWeight: 500 }}>Kéo thả hoặc click để chọn ảnh</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>PNG, JPG, WEBP — tối đa 5MB</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Danh mục *</label>
                    <SelectBox
                      options={categories}
                      optionLabel='name'
                      optionValue='id'
                      onChange={val => itemFormik.setFieldValue('categoryId', val)}
                      value={itemFormik.values.categoryId}
                    />
                    {itemFormik.touched.categoryId && itemFormik.errors.categoryId && <p className="text-red-500 text-[10px] mt-1">{itemFormik.errors.categoryId}</p>}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Phân loại món *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[{ value: 'single', label: 'Món đơn lẻ', desc: 'Món ăn riêng lẻ' }, { value: 'combo', label: 'Món tổng hợp', desc: 'Combo nhiều món' }].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => { itemFormik.setFieldValue('itemType', opt.value); if (opt.value === 'single') itemFormik.setFieldValue('comboItemIds', []); setComboItemSearch('') }}
                          style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${itemFormik.values.itemType === opt.value ? '#2563eb' : '#e2e8f0'}`, background: itemFormik.values.itemType === opt.value ? '#eff6ff' : '#f8fafc', transition: 'all 0.15s' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: itemFormik.values.itemType === opt.value ? '#1d4ed8' : '#374151', margin: 0 }}>{opt.label}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {
                    isOwner && (
                      <div>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Chi nhánh áp dụng</label>
                        <CheckboxMultiSelect
                          options={branches as Array<{ id: string; name: string }>}
                          value={selectedBranchIds}
                          onChange={setSelectedBranchIds}
                          placeholder="Chọn chi nhánh..."
                        />
                      </div>
                    )
                  }

                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowItemForm(false); setEditItem(null); setImageFile(null); setImagePreview('') }}>Hủy</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving || uploadingImage} id="save-item-btn">
                      {saving ? (uploadingImage ? 'Đang tải ảnh...' : 'Đang lưu...') : 'Lưu món'}
                    </button>
                  </div>
                </form>

                {itemFormik.values.itemType === 'combo' && ((): JSX.Element => {
                  const singleItems: MenuItem[] = items.filter((i: MenuItem) => i.itemType === 'single')
                  const filtered = singleItems.filter((i: MenuItem) => i.name.toLowerCase().includes(comboItemSearch.toLowerCase()))
                  const allSel = filtered.length > 0 && filtered.every((i: MenuItem) => itemFormik.values.comboItemIds.includes(i.id))
                  const toggleItem = (id: string) => {
                    const current = itemFormik.values.comboItemIds;
                    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
                    itemFormik.setFieldValue('comboItemIds', next);
                  }
                  const toggleAll = () => {
                    itemFormik.setFieldValue('comboItemIds', allSel ? [] : filtered.map((i: MenuItem) => i.id));
                  }
                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fafafa' }}>
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: 'white', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Danh sách món đơn lẻ</span>
                        {itemFormik.values.comboItemIds.length > 0 && <span style={{ background: '#2563eb', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>{itemFormik.values.comboItemIds.length} đã chọn</span>}
                        <div style={{ flex: 1 }} />
                        <div style={{ position: 'relative' }}>
                          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input type="text" value={comboItemSearch} onChange={e => setComboItemSearch(e.target.value)} placeholder="Tìm tên món..."
                            style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 6, paddingBottom: 6, fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#f8fafc', width: 180 }} />
                        </div>
                      </div>
                      <div style={{ overflowY: 'auto', flex: 1 }}>
                        {itemFormik.touched.comboItemIds && itemFormik.errors.comboItemIds && (
                          <div className="bg-red-50 text-red-600 p-3 text-xs font-bold border-b border-red-100 flex items-center gap-2">
                            <AlertCircle size={14} /> {itemFormik.errors.comboItemIds}
                          </div>
                        )}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <th style={{ padding: '10px 16px', width: 36 }}>
                                <button type="button" onClick={toggleAll} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${allSel ? '#2563eb' : '#cbd5e1'}`, background: allSel ? '#2563eb' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {allSel && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </button>
                              </th>
                              {['Tên món', 'Ảnh', 'Danh mục', 'Giá'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 ? (
                              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}><Search size={30} style={{ opacity: 0.3 }} /><span>Không tìm thấy món nào</span></div>
                              </td></tr>
                            ) : filtered.map((si: MenuItem, idx: number) => {
                              const sel = itemFormik.values.comboItemIds.includes(si.id)
                              return (
                                <tr key={si.id} onClick={() => toggleItem(si.id)}
                                  style={{ borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: sel ? '#eff6ff' : idx % 2 === 0 ? 'white' : '#fafafa' }}
                                  onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = '#f1f5f9' }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = sel ? '#eff6ff' : idx % 2 === 0 ? 'white' : '#fafafa' }}
                                >
                                  <td style={{ padding: '10px 16px' }}>
                                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${sel ? '#2563eb' : '#cbd5e1'}`, background: sel ? '#2563eb' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {sel && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                    </div>
                                  </td>
                                  <td style={{ padding: '10px 12px', fontWeight: sel ? 700 : 500, color: sel ? '#1d4ed8' : '#0f172a' }}>{si.name}</td>
                                  <td className="px-4 py-3">
                                    {si.imageUrl ? (
                                      <img src={si.imageUrl} alt={si.name} className="w-10 h-10 object-cover rounded-md" />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-200 border border-gray-300 rounded-md flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">IMG</span>
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: '10px 12px' }}><span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{si.categoryName || '—'}</span></td>
                                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2563eb' }}>{si.price.toLocaleString('vi-VN')}đ</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      {itemFormik.values.comboItemIds.length > 0 && (
                        <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, color: '#64748b' }}>Đã chọn <strong style={{ color: '#2563eb' }}>{itemFormik.values.comboItemIds.length}</strong> / {singleItems.length} món</span>
                          <button type="button" onClick={() => itemFormik.setFieldValue('comboItemIds', [])} style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Bỏ chọn tất cả</button>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {previewCombo && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setPreviewCombo(null)}>
            <div className="card animate-fade-in" style={{ padding: 32, width: 400, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Xem trước Combo</h2>
              {previewCombo.imageUrl && (
                <img src={previewCombo.imageUrl} alt={previewCombo.name} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 16 }} />
              )}
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{previewCombo.name}</h3>
              <p style={{ color: '#2563eb', fontWeight: 600, fontSize: 16, marginBottom: 12 }}>{previewCombo.price.toLocaleString('vi-VN')}đ</p>

              <div style={{ marginTop: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Các món trong combo</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {previewCombo.comboItems?.map(c => (
                    <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, background: '#e2e8f0', borderRadius: 8 }} />
                      )}
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{c.name}</p>
                        <p style={{ fontSize: 12, color: '#64748b' }}>SL: {c.quantity} · {c.price.toLocaleString()}đ</p>
                      </div>
                    </li>
                  ))}
                  {(!previewCombo.comboItems || previewCombo.comboItems.length === 0) && (
                    <p style={{ fontSize: 13, color: '#94a3b8' }}>Combo này chưa thiết lập món con.</p>
                  )}
                </ul>
              </div>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: 24 }}
                onClick={() => setPreviewCombo(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.type === 'item' ? "Xác nhận xóa món" : "Xác nhận xóa danh mục"}
          message={confirmDialog.type === 'item'
            ? "Bạn có chắc chắn muốn xóa món này không? Hành động này không thể hoàn tác."
            : "Bạn có chắc chắn muốn xóa danh mục này? Tất cả món trong danh mục sẽ không có danh mục để hiển thị."}
          type="danger"
          onConfirm={() => {
            if (confirmDialog.itemId) {
              if (confirmDialog.type === 'item') {
                deleteItem.mutate(confirmDialog.itemId)
              } else {
                deleteCategory.mutate(confirmDialog.itemId)
              }
              setConfirmDialog({ isOpen: false, itemId: null, type: 'item' })
            }
          }}
          onCancel={() => setConfirmDialog({ isOpen: false, itemId: null, type: 'item' })}
        />
      </div>
    </AuthLayout>
  )
}
