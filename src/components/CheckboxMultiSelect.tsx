'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, X } from 'lucide-react'

interface Option {
    id: string
    name: string
}

interface Props {
    options: Option[]
    value: string[]
    onChange: (ids: string[]) => void
    placeholder?: string
    label?: string
    disabled?: boolean
}

export function CheckboxMultiSelect({
    options,
    value,
    onChange,
    placeholder = 'Chọn...',
    disabled = false,
}: Props) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const toggle = (id: string) => {
        onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
    }

    const toggleAll = () => {
        onChange(value.length === options.length ? [] : options.map(o => o.id))
    }

    const remove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(value.filter(v => v !== id))
    }

    const selectedNames = options.filter(o => value.includes(o.id)).map(o => o.name)

    return (
        <div ref={ref} style={{ position: 'relative', width: '100%' }}>
            {/* Trigger button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%',
                    minHeight: 42,
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 6,
                    padding: '6px 36px 6px 12px',
                    background: disabled ? '#f1f5f9' : '#f8fafc',
                    border: `1.5px solid ${open ? '#2563eb' : '#e2e8f0'}`,
                    borderRadius: 10,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s',
                    position: 'relative',
                    boxShadow: open ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
                }}
            >
                {selectedNames.length === 0 ? (
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{placeholder}</span>
                ) : (
                    selectedNames.map((name, i) => {
                        const id = options.find(o => o.name === name)?.id || ''
                        return (
                            <span
                                key={id}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    background: '#dbeafe',
                                    color: '#1d4ed8',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    padding: '2px 8px 2px 10px',
                                    borderRadius: 999,
                                }}
                            >
                                {name}
                                <X
                                    size={11}
                                    style={{ cursor: 'pointer', flexShrink: 0 }}
                                    onClick={(e) => remove(id, e)}
                                />
                            </span>
                        )
                    })
                )}
                {/* Arrow icon */}
                <ChevronDown
                    size={16}
                    style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
                        color: '#94a3b8',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                    }}
                />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: 12,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                        zIndex: 9999,
                        overflow: 'hidden',
                    }}
                >
                    {/* Select All */}
                    <button
                        type="button"
                        onClick={toggleAll}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '9px 14px',
                            background: value.length === options.length ? '#eff6ff' : 'white',
                            border: 'none',
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#374151',
                        }}
                    >
                        <div style={{
                            width: 17, height: 17, borderRadius: 5,
                            border: `2px solid ${value.length === options.length && options.length > 0 ? '#2563eb' : '#cbd5e1'}`,
                            background: value.length === options.length && options.length > 0 ? '#2563eb' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            {value.length === options.length && options.length > 0 && (
                                <Check size={10} color="white" strokeWidth={3} />
                            )}
                        </div>
                        Chọn tất cả
                        <span style={{ marginLeft: 'auto', color: '#94a3b8', fontWeight: 500 }}>
                            {value.length}/{options.length}
                        </span>
                    </button>

                    {/* Options list */}
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {options.length === 0 ? (
                            <p style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>
                                Không có dữ liệu
                            </p>
                        ) : (
                            options.map(opt => {
                                const checked = value.includes(opt.id)
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => toggle(opt.id)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '9px 14px',
                                            background: checked ? '#eff6ff' : 'white',
                                            border: 'none',
                                            borderBottom: '1px solid #f8fafc',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={e => {
                                            if (!checked) (e.currentTarget as HTMLElement).style.background = '#f8fafc'
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLElement).style.background = checked ? '#eff6ff' : 'white'
                                        }}
                                    >
                                        <div style={{
                                            width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                                            border: `2px solid ${checked ? '#2563eb' : '#cbd5e1'}`,
                                            background: checked ? '#2563eb' : 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.15s',
                                        }}>
                                            {checked && <Check size={10} color="white" strokeWidth={3} />}
                                        </div>
                                        <span style={{
                                            fontSize: 13,
                                            fontWeight: checked ? 600 : 400,
                                            color: checked ? '#1d4ed8' : '#374151',
                                        }}>
                                            {opt.name}
                                        </span>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
