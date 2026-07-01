import { Navigate } from 'react-router-dom'

// 07/01：移除「待覆核」頁。低信心/多品項單一律照常派單，直接在派單總覽看。
// 保留此檔僅為避免殘留 import；一律轉回派單總覽。
export default function Review() {
  return <Navigate to="/admin/dashboard" replace />
}
