// 按鈕文字：把 label 拆成數段，每段內部不斷行，只允許在「段與段之間」換行，
// 避免中文逐字斷在奇怪的地方。例：parts={['重印','相同貨單']} → 需要時斷成「重印 / 相同貨單」。
export default function BtnLabel({ parts }: { parts: string[] }) {
  return (
    <span className="leading-tight">
      {parts.map((p, i) => (
        <span key={i} className="inline-block whitespace-nowrap">
          {p}
        </span>
      ))}
    </span>
  )
}
