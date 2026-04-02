'use client'

import { useState, useRef, JSX } from 'react'
import AuthLayout from '@/components/AuthLayout'
import { useMenuCategories, useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/useApi'
import { Plus, Edit2, Trash2, BookOpen, Search, ToggleLeft, ToggleRight, ImagePlus, X, Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

const RESTAURANT_ID = '00000000-0000-0000-0000-000000000001'

interface MenuComboItem { id: string; name: string; price: number; imageUrl?: string; quantity: number }
interface MenuItem { id: string; name: string; price: number; imageUrl?: string; unit: string; isAvailable: boolean; categoryId: string; categoryName: string; description: string; sortOrder: number; itemType: string; comboItems?: MenuComboItem[] }
interface MenuCategory { id: string; name: string; sortOrder: number }

export default function MenuPage() {
  const { data: categories = [] } = useMenuCategories(RESTAURANT_ID)
  const { data: items = [], isLoading } = useMenuItems(RESTAURANT_ID)
  const createItem = useCreateMenuItem()
  const updateItem = useUpdateMenuItem()
  const deleteItem = useDeleteMenuItem()
  const queryClient = useQueryClient()

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showItemForm, setShowItemForm] = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  const [editItem, setEditItem] = useState<MenuItem | null>(null)
  const [catForm, setCatForm] = useState({ name: '', sortOrder: '0' })
  const [previewCombo, setPreviewCombo] = useState<MenuItem | null>(null)
  const [itemForm, setItemForm] = useState<{ name: string; price: string; description: string; unit: string; categoryId: string; sortOrder: string; imageUrl: string; itemType: string; comboItemIds: string[] }>({
    name: '', price: '', description: '', unit: 'phần', categoryId: '', sortOrder: '0', imageUrl: '', itemType: 'single', comboItemIds: []
  })
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageDragOver, setImageDragOver] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [comboItemSearch, setComboItemSearch] = useState('')

  const filteredItems = items.filter((item: MenuItem) => {
    const matchCat = activeCategory === 'all' || item.categoryId === activeCategory
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/menu/categories', { restaurantId: RESTAURANT_ID, ...catForm, sortOrder: parseInt(catForm.sortOrder) })
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
      setShowCatForm(false)
      setCatForm({ name: '', sortOrder: '0' })
    } finally { setSaving(false) }
  }

  const handleImageChange = (file: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Vui lòng chọn file ảnh!'); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let finalImageUrl = itemForm.imageUrl

      // Upload ảnh nếu người dùng có chọn file mới
      if (imageFile) {
        setUploadingImage(true)
        try {
          const formData = new FormData()
          formData.append('file', imageFile)
          const { data } = await api.post('/api/menu/items/upload-image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          finalImageUrl = data.url
        } finally {
          setUploadingImage(false)
        }
      }

      const payload = {
        ...itemForm,
        imageUrl: finalImageUrl,
        price: parseFloat(itemForm.price),
        sortOrder: parseInt(itemForm.sortOrder),
      }
      if (editItem) {
        await updateItem.mutateAsync({ id: editItem.id, ...payload })
      } else {
        await createItem.mutateAsync(payload)
      }
      setShowItemForm(false)
      setEditItem(null)
      setItemForm({ name: '', price: '', description: '', unit: 'phần', categoryId: '', sortOrder: '0', imageUrl: '', itemType: 'single', comboItemIds: [] })
      setImageFile(null)
      setImagePreview('')
    } finally { setSaving(false) }
  }

  const handleEditItem = (item: MenuItem) => {
    setEditItem(item)
    setItemForm({
      name: item.name, price: item.price.toString(), description: item.description,
      unit: item.unit, categoryId: item.categoryId, sortOrder: item.sortOrder.toString(),
      imageUrl: item.imageUrl || '', itemType: item.itemType || 'single', comboItemIds: item.comboItems?.map(c => c.id) || []
    })
    setImageFile(null)
    setImagePreview(item.imageUrl || '')
    setShowItemForm(true)
  }

  const handleToggleAvailable = async (item: MenuItem) => {
    await updateItem.mutateAsync({ id: item.id, isAvailable: !item.isAvailable })
  }

  return (
    <AuthLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={22} color="#2563eb" />
              Quản lý thực đơn
            </h1>
            <p style={{ color: '#64748b', fontSize: 13 }}>{items.length} món · {categories.length} danh mục</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowCatForm(true)} id="add-category-btn">
              <Plus size={15} />
              Thêm danh mục
            </button>
            <button className="btn btn-primary" onClick={() => { setShowItemForm(true); setEditItem(null); setItemForm({ name: '', price: '', description: '', unit: 'phần', categoryId: categories[0]?.id || '', sortOrder: '0', imageUrl: '', itemType: 'single', comboItemIds: [] }) }} id="add-item-btn">
              <Plus size={15} />
              Thêm món
            </button>
          </div>
        </div>

        {/* Category tabs */}
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
          <button className={`btn btn-sm ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveCategory('all')}>
            Tất cả ({items.length})
          </button>
          {categories.map((cat: MenuCategory) => {
            const count = items.filter((i: MenuItem) => i.categoryId === cat.id).length
            return (
              <button key={cat.id} className={`btn btn-sm ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveCategory(cat.id)}>
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Items Table */}
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
                {filteredItems.map((item: MenuItem, idx: number) => (
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
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2563eb', fontSize: 14 }}>
                      {item.price.toLocaleString('vi-VN')}đ
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
                        <button className="btn btn-danger btn-sm" onClick={() => {
                          if (confirm('Xóa món này?')) deleteItem.mutate(item.id)
                        }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                {isLoading ? 'Đang tải...' : 'Không có món nào'}
              </div>
            )}
          </div>
        </div>

        {/* Category Form Modal */}
        {showCatForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div className="card animate-fade-in" style={{ padding: 32, width: 360 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Thêm danh mục</h2>
              <form onSubmit={handleSaveCategory}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Tên danh mục *</label>
                  <input className="input" required value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Món chính" />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Thứ tự</label>
                  <input className="input" type="number" value={catForm.sortOrder} onChange={e => setCatForm(p => ({ ...p, sortOrder: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCatForm(false)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>Lưu</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Item Form Modal */}
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
              {/* ── Header ── */}
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

              {/* ── Body — horizontal split ── */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* ═══ LEFT — Item form ═══ */}
                <form
                  onSubmit={handleSaveItem}
                  style={{
                    width: itemForm.itemType === 'combo' ? '50%' : '100%',
                    flexShrink: 0, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
                    borderRight: itemForm.itemType === 'combo' ? '1px solid #f1f5f9' : 'none',
                    transition: 'width 0.3s ease'
                  }}
                >
                  {[
                    { key: 'name', label: 'Tên món *', type: 'text', required: true, placeholder: 'VD: Phở bò tái' },
                    { key: 'price', label: 'Giá (VNĐ) *', type: 'number', required: true, placeholder: '85000' },
                    { key: 'description', label: 'Mô tả', type: 'text', required: false, placeholder: 'Mô tả ngắn về món' },
                    { key: 'unit', label: 'Đơn vị', type: 'text', required: false, placeholder: 'phần, ly, đĩa...' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>{f.label}</label>
                      <input
                        className="input" type={f.type} required={f.required} placeholder={f.placeholder}
                        value={itemForm[f.key as keyof typeof itemForm] as string}
                        onChange={e => setItemForm(p => ({ ...p, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}

                  {/* ── Upload ảnh ── */}
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
                          <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setItemForm(p => ({ ...p, imageUrl: '' })) }} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
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

                  {/* Danh mục */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Danh mục *</label>
                    <select className="input" required value={itemForm.categoryId} onChange={e => setItemForm(p => ({ ...p, categoryId: e.target.value }))}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((cat: MenuCategory) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                    </select>
                  </div>

                  {/* Phân loại */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5, color: '#374151' }}>Phân loại món *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[{ value: 'single', label: 'Món đơn lẻ', desc: 'Món ăn riêng lẻ' }, { value: 'combo', label: 'Món tổng hợp', desc: 'Combo nhiều món' }].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => { setItemForm(p => ({ ...p, itemType: opt.value, comboItemIds: opt.value === 'single' ? [] : p.comboItemIds })); setComboItemSearch('') }}
                          style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: `2px solid ${itemForm.itemType === opt.value ? '#2563eb' : '#e2e8f0'}`, background: itemForm.itemType === opt.value ? '#eff6ff' : '#f8fafc', transition: 'all 0.15s' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: itemForm.itemType === opt.value ? '#1d4ed8' : '#374151', margin: 0 }}>{opt.label}</p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1 }} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowItemForm(false); setEditItem(null); setImageFile(null); setImagePreview('') }}>Hủy</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving || uploadingImage} id="save-item-btn">
                      {saving ? (uploadingImage ? 'Đang tải ảnh...' : 'Đang lưu...') : 'Lưu món'}
                    </button>
                  </div>
                </form>

                {/* RIGHT — Single items table (chỉ hiện khi combo) */}
                {itemForm.itemType === 'combo' && ((): JSX.Element => {
                  const singleItems: MenuItem[] = items.filter((i: MenuItem) => i.itemType === 'single')
                  const filtered = singleItems.filter((i: MenuItem) => i.name.toLowerCase().includes(comboItemSearch.toLowerCase()))
                  const allSel = filtered.length > 0 && filtered.every((i: MenuItem) => itemForm.comboItemIds.includes(i.id))
                  const toggleItem = (id: string) => setItemForm(p => ({ ...p, comboItemIds: p.comboItemIds.includes(id) ? p.comboItemIds.filter(x => x !== id) : [...p.comboItemIds, id] }))
                  const toggleAll = () => setItemForm(p => ({ ...p, comboItemIds: allSel ? [] : filtered.map((i: MenuItem) => i.id) }))
                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fafafa' }}>
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: 'white', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Danh sách món đơn lẻ</span>
                        {itemForm.comboItemIds.length > 0 && <span style={{ background: '#2563eb', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>{itemForm.comboItemIds.length} đã chọn</span>}
                        <div style={{ flex: 1 }} />
                        <div style={{ position: 'relative' }}>
                          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                          <input type="text" value={comboItemSearch} onChange={e => setComboItemSearch(e.target.value)} placeholder="Tìm tên món..."
                            style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 6, paddingBottom: 6, fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#f8fafc', width: 180 }} />
                        </div>
                      </div>
                      <div style={{ overflowY: 'auto', flex: 1 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <th style={{ padding: '10px 16px', width: 36 }}>
                                <button type="button" onClick={toggleAll} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${allSel ? '#2563eb' : '#cbd5e1'}`, background: allSel ? '#2563eb' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {allSel && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                </button>
                              </th>
                              {['Tên món', 'Danh mục', 'Giá'].map(h => <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.length === 0 ? (
                              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}><Search size={30} style={{ opacity: 0.3 }} /><span>Không tìm thấy món nào</span></div>
                              </td></tr>
                            ) : filtered.map((si: MenuItem, idx: number) => {
                              const sel = itemForm.comboItemIds.includes(si.id)
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
                                  <td style={{ padding: '10px 12px' }}><span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{si.categoryName || '—'}</span></td>
                                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2563eb' }}>{si.price.toLocaleString('vi-VN')}đ</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                      {itemForm.comboItemIds.length > 0 && (
                        <div style={{ padding: '10px 20px', borderTop: '1px solid #f1f5f9', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                          <span style={{ fontSize: 13, color: '#64748b' }}>Đã chọn <strong style={{ color: '#2563eb' }}>{itemForm.comboItemIds.length}</strong> / {singleItems.length} món</span>
                          <button type="button" onClick={() => setItemForm(p => ({ ...p, comboItemIds: [] }))} style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Bỏ chọn tất cả</button>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
        {/* Preview Modal */}
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
      </div>
    </AuthLayout>
  )
}
