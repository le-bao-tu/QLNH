import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info' | 'success'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  type = 'warning',
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null

  const config = {
    danger: {
      icon: <AlertTriangle size={24} className="text-red-600" />,
      bgIcon: 'bg-red-100',
      btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    },
    warning: {
      icon: <AlertTriangle size={24} className="text-amber-600" />,
      bgIcon: 'bg-amber-100',
      btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
    },
    info: {
      icon: <Info size={24} className="text-blue-600" />,
      bgIcon: 'bg-blue-100',
      btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    },
    success: {
      icon: <CheckCircle size={24} className="text-green-600" />,
      bgIcon: 'bg-green-100',
      btn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
    }
  }

  const currentConfig = config[type]

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[1.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={`w-12 h-12 rounded-full ${currentConfig.bgIcon} flex items-center justify-center`}>
              {currentConfig.icon}
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
              <X size={20} />
            </button>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="p-4 bg-gray-50 flex gap-3 justify-end border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center min-w-[100px] ${currentConfig.btn} disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
