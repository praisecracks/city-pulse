export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`bg-[#F6F1E6] rounded animate-pulse ${className}`}
      {...props}
    />
  );
}

export function SkeletonCard({ className = "", children }) {
  return (
    <div className={`rounded-2xl bg-white p-6 shadow-sm border border-[#14232B]/5 ${className}`}>
      {children}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#14232B]/5 animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-1/4 rounded mb-2" />
          <Skeleton className="h-8 w-1/3 rounded" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonChart({ height = 350 }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#14232B]/5">
      <div className="mb-4">
        <Skeleton className="h-5 w-1/4 rounded" />
        <Skeleton className="h-4 w-1/5 rounded mt-1" />
      </div>
      <div className={`h-[${height}px] flex items-center justify-center`}>
        <Skeleton className="w-full h-full rounded" />
      </div>
      <div className="mt-4 pt-4 border-t border-[#14232B]/5 flex flex-wrap gap-4">
        <Skeleton className="h-5 w-24 rounded" />
        <Skeleton className="h-5 w-24 rounded" />
      </div>
    </div>
  );
}

export function SkeletonDonutChart({ height = 300 }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#14232B]/5">
      <div className="mb-4">
        <Skeleton className="h-5 w-1/4 rounded" />
        <Skeleton className="h-4 w-1/5 rounded mt-1" />
      </div>
      <div className={`h-[${height}px] flex items-center justify-center`}>
        <Skeleton className="w-[200px] h-[200px] rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonTable({ columns = 6, rows = 5 }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-[#14232B]/5 overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-[#F6F1E6]">
            <tr>
              {[...Array(columns)].map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-full rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#14232B]/10">
            {[...Array(rows)].map((_, i) => (
              <tr key={i}>
                {[...Array(columns)].map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#14232B]/10">
        <Skeleton className="h-4 w-32 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3 }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-[#14232B]/5 divide-y divide-[#14232B]/5 animate-pulse">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-1/4 rounded mb-1" />
              <Skeleton className="h-4 w-1/3 rounded" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonSection({ title = true, children }) {
  return (
    <div className="space-y-4 animate-pulse">
      {title && <Skeleton className="h-6 w-1/4 rounded" />}
      {children}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-1/3 rounded" />
          <Skeleton className="h-4 w-1/2 rounded mt-1" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonChart height={350} />
          <SkeletonDonutChart height={300} />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#14232B]/5 animate-pulse">
            <div className="mb-4">
              <Skeleton className="h-5 w-1/4 rounded" />
              <Skeleton className="h-4 w-1/5 rounded mt-1" />
            </div>
            <SkeletonList items={4} />
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#14232B]/5 animate-pulse">
            <div className="mb-4">
              <Skeleton className="h-5 w-1/4 rounded" />
              <Skeleton className="h-4 w-1/5 rounded mt-1" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-1/3 rounded" />
          <Skeleton className="h-4 w-1/2 rounded mt-1" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonChart height={350} />
          <SkeletonDonutChart height={300} />
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#14232B]/5 animate-pulse">
            <div className="mb-4">
              <Skeleton className="h-5 w-1/4 rounded" />
              <Skeleton className="h-4 w-1/5 rounded mt-1" />
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-5 w-20 rounded font-bold" />
                </div>
              ))}
              <div className="pt-4 border-t border-[#14232B]/5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-5 w-20 rounded font-bold" />
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#14232B]/5 animate-pulse">
            <div className="mb-4">
              <Skeleton className="h-5 w-1/4 rounded" />
              <Skeleton className="h-4 w-1/5 rounded mt-1" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-1/3 rounded" />
          <Skeleton className="h-4 w-1/2 rounded mt-1" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <SkeletonTable columns={6} rows={8} />
    </div>
  );
}