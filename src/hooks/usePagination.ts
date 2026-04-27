import { useState } from 'react'

export interface PaginationState {
  pageIndex: number
  pageSize: number
  search?: string
  [key: string]: any
}

export function usePagination(initialPageSize = 20, initialParams: Record<string, any> = {}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 1,
    pageSize: initialPageSize,
    search: '',
    ...initialParams
  })

  const setPage = (page: number) => {
    setPagination(prev => ({ ...prev, pageIndex: page }))
  }

  const setSearch = (search: string) => {
    setPagination(prev => ({ ...prev, search, pageIndex: 1 }))
  }

  const setPageSize = (pageSize: number) => {
    setPagination(prev => ({ ...prev, pageSize, pageIndex: 1 }))
  }

  const setExtraParam = (key: string, value: any) => {
    setPagination(prev => ({ ...prev, [key]: value, pageIndex: 1 }))
  }

  return {
    ...pagination,
    setPage,
    setSearch,
    setPageSize,
    setExtraParam,
    paginationParams: pagination
  }
}
