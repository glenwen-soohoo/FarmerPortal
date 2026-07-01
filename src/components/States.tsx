export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-2xl text-muted">{message}</p>
    </div>
  )
}

export function LoadingState({ message = '載入中…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-xl text-muted">{message}</p>
    </div>
  )
}
