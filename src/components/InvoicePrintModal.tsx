'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { X, Printer, CheckCircle } from 'lucide-react'

export interface InvoiceItem {
  menuItemName: string
  quantity: number
  unitPrice: number
  originalPrice?: number
  subTotal: number
  note?: string
}

export interface InvoiceData {
  orderId: string
  tableNumber: number | string
  items: InvoiceItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  paymentMethod: string
  customerName?: string
  voucherCode?: string
  restaurantName?: string
  restaurantAddress?: string
  restaurantPhone?: string
  createdAt?: string,
  bankId?: string,
  bankOwner?: string,
  bankNumber?: string,
  branchs: any[]
}

interface InvoicePrintModalProps {
  data: InvoiceData
  onClose: () => void
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  card: 'Thẻ ngân hàng',
  transfer: 'Chuyển khoản',
}

export default function InvoicePrintModal({ data, onClose }: InvoicePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML
    if (!printContent) return

    const printWindow = window.open('', '_blank', 'width=400,height=700')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>Hóa Đơn - Bàn ${data.tableNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            color: #111;
            background: #fff;
            padding: 16px;
            width: 320px;
          }
          .center { text-align: center; }
          .bold { font-weight: 700; }
          .divider { border-top: 1px dashed #aaa; margin: 8px 0; }
          .double-divider { border-top: 2px solid #333; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .restaurant-name { font-size: 18px; font-weight: 900; margin-bottom: 2px; }
          .invoice-title { font-size: 15px; font-weight: 700; margin: 8px 0 4px; letter-spacing: 2px; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; }
          .item-price { width: 80px; text-align: right; }
          .item-total { width: 90px; text-align: right; font-weight: 700; }
          .total-row { font-size: 16px; font-weight: 900; }
          .footer { margin-top: 12px; font-size: 11px; color: #555; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() { window.print(); window.close(); }
        <\/script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const now = data.createdAt ? new Date(data.createdAt) : new Date()
  const dateStr = now.toLocaleDateString('vi-VN')
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const payMethodLabel = PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b bg-gradient-to-r from-green-500 to-emerald-600">
          <div className="flex items-center gap-3 text-white">
            <CheckCircle size={28} />
            <div>
              <h2 className="text-xl font-black">Thanh toán hóa đơn!</h2>
              <p className="text-green-100 text-sm">Xem và in hóa đơn</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition">
            <X size={18} />
          </button>
        </div>

        {/* Invoice preview */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div ref={printRef} className="font-mono text-sm text-gray-800">
            {/* Restaurant info */}
            <div className="center" style={{ textAlign: 'center' }}>
              <div className="restaurant-name bold" style={{ fontSize: 17, fontWeight: 900 }}>
                {data.restaurantName || 'NHÀ HÀNG'}
              </div>
              {data.restaurantAddress && (
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{data.restaurantAddress}</div>
              )}
              {data.restaurantPhone && (
                <div style={{ fontSize: 11, color: '#555' }}>ĐT: {data.restaurantPhone}</div>
              )}
              <div className="invoice-title" style={{ fontSize: 14, fontWeight: 800, margin: '8px 0 4px', letterSpacing: 2 }}>
                ★ HÓA ĐƠN THANH TOÁN ★
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #aaa', margin: '6px 0' }} />

            {/* Order info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Bàn:</span><span style={{ fontWeight: 700 }}>Bàn {data.tableNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Ngày:</span><span>{dateStr}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Giờ:</span><span>{timeStr}</span>
            </div>
            {data.customerName && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>Khách hàng:</span><span style={{ fontWeight: 700 }}>{data.customerName}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>TT:</span><span style={{ fontWeight: 700 }}>{payMethodLabel}</span>
            </div>

            <div style={{ borderTop: '1px dashed #aaa', margin: '6px 0' }} />

            {/* Items header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>
              <span style={{ flex: 1 }}>Món</span>
              <span style={{ width: 28, textAlign: 'center' }}>SL</span>
              <span style={{ width: 72, textAlign: 'right' }}>Đơn giá</span>
              <span style={{ width: 80, textAlign: 'right' }}>T.Tiền</span>
            </div>

            {/* Items */}
            {(() => {
              const groupedItems: any[] = [];
              data.items
                .filter(item => item.status !== 'awaiting_confirmation' && item.status !== 'cancelled')
                .forEach(item => {
                const existing = groupedItems.find(g => g.menuItemName === item.menuItemName && g.unitPrice === item.unitPrice && g.note === item.note);
                if (existing) {
                  existing.quantity += item.quantity;
                  existing.subTotal += item.subTotal;
                } else {
                  groupedItems.push({ ...item });
                }
              });

              return groupedItems.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 1 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item.menuItemName}</div>
                      {item.originalPrice && item.originalPrice > item.unitPrice && (
                        <div style={{ fontSize: 9, color: '#aaa', textDecoration: 'line-through' }}>{item.originalPrice.toLocaleString('vi-VN')}</div>
                      )}
                    </div>
                    <span style={{ width: 28, textAlign: 'center', fontSize: 12 }}>x{item.quantity}</span>
                    <span style={{ width: 72, textAlign: 'right', fontSize: 11, color: '#555' }}>
                      {item.unitPrice.toLocaleString('vi-VN')}
                    </span>
                    <span style={{ width: 80, textAlign: 'right', fontWeight: 700, fontSize: 12 }}>
                      {item.subTotal.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  {item.note && (
                    <div style={{ fontSize: 10, color: '#888', paddingLeft: 4, marginBottom: 2 }}>↳ {item.note}</div>
                  )}
                </div>
              ));
            })()}

            <div style={{ borderTop: '1px dashed #aaa', margin: '8px 0' }} />

            {/* Totals */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>Tạm tính:</span>
              <span>{data.subtotal.toLocaleString('vi-VN')}đ</span>
            </div>
            {data.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, color: '#059669' }}>
                <span>Giảm giá{data.voucherCode ? ` (${data.voucherCode})` : ''}:</span>
                <span>-{data.discountAmount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, color: '#555' }}>
              <span>Thuế VAT (10%):</span>
              <span>{data.taxAmount.toLocaleString('vi-VN')}đ</span>
            </div>

            <div style={{ borderTop: '2px solid #222', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900 }}>
              <span>TỔNG CỘNG:</span>
              <span style={{ color: '#1d4ed8' }}>{data.totalAmount.toLocaleString('vi-VN')}đ</span>
            </div>

            <div style={{ borderTop: '1px dashed #aaa', margin: '10px 0 6px' }} />


            {/* QR Code */}
            <div style={{ margin: '0 auto', display: 'block', width: 80, height: 80 }}>
              <Image
                alt="QR code for payment"
                src={`https://qr.sepay.vn/img?acc=${data.bankNumber}&bank=${data.bankId}&amount=${data.totalAmount}`}
                width={80}
                height={80}
              />
            </div>

            {/* Danh sách chi nhánh */}
            {data.branchs.length > 0 && (
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 2 }}>Chi nhánh:</div>
                {data.branchs.map((branch: any, idx: number) => (
                  <div key={idx} style={{ fontSize: 10, color: '#555', marginBottom: 1 }}>
                    {branch.name} - {branch.address} - {branch.phone}
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: 11, color: '#666', lineHeight: 1.6 }} className="footer">
              <div>Cảm ơn quý khách đã sử dụng dịch vụ!</div>
              <div>Hẹn gặp lại!</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-5 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-2xl font-black uppercase text-xs transition"
          >
            Đóng
          </button>
          <button
            onClick={handlePrint}
            className="flex-[1.5] py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition"
          >
            <Printer size={16} />
            In hóa đơn
          </button>
        </div>
      </div>
    </div>
  )
}
