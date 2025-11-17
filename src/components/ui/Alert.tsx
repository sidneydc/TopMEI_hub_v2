import { ReactNode } from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

type AlertType = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  type?: AlertType
  title?: string
  message?: string
  children?: ReactNode
  onClose?: () => void
}

export function Alert({ type = 'info', title, message, children, onClose }: AlertProps) {
  const styles = {
    info: {
      container: 'bg-info-light border-info text-secondary-700',
      icon: <Info className="w-5 h-5 text-info" />,
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <XCircle className="w-5 h-5 text-red-600" />,
    },
  }

  const style = styles[type]

  return (
    <div className={`border rounded-lg p-4 ${style.container}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{style.icon}</div>
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm">{message || children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

