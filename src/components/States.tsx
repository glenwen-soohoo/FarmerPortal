export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-2xl text-ink-faint">{message}</p>
    </div>
  )
}
