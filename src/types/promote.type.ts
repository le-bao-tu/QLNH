interface Promotion {
  id: string
  name: string
  description?: string
  type: 'percentage' | 'fixed_amount'
  applyTo: 'bill' | 'item'
  discountValue: number
  minOrderAmount?: number
  maxDiscount?: number
  maxDiscountAmount?: number
  startDate: string
  endDate: string
  isActive: boolean
  menuItemIds?: string
  voucherCodes?: VoucherCode[]
}

interface VoucherCode {
  id: string
  code: string
  maxUsage?: number
  currentUsage: number
  isUsed: boolean
}