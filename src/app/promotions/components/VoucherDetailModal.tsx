import { useState, useEffect } from 'react'
import AuthLayout from '@/components/AuthLayout'
import api from '@/lib/api'
import {
    XCircle,
} from 'lucide-react'

export function VoucherDetailModal({ setShowModal, visible, selectedPromotion, vouchersList }: 
    { setShowModal: (isShow: boolean) => void; visible: boolean; selectedPromotion: Promotion; vouchersList: VoucherCode[] }) {
    return (
        visible &&
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Chi tiết & Mã Voucher</h2>
                        <p className="text-sm text-gray-500 mt-1">{selectedPromotion.name}</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto max-h-[70vh]">
                    <h3 className="text-lg font-bold mb-4">Mã Voucher ({vouchersList.length})</h3>
                    {vouchersList.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vouchersList.map((v) => (
                                <div key={v.id} className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-200">
                                    <div className="font-mono text-lg font-bold text-blue-600">{v.code}</div>
                                    <div className="text-sm text-gray-500 mt-2">Đã dùng: {v.currentUsage} {v.maxUsage ? `/ ${v.maxUsage}` : ''}</div>
                                    {v.isUsed && <div className="text-xs font-bold text-red-500 mt-1">HẾT LƯỢT HOẶC HẾT HẠN</div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            Chưa có mã voucher nào được tạo
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}