interface CommentsSkeletonProps {
  count?: number
}

export const CommentsSkeleton = ({ count = 3 }: CommentsSkeletonProps) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-alt border border-border animate-pulse shrink-0" />
          <div className="flex-1 rounded-2xl bg-surface-alt border border-border px-4 py-2.5 animate-pulse">
            <div className="h-3 w-24 rounded bg-border mb-2" />
            <div className="h-3 w-3/4 rounded bg-border" />
          </div>
        </div>
      ))}
    </div>
  )
}