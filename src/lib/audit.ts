import api from './api'

export interface AuditLogData {
  action: string
  module: string
  targetId?: string
  oldData?: any
  newData?: any
}

/**
 * Ghi lại hành động của người dùng lên hệ thống (Thủ công)
 * @param data Thông tin hành động cần log
 */
export const logUserAction = async (data: AuditLogData) => {
  try {
    await api.post('/api/Audit/log', {
      ...data,
      oldData: typeof data.oldData === 'object' ? JSON.stringify(data.oldData) : data.oldData,
      newData: typeof data.newData === 'object' ? JSON.stringify(data.newData) : data.newData
    })
  } catch (error) {
    console.warn('Failed to send audit log:', error)
  }
}

// Các module hỗ trợ phân loại log thủ công
export const AuditModules = {
  AUTH: 'Xác thực',
  BRANCH: 'Chi nhánh',
  RESTAURANT: 'Nhà hàng',
  POS: 'Bán hàng (POS)',
  MENU: 'Thực đơn',
  TABLE: 'Sơ đồ bàn',
  INVENTORY: 'Kho hàng',
  EMPLOYEE: 'Nhân viên',
  RESERVATION: 'Đặt bàn',
  NOTIFICATION: 'Thông báo',
  CUSTOMER: 'Khách hàng',
  PROMOTION: 'Khuyến mãi',
  SYSTEM: 'Hệ thống'
} as const
