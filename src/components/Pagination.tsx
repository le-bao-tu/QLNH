import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  pageIndex: number
  pageSize: number
  totalCount: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({
  pageIndex,
  totalCount,
  totalPages,
  onPageChange
}: PaginationProps) {
  if (totalPages <= 1) return null

  // Generate range of pages to show
  const getPageRange = () => {
    const delta = 2
    const range = []
    for (
      let i = Math.max(2, pageIndex - delta);
      i <= Math.min(totalPages - 1, pageIndex + delta);
      i++
    ) {
      range.push(i)
    }

    if (pageIndex - delta > 2) range.unshift('...')
    range.unshift(1)

    if (pageIndex + delta < totalPages - 1) range.push('...')
    if (totalPages > 1) range.push(totalPages)

    return range
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-100 rounded-b-[2rem]">
      <p className="text-sm text-gray-500 font-medium font-sans">
        Hiển thị <span className="text-gray-900 font-bold">{totalCount}</span> kết quả
      </p>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 1}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white transition-all disabled:opacity-30 shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex items-center gap-1 hidden sm:flex">
          {getPageRange().map((p, idx) => (
            <React.Fragment key={idx}>
              {p === '...' ? (
                <span className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
              ) : (
                <button
                  onClick={() => onPageChange(p as number)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all focus:outline-none ${
                    pageIndex === p
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                      : 'border border-gray-200 text-gray-500 hover:bg-white'
                  }`}
                >
                  {p}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex === totalPages}
          className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-white transition-all disabled:opacity-30 shadow-sm"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
