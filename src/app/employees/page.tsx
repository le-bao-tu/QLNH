'use client'

import { useState, useEffect, useMemo } from 'react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ChevronLeft, ChevronRight, Copy, LayoutGrid, CalendarDays, Pencil, Trash2, Plus, Clock, Shuffle, AlertCircle, X } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
type PageTab      = 'employees' | 'schedule' | 'templates'
type ShiftType    = 'fixed' | 'flexible'
type AssignMode   = 'day' | 'week' | 'month' | 'custom'
type CalView      = 'week' | 'month'

interface Employee {
  id: string; branchId: string; fullName: string
  phone?: string; email?: string; role: string
  hourlyRate: number; hiredAt?: string; createdAt: string
}
interface ShiftTemplate {
  id: string; name: string; type: ShiftType
  startTime?: string; endTime?: string; minHours?: number; color: string
}
interface ShiftAssignment {
  id: string; employeeId: string; employeeName: string
  templateId: string; templateName: string; templateColor: string
  date: string; startTime?: string; endTime?: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const ROLE_CFG: Record<string, { label: string; badge: string }> = {
  owner:     { label: 'Chủ nhà hàng', badge: 'bg-purple-100 text-purple-700' },
  manager:   { label: 'Quản lý',      badge: 'bg-blue-100 text-blue-700' },
  cashier:   { label: 'Thu ngân',     badge: 'bg-green-100 text-green-700' },
  waiter:    { label: 'Phục vụ',      badge: 'bg-yellow-100 text-yellow-700' },
  chef:      { label: 'Bếp trưởng',   badge: 'bg-orange-100 text-orange-700' },
  bartender: { label: 'Bartender',    badge: 'bg-pink-100 text-pink-700' },
}

const DEFAULT_TEMPLATES: ShiftTemplate[] = [
  { id: 't1', name: 'Ca sáng',     type: 'fixed',    startTime: '06:00', endTime: '14:00', color: '#3b82f6' },
  { id: 't2', name: 'Ca chiều',    type: 'fixed',    startTime: '14:00', endTime: '22:00', color: '#f59e0b' },
  { id: 't3', name: 'Ca tối',      type: 'fixed',    startTime: '22:00', endTime: '06:00', color: '#8b5cf6' },
  { id: 't4', name: 'Ca linh hoạt',type: 'flexible', minHours: 4,                          color: '#10b981' },
]

const COLOR_PALETTE = [
  '#3b82f6','#f59e0b','#8b5cf6','#10b981','#ef4444',
  '#f97316','#06b6d4','#ec4899','#14b8a6','#6366f1',
]

const WD_LABELS   = ['T2','T3','T4','T5','T6','T7','CN']
const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
const fmtDate = (d: Date) => d.toISOString().split('T')[0]
const genId   = () => Math.random().toString(36).slice(2, 9)

function shiftDate(date: Date | string, n: number): Date {
  const d = new Date(date instanceof Date ? date.getTime() : date)
  d.setDate(d.getDate() + n)
  return d
}
function shiftDateStr(s: string, n: number) { return fmtDate(shiftDate(s, n)) }

function weekStart(date: Date): Date {
  const d = new Date(date); d.setHours(0,0,0,0)
  const dow = d.getDay(); d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return d
}
function monthStart(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), 1) }
function daysInMonth(date: Date): number { return new Date(date.getFullYear(), date.getMonth()+1, 0).getDate() }

function datesForMode(startDate: string, mode: AssignMode, customEnd: string): string[] {
  if (mode === 'day') return [startDate]
  if (mode === 'week') {
    const ws = fmtDate(weekStart(new Date(startDate)))
    return Array.from({length:7},(_,i)=>shiftDateStr(ws,i))
  }
  if (mode === 'month') {
    const d  = new Date(startDate)
    const n  = daysInMonth(d)
    const m1 = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
    return Array.from({length:n},(_,i)=>shiftDateStr(m1,i))
  }
  if (mode === 'custom' && customEnd >= startDate) {
    const out: string[] = []
    const cur = new Date(startDate), end = new Date(customEnd)
    while (cur <= end) { out.push(fmtDate(cur)); cur.setDate(cur.getDate()+1) }
    return out
  }
  return [startDate]
}

function shiftDuration(t: ShiftTemplate): string {
  if (t.type !== 'fixed' || !t.startTime || !t.endTime) return ''
  const [sh,sm] = t.startTime.split(':').map(Number)
  const [eh,em] = t.endTime.split(':').map(Number)
  let mins = (eh*60+em) - (sh*60+sm); if (mins <= 0) mins += 1440
  return `${Math.floor(mins/60)}h${mins%60 ? `${mins%60}m` : ''}`
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK SEED ASSIGNMENTS
// ═══════════════════════════════════════════════════════════════════════════════
const today = new Date()
const SEED_ASSIGNMENTS: ShiftAssignment[] = [
  { id: genId(), employeeId:'m1', employeeName:'Nguyễn Văn A', templateId:'t1', templateName:'Ca sáng',  templateColor:'#3b82f6', date: fmtDate(today) },
  { id: genId(), employeeId:'m2', employeeName:'Trần Thị B',   templateId:'t2', templateName:'Ca chiều', templateColor:'#f59e0b', date: fmtDate(today) },
  { id: genId(), employeeId:'m3', employeeName:'Lê Minh C',    templateId:'t3', templateName:'Ca tối',   templateColor:'#8b5cf6', date: fmtDate(shiftDate(today,1)) },
  { id: genId(), employeeId:'m4', employeeName:'Phạm Thu D',   templateId:'t1', templateName:'Ca sáng',  templateColor:'#3b82f6', date: fmtDate(shiftDate(today,1)) },
  { id: genId(), employeeId:'m1', employeeName:'Nguyễn Văn A', templateId:'t4', templateName:'Ca linh hoạt', templateColor:'#10b981', date: fmtDate(shiftDate(today,3)) },
]

const MOCK_EMPLOYEES: Employee[] = [
  { id:'m1', branchId:'b1', fullName:'Nguyễn Văn A', role:'waiter',    hourlyRate:30000, createdAt:'' },
  { id:'m2', branchId:'b1', fullName:'Trần Thị B',   role:'cashier',   hourlyRate:35000, createdAt:'' },
  { id:'m3', branchId:'b1', fullName:'Lê Minh C',    role:'chef',      hourlyRate:50000, createdAt:'' },
  { id:'m4', branchId:'b1', fullName:'Phạm Thu D',   role:'bartender', hourlyRate:40000, createdAt:'' },
  { id:'m5', branchId:'b1', fullName:'Hoàng Văn E',  role:'waiter',    hourlyRate:30000, createdAt:'' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmployeesPage() {
  const { user } = useAuth()
  const branchId = user?.branchId || ''

  const [tab, setTab]               = useState<PageTab>('employees')
  const [employees, setEmployees]   = useState<Employee[]>([])
  const [loadingEmps, setLoadingEmps] = useState(true)
  const [showAddEmp, setShowAddEmp] = useState(false)
  const [empForm, setEmpForm]       = useState({ fullName:'', phone:'', email:'', role:'waiter', hourlyRate:0 })

  const [calView, setCalView]       = useState<CalView>('week')
  const [cursor, setCursor]         = useState(new Date())
  const [assignments, setAssignments] = useState<ShiftAssignment[]>(SEED_ASSIGNMENTS)
  const [assignModal, setAssignModal] = useState<{open:boolean; date:string}>({ open:false, date:'' })

  const [templates, setTemplates]   = useState<ShiftTemplate[]>(DEFAULT_TEMPLATES)
  const [tplModal, setTplModal]     = useState<{open:boolean; editing:ShiftTemplate|null}>({ open:false, editing:null })

  // Load employees from API
  useEffect(() => {
    if (!branchId) return
    api.get(`/api/employees/branch/${branchId}`)
      .then(r => setEmployees(r.data))
      .catch(() => setEmployees(MOCK_EMPLOYEES))
      .finally(() => setLoadingEmps(false))
  }, [branchId])

  const createEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchId) return
    try { await api.post('/api/employees', { branchId: branchId, ...empForm }) } catch {}
    setShowAddEmp(false)
    setEmpForm({ fullName:'', phone:'', email:'', role:'waiter', hourlyRate:0 })
    api.get(`/api/employees/branch/${branchId}`).then(r => setEmployees(r.data)).catch(()=>{})
  }

  const displayEmployees = useMemo(() =>
    employees.length > 0 ? employees : MOCK_EMPLOYEES, [employees])

  // ─── Calendar navigation ───────────────────────────────────────────────────
  const navigate = (dir: -1|1) => setCursor(prev =>
    calView === 'week'
      ? shiftDate(prev, dir * 7)
      : new Date(prev.getFullYear(), prev.getMonth() + dir, 1)
  )

  const ws   = weekStart(cursor)
  const wDays = Array.from({length:7}, (_,i) => shiftDate(ws, i))
  const mStart = monthStart(cursor)
  const mDays  = daysInMonth(cursor)
  const firstWD = mStart.getDay() === 0 ? 6 : mStart.getDay() - 1
  const totalCells = Math.ceil((firstWD + mDays) / 7) * 7
  const todayStr = fmtDate(new Date())
  const calTitle = calView === 'week'
    ? `${fmtDate(wDays[0])} – ${fmtDate(wDays[6])}`
    : `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`

  const copyWeek = () => {
    const thisDates = wDays.map(d => fmtDate(d))
    const nextDates = wDays.map(d => fmtDate(shiftDate(d, 7)))
    const toAdd: ShiftAssignment[] = []
    assignments.filter(a => thisDates.includes(a.date)).forEach(a => {
      const nd = nextDates[thisDates.indexOf(a.date)]
      if (!assignments.some(x => x.date === nd && x.employeeId === a.employeeId))
        toAdd.push({...a, id: genId(), date: nd})
    })
    setAssignments(p => [...p, ...toAdd])
  }

  const removeAssignment = (id: string) => setAssignments(p => p.filter(a => a.id !== id))

  const handleSaveAssign = (list: ShiftAssignment[]) => {
    setAssignments(prev => {
      const toAdd = list.filter(na => !prev.some(p => p.date===na.date && p.employeeId===na.employeeId && p.templateId===na.templateId))
      return [...prev, ...toAdd]
    })
    setAssignModal({ open:false, date:'' })
  }

  // ─── Template CRUD ─────────────────────────────────────────────────────────
  const openAddTpl = () => setTplModal({ open:true, editing:null })
  const openEditTpl = (t: ShiftTemplate) => setTplModal({ open:true, editing:t })
  const deleteTpl = (id: string) => { if(confirm('Xóa mẫu ca này?')) setTemplates(p => p.filter(t => t.id !== id)) }
  const saveTpl = (t: ShiftTemplate) => {
    if (tplModal.editing) setTemplates(p => p.map(x => x.id === t.id ? t : x))
    else setTemplates(p => [...p, t])
    setTplModal({ open:false, editing:null })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <AuthLayout>
      <div className="p-6 max-w-full">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nhân viên</h1>
            <p className="text-gray-500 text-sm mt-1">Quản lý nhân viên & phân công ca làm việc</p>
          </div>
          {tab === 'employees' && (
            <button onClick={() => setShowAddEmp(true)} className="emp-btn-primary">
              <Plus size={16}/> Thêm nhân viên
            </button>
          )}
          {tab === 'templates' && (
            <button onClick={openAddTpl} className="emp-btn-primary">
              <Plus size={16}/> Thêm mẫu ca
            </button>
          )}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {([
            { key:'employees', label:'👥 Nhân viên' },
            { key:'schedule',  label:'📅 Lịch phân công' },
            { key:'templates', label:'🕐 Mẫu ca làm việc' },
          ] as {key:PageTab;label:string}[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === t.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB: EMPLOYEES
            ════════════════════════════════════════════════════════════════════ */}
        {tab === 'employees' && (
          loadingEmps ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayEmployees.map(emp => {
                const cfg = ROLE_CFG[emp.role] || { label: emp.role, badge: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={emp.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                        {emp.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{emp.fullName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      {emp.phone && <div className="flex gap-2"><span>📱</span>{emp.phone}</div>}
                      {emp.email && <div className="flex gap-2"><span>✉️</span><span className="truncate">{emp.email}</span></div>}
                      <div className="flex gap-2"><span>💰</span>{emp.hourlyRate.toLocaleString()}đ/giờ</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: SCHEDULE (Calendar)
            ════════════════════════════════════════════════════════════════════ */}
        {tab === 'schedule' && (
          <div className="cal-wrapper">

            {/* Toolbar */}
            <div className="cal-toolbar">
              <div className="cal-toolbar-left">
                <button onClick={() => setCursor(new Date())} className="cal-btn-today">Hôm nay</button>
                <div className="cal-nav">
                  <button onClick={() => navigate(-1)} className="cal-nav-btn" aria-label="Trước"><ChevronLeft size={16}/></button>
                  <button onClick={() => navigate(1)}  className="cal-nav-btn" aria-label="Sau"><ChevronRight size={16}/></button>
                </div>
                <h2 className="cal-title">{calTitle}</h2>
              </div>
              <div className="cal-toolbar-right">
                {calView === 'week' && (
                  <button onClick={copyWeek} className="cal-btn-copy" title="Sao chép toàn bộ ca tuần này sang tuần sau">
                    <Copy size={13}/> Sao chép tuần
                  </button>
                )}
                <div className="cal-view-switcher">
                  <button onClick={() => setCalView('week')} className={`cal-view-btn ${calView==='week'?'active':''}`}>
                    <CalendarDays size={14}/> Tuần
                  </button>
                  <button onClick={() => setCalView('month')} className={`cal-view-btn ${calView==='month'?'active':''}`}>
                    <LayoutGrid size={14}/> Tháng
                  </button>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="cal-legend">
              {templates.map(t => (
                <div key={t.id} className="cal-legend-item">
                  <span className="cal-legend-dot" style={{background:t.color}}/>
                  <span className="cal-legend-name">{t.name}</span>
                  <span className="cal-legend-time">
                    {t.type==='fixed' ? `${t.startTime}–${t.endTime}` : `≥${t.minHours}h`}
                  </span>
                </div>
              ))}
            </div>

            {/* ── WEEK VIEW ─────────────────────────────────────────────────── */}
            {calView === 'week' && (
              <div className="cal-week">
                {/* Day headers */}
                <div className="cal-week-head">
                  {wDays.map((day, i) => {
                    const isToday = fmtDate(day) === todayStr
                    return (
                      <div key={i} className={`cal-week-head-cell${isToday?' cal-today-head':''}`}>
                        <span className="cal-wd-label">{WD_LABELS[i]}</span>
                        <span className={`cal-day-num${isToday?' cal-today-circle':''}`}>{day.getDate()}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Day body cells */}
                <div className="cal-week-body">
                  {wDays.map((day, i) => {
                    const ds = fmtDate(day)
                    const dayAssigns = assignments.filter(a => a.date === ds)
                    const isToday = ds === todayStr
                    return (
                      <div key={i}
                        className={`cal-week-cell${isToday?' cal-today-cell':''}`}
                        onClick={() => setAssignModal({open:true, date:ds})}>

                        {/* Events */}
                        {dayAssigns.map(a => (
                          <div key={a.id} className="cal-event"
                            style={{borderLeftColor: a.templateColor, background: a.templateColor+'18'}}
                            onClick={e => e.stopPropagation()}>
                            <div className="cal-event-body">
                              <span className="cal-event-emp">{a.employeeName.split(' ').pop()}</span>
                              <span className="cal-event-shift" style={{color:a.templateColor}}>{a.templateName}</span>
                            </div>
                            <button className="cal-event-del"
                              onClick={e => { e.stopPropagation(); removeAssignment(a.id) }}
                              title="Xóa">×</button>
                          </div>
                        ))}

                        {/* Add hint */}
                        <div className="cal-add-hint">
                          <span className="cal-add-plus">+</span>
                          <span className="cal-add-label">Phân công</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── MONTH VIEW ────────────────────────────────────────────────── */}
            {calView === 'month' && (
              <div className="cal-month">
                {/* Column headers */}
                {WD_LABELS.map(d => (
                  <div key={d} className="cal-month-head">{d}</div>
                ))}

                {/* Date cells */}
                {Array.from({length: totalCells}, (_, i) => {
                  const date    = shiftDate(mStart, i - firstWD)
                  const ds      = fmtDate(date)
                  const inMonth = date.getMonth() === cursor.getMonth()
                  const isToday = ds === todayStr
                  const dayA    = assignments.filter(a => a.date === ds)
                  return (
                    <div key={i}
                      className={`cal-month-cell${!inMonth?' cal-other-month':''}${isToday?' cal-today-cell':''}`}
                      onClick={() => inMonth && setAssignModal({open:true, date:ds})}>

                      <span className={`cal-month-num${isToday?' cal-today-circle':''}`}>
                        {date.getDate()}
                      </span>

                      <div className="cal-month-events">
                        {dayA.slice(0,3).map(a => (
                          <div key={a.id} className="cal-month-event"
                            style={{background: a.templateColor+'22', borderLeft:`3px solid ${a.templateColor}`}}
                            onClick={e => e.stopPropagation()}>
                            <span style={{color:a.templateColor, fontWeight:700, fontSize:10}}>
                              {a.employeeName.split(' ').pop()}
                            </span>
                            <span style={{color:'#64748b', fontSize:10}}> · {a.templateName}</span>
                          </div>
                        ))}
                        {dayA.length > 3 && (
                          <div className="cal-month-more">+{dayA.length-3} khác</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: TEMPLATES
            ════════════════════════════════════════════════════════════════════ */}
        {tab === 'templates' && (
          <div className="tpl-section">
            {/* Stats row */}
            <div className="tpl-stats">
              <div className="tpl-stat-card">
                <span className="tpl-stat-num">{templates.filter(t=>t.type==='fixed').length}</span>
                <span className="tpl-stat-lbl">Ca cố định</span>
              </div>
              <div className="tpl-stat-card">
                <span className="tpl-stat-num">{templates.filter(t=>t.type==='flexible').length}</span>
                <span className="tpl-stat-lbl">Ca linh hoạt</span>
              </div>
              <div className="tpl-stat-card">
                <span className="tpl-stat-num">{templates.length}</span>
                <span className="tpl-stat-lbl">Tổng mẫu ca</span>
              </div>
            </div>

            {/* Template table */}
            <div className="tpl-table-wrap">
              <table className="tpl-table">
                <thead>
                  <tr className="tpl-thead-row">
                    <th className="tpl-th" style={{width:36}}></th>
                    <th className="tpl-th text-left">Tên ca</th>
                    <th className="tpl-th text-left">Loại</th>
                    <th className="tpl-th text-left">Thời gian</th>
                    <th className="tpl-th text-left">Thời lượng</th>
                    <th className="tpl-th text-left">Màu</th>
                    <th className="tpl-th" style={{width:96}}></th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map(t => (
                    <tr key={t.id} className="tpl-row">
                      <td className="tpl-td">
                        <div className="tpl-row-icon" style={{background:t.color+'20', color:t.color}}>
                          {t.type==='fixed' ? <Clock size={16}/> : <Shuffle size={16}/>}
                        </div>
                      </td>
                      <td className="tpl-td">
                        <span className="tpl-name">{t.name}</span>
                      </td>
                      <td className="tpl-td">
                        <span className="tpl-type-badge" style={{background:t.color+'15', color:t.color}}>
                          {t.type==='fixed' ? '📌 Cố định' : '🔄 Linh hoạt'}
                        </span>
                      </td>
                      <td className="tpl-td tpl-time">
                        {t.type==='fixed'
                          ? <><span className="tpl-time-pill">{t.startTime}</span><span className="tpl-time-sep">→</span><span className="tpl-time-pill">{t.endTime}</span></>
                          : <span className="tpl-time-pill">Tối thiểu {t.minHours}h/ngày</span>
                        }
                      </td>
                      <td className="tpl-td">
                        <span className="tpl-duration">{t.type==='fixed' ? shiftDuration(t) : '—'}</span>
                      </td>
                      <td className="tpl-td">
                        <div className="tpl-color-preview" style={{background:t.color}} title={t.color}/>
                      </td>
                      <td className="tpl-td">
                        <div className="tpl-actions">
                          <button onClick={() => openEditTpl(t)} className="tpl-act-btn tpl-act-edit" title="Sửa"><Pencil size={13}/></button>
                          <button onClick={() => deleteTpl(t.id)} className="tpl-act-btn tpl-act-del" title="Xóa"><Trash2 size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {templates.length === 0 && (
                    <tr><td colSpan={7} className="tpl-empty">Chưa có mẫu ca nào. Nhấn "Thêm mẫu ca" để bắt đầu.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: ADD EMPLOYEE
          ════════════════════════════════════════════════════════════════════════ */}
      {showAddEmp && (
        <div className="modal-backdrop" onClick={() => setShowAddEmp(false)}>
          <div className="modal-box" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Thêm nhân viên</h2>
                <p className="modal-sub">Điền thông tin nhân viên mới</p>
              </div>
              <button onClick={() => setShowAddEmp(false)} className="modal-close"><X size={18}/></button>
            </div>
            <form onSubmit={createEmployee}>
              <div className="modal-body">
                <div className="form-field">
                  <label className="form-label">Họ tên <span className="form-req">*</span></label>
                  <input required value={empForm.fullName} onChange={e=>setEmpForm({...empForm,fullName:e.target.value})}
                    className="form-input" placeholder="Nguyễn Văn A"/>
                </div>
                <div className="form-row-2">
                  <div className="form-field">
                    <label className="form-label">Điện thoại</label>
                    <input value={empForm.phone} onChange={e=>setEmpForm({...empForm,phone:e.target.value})}
                      className="form-input" placeholder="0900 000 000"/>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Vai trò</label>
                    <select value={empForm.role} onChange={e=>setEmpForm({...empForm,role:e.target.value})} className="form-input">
                      {Object.entries(ROLE_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input type="email" value={empForm.email} onChange={e=>setEmpForm({...empForm,email:e.target.value})}
                    className="form-input" placeholder="email@example.com"/>
                </div>
                <div className="form-field">
                  <label className="form-label">Lương giờ (đ)</label>
                  <input type="number" min={0} value={empForm.hourlyRate} onChange={e=>setEmpForm({...empForm,hourlyRate:+e.target.value})}
                    className="form-input"/>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={()=>setShowAddEmp(false)} className="modal-btn-cancel">Hủy</button>
                <button type="submit" className="modal-btn-save">✓ Thêm nhân viên</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: ASSIGN SHIFT
          ════════════════════════════════════════════════════════════════════════ */}
      {assignModal.open && (
        <AssignModal
          date={assignModal.date}
          employees={displayEmployees}
          templates={templates}
          existing={assignments}
          onSave={handleSaveAssign}
          onClose={() => setAssignModal({open:false,date:''})}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: TEMPLATE FORM
          ════════════════════════════════════════════════════════════════════════ */}
      {tplModal.open && (
        <TemplateModal
          editing={tplModal.editing}
          onSave={saveTpl}
          onClose={() => setTplModal({open:false,editing:null})}
        />
      )}

    </AuthLayout>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSIGN SHIFT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function AssignModal({ date, employees, templates, existing, onSave, onClose }: {
  date: string
  employees: Employee[]
  templates: ShiftTemplate[]
  existing: ShiftAssignment[]
  onSave: (a: ShiftAssignment[]) => void
  onClose: () => void
}) {
  const [selEmps, setSelEmps]     = useState<string[]>([])
  const [selTpl, setSelTpl]       = useState(templates[0]?.id ?? '')
  const [mode, setMode]           = useState<AssignMode>('day')
  const [customEnd, setCustomEnd] = useState(date)
  const [flexIn, setFlexIn]       = useState('08:00')
  const [flexOut, setFlexOut]     = useState('16:00')
  const [errors, setErrors]       = useState<string[]>([])

  const tpl        = templates.find(t => t.id === selTpl)
  const isFlexible = tpl?.type === 'flexible'
  const targetDates = useMemo(() => datesForMode(date, mode, customEnd), [date, mode, customEnd])

  const toggleEmp = (id: string) =>
    setSelEmps(p => p.includes(id) ? p.filter(e=>e!==id) : [...p,id])

  const conflicts = useMemo(() => {
    const out: string[] = []
    selEmps.forEach(eid => {
      const emp = employees.find(e=>e.id===eid)
      targetDates.forEach(d => {
        if (existing.some(a=>a.employeeId===eid && a.date===d))
          out.push(`${emp?.fullName} đã có ca ngày ${d}`)
      })
    })
    return out
  }, [selEmps, targetDates, existing, employees])

  const restWarnings = useMemo(() => {
    if (isFlexible || !tpl?.startTime) return []
    const out: string[] = []
    selEmps.forEach(eid => {
      const emp = employees.find(e=>e.id===eid)
      const prev = shiftDateStr(date, -1)
      const pa = existing.find(a=>a.employeeId===eid && a.date===prev)
      if (pa) {
        const pt = templates.find(t=>t.id===pa.templateId)
        if (pt?.endTime && tpl.startTime) {
          const gap = (new Date(`${date}T${tpl.startTime}`).getTime() - new Date(`${prev}T${pt.endTime}`).getTime()) / 3600000
          if (gap < 8) out.push(`${emp?.fullName}: nghỉ ${gap.toFixed(1)}h (cần ≥ 8h)`)
        }
      }
    })
    return out
  }, [selEmps, date, tpl, isFlexible, existing, templates, employees])

  const save = () => {
    const errs: string[] = []
    if (!selEmps.length)                    errs.push('Chọn ít nhất một nhân viên')
    if (!selTpl)                            errs.push('Chọn mẫu ca')
    if (mode==='custom' && customEnd<date)  errs.push('Ngày kết thúc phải sau ngày bắt đầu')
    if (errs.length) { setErrors(errs); return }
    const t = templates.find(x=>x.id===selTpl)!
    const list: ShiftAssignment[] = []
    selEmps.forEach(eid => {
      const emp = employees.find(e=>e.id===eid)!
      targetDates.forEach(d => list.push({
        id: genId(), employeeId:eid, employeeName:emp.fullName,
        templateId:t.id, templateName:t.name, templateColor:t.color, date:d,
        ...(isFlexible ? {startTime:flexIn, endTime:flexOut} : {}),
      }))
    })
    onSave(list)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box modal-lg" onClick={e=>e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <h2 className="modal-title">Phân công ca làm việc</h2>
            <p className="modal-sub">📅 Từ ngày <strong>{date}</strong></p>
          </div>
          <button onClick={onClose} className="modal-close"><X size={20}/></button>
        </div>

        <div className="modal-body">
          {errors.length > 0 && (
            <div className="form-error-box">{errors.map((e,i) => <div key={i}>⚠ {e}</div>)}</div>
          )}

          {/* Employee select */}
          <div className="form-field">
            <div className="form-label-row">
              <label className="form-label">👥 Nhân viên <span className="form-req">*</span></label>
              <div className="form-label-actions">
                <button onClick={()=>setSelEmps(employees.map(e=>e.id))} className="form-link">Chọn tất cả</button>
                <span>·</span>
                <button onClick={()=>setSelEmps([])} className="form-link">Bỏ chọn</button>
              </div>
            </div>
            <div className="emp-chip-grid">
              {employees.map(emp => {
                const sel = selEmps.includes(emp.id)
                return (
                  <label key={emp.id} className={`emp-chip${sel?' sel':''}`}>
                    <input type="checkbox" checked={sel} onChange={()=>toggleEmp(emp.id)} className="sr-only"/>
                    <span className="emp-chip-av" style={{background: sel ? '#2563eb' : '#cbd5e1'}}>{emp.fullName.charAt(0)}</span>
                    <span className="emp-chip-name">{emp.fullName.split(' ').reverse().slice(0,2).reverse().join(' ')}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Template select */}
          <div className="form-field">
            <label className="form-label">🕐 Mẫu ca <span className="form-req">*</span></label>
            <div className="tpl-pick-grid">
              {templates.map(t => {
                const sel = selTpl === t.id
                return (
                  <button key={t.id} onClick={()=>setSelTpl(t.id)}
                    className={`tpl-pick-btn${sel?' sel':''}`}
                    style={{borderColor: sel ? t.color : '#e2e8f0', background: sel ? t.color+'12' : 'white'}}>
                    <span className="tpl-pick-dot" style={{background:t.color}}/>
                    <div style={{flex:1,textAlign:'left'}}>
                      <div className="tpl-pick-name">{t.name}</div>
                      <div className="tpl-pick-time">
                        {t.type==='fixed' ? `${t.startTime} – ${t.endTime}` : `Linh hoạt · ≥${t.minHours}h`}
                      </div>
                    </div>
                    {sel && <span style={{color:t.color,fontWeight:700}}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Flexible hours override */}
          {isFlexible && (
            <div className="form-field">
              <label className="form-label">⏰ Giờ vào / Giờ ra</label>
              <div className="form-time-row">
                <div><label className="form-sublabel">Giờ vào</label><input type="time" value={flexIn} onChange={e=>setFlexIn(e.target.value)} className="form-input"/></div>
                <span className="form-arrow">→</span>
                <div><label className="form-sublabel">Giờ ra</label><input type="time" value={flexOut} onChange={e=>setFlexOut(e.target.value)} className="form-input"/></div>
              </div>
            </div>
          )}

          {/* Mode */}
          <div className="form-field">
            <label className="form-label">📆 Áp dụng cho</label>
            <div className="mode-tabs">
              {(['day','week','month','custom'] as const).map(m => (
                <button key={m} onClick={()=>setMode(m)}
                  className={`mode-tab${mode===m?' active':''}`}>
                  {m==='day'?'Một ngày':m==='week'?'Cả tuần':m==='month'?'Cả tháng':'Tùy chỉnh'}
                </button>
              ))}
            </div>
            {mode === 'custom' && (
              <div className="form-time-row" style={{marginTop:10}}>
                <div><label className="form-sublabel">Từ ngày</label><input type="date" value={date} readOnly className="form-input form-input-ro"/></div>
                <span className="form-arrow">→</span>
                <div><label className="form-sublabel">Đến ngày</label><input type="date" value={customEnd} min={date} onChange={e=>setCustomEnd(e.target.value)} className="form-input"/></div>
              </div>
            )}
            {targetDates.length > 1 && (
              <div className="form-preview">
                Sẽ phân công cho <strong>{targetDates.length} ngày</strong>
                {` (${targetDates[0]} → ${targetDates[targetDates.length-1]})`}
              </div>
            )}
          </div>

          {/* Warnings */}
          {restWarnings.length > 0 && (
            <div className="form-warn-box">
              <AlertCircle size={15} style={{flexShrink:0,marginTop:1}}/>
              <div>
                <div style={{fontWeight:600,marginBottom:2}}>Cảnh báo: Thời gian nghỉ không đủ</div>
                {restWarnings.map((w,i) => <div key={i} style={{fontSize:12}}>{w}</div>)}
              </div>
            </div>
          )}

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <div className="form-conflict-box">
              <div style={{fontWeight:600,marginBottom:4}}>⚠ Xung đột lịch (sẽ bỏ qua khi lưu):</div>
              {conflicts.slice(0,4).map((c,i) => <div key={i} style={{fontSize:12,marginTop:2}}>{c}</div>)}
              {conflicts.length>4 && <div style={{fontSize:12,marginTop:2}}>... và {conflicts.length-4} xung đột khác</div>}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn-cancel">Hủy</button>
          <button onClick={save} className="modal-btn-save">
            ✓ Lưu phân công
            {selEmps.length>0 && targetDates.length>0 && (
              <span className="modal-btn-badge">{selEmps.length * targetDates.length} ca</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE FORM MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function TemplateModal({ editing, onSave, onClose }: {
  editing: ShiftTemplate | null
  onSave: (t: ShiftTemplate) => void
  onClose: () => void
}) {
  const [name, setName]           = useState(editing?.name ?? '')
  const [type, setType]           = useState<ShiftType>(editing?.type ?? 'fixed')
  const [startTime, setStartTime] = useState(editing?.startTime ?? '06:00')
  const [endTime, setEndTime]     = useState(editing?.endTime ?? '14:00')
  const [minHours, setMinHours]   = useState(editing?.minHours ?? 4)
  const [color, setColor]         = useState(editing?.color ?? COLOR_PALETTE[0])
  const [errors, setErrors]       = useState<Record<string,string>>({})

  const save = () => {
    const errs: Record<string,string> = {}
    if (!name.trim()) errs.name = 'Vui lòng nhập tên ca'
    if (type==='flexible' && (minHours<1||minHours>24)) errs.minHours = 'Từ 1–24 giờ'
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSave({
      id: editing?.id ?? genId(), name: name.trim(), type, color,
      ...(type==='fixed'    ? {startTime, endTime}  : {}),
      ...(type==='flexible' ? {minHours}             : {}),
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{editing ? '✏️ Sửa mẫu ca' : '➕ Thêm mẫu ca'}</h2>
            <p className="modal-sub">{editing ? `Đang sửa: ${editing.name}` : 'Tạo mẫu ca làm việc mới'}</p>
          </div>
          <button onClick={onClose} className="modal-close"><X size={18}/></button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div className="form-field">
            <label className="form-label">Tên ca <span className="form-req">*</span></label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="VD: Ca sáng, Ca hành chính..."
              className={`form-input${errors.name?' form-input-err':''}`}/>
            {errors.name && <span className="form-err-msg">{errors.name}</span>}
          </div>

          {/* Type */}
          <div className="form-field">
            <label className="form-label">Loại ca</label>
            <div className="mode-tabs">
              <button onClick={()=>setType('fixed')} className={`mode-tab${type==='fixed'?' active':''}`}>📌 Ca cố định</button>
              <button onClick={()=>setType('flexible')} className={`mode-tab${type==='flexible'?' active':''}`}>🔄 Ca linh hoạt</button>
            </div>
          </div>

          {/* Fixed: time range */}
          {type === 'fixed' && (
            <div className="form-field">
              <label className="form-label">Thời gian</label>
              <div className="form-time-row">
                <div><label className="form-sublabel">Bắt đầu</label><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} className="form-input"/></div>
                <span className="form-arrow">→</span>
                <div><label className="form-sublabel">Kết thúc</label><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} className="form-input"/></div>
              </div>
            </div>
          )}

          {/* Flexible: min hours */}
          {type === 'flexible' && (
            <div className="form-field">
              <label className="form-label">Số giờ tối thiểu / ngày</label>
              <input type="number" min={1} max={24} step={0.5} value={minHours}
                onChange={e=>setMinHours(+e.target.value)}
                className={`form-input${errors.minHours?' form-input-err':''}`}/>
              {errors.minHours && <span className="form-err-msg">{errors.minHours}</span>}
            </div>
          )}

          {/* Color */}
          <div className="form-field">
            <label className="form-label">Màu hiển thị</label>
            <div className="color-palette">
              {COLOR_PALETTE.map(c => (
                <button key={c} onClick={()=>setColor(c)}
                  className={`color-swatch${color===c?' selected':''}`}
                  style={{background:c}} title={c}/>
              ))}
            </div>
            <div className="color-preview-row">
              <div className="color-preview-chip" style={{background:color+'18',borderLeft:`4px solid ${color}`,color}}>
                <span style={{fontWeight:600}}>{name||'Tên ca'}</span>
                <span style={{fontSize:11,opacity:0.7}}>
                  {type==='fixed' ? ` · ${startTime}–${endTime}` : ` · Linh hoạt`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn-cancel">Hủy</button>
          <button onClick={save} className="modal-btn-save">{editing ? 'Cập nhật' : 'Thêm mẫu ca'}</button>
        </div>
      </div>
    </div>
  )
}
