import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

// ===== RESTAURANTS =====
export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: async () => {
      const { data } = await api.get('/api/restaurants')
      return data
    }
  })
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ['restaurants', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/restaurants/${id}`)
      return data
    },
    enabled: !!id
  })
}

// ===== BRANCHES =====
export function useBranches(restaurantId: string) {
  return useQuery({
    queryKey: ['branches', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/branches/restaurant/${restaurantId}`)
      return data
    },
    enabled: !!restaurantId
  })
}

export function useTables(workingId: string, type: 'branch' | 'restaurant' = 'branch', configs?: Record<string, any>) {
  return useQuery({
    queryKey: ['tables', type, workingId],
    queryFn: async () => {
      const endpoint = type === 'branch' 
        ? `/api/tables/branch/${workingId}` 
        : `/api/tables/restaurant/${workingId}`
      const { data } = await api.get(endpoint)
      return data
    },
    enabled: !!workingId,
    refetchOnMount: true,
    refetchInterval: 8000,
    ...configs
  })
}

export function useTableById(tableId: string) {
  return useQuery({
    queryKey: ['tables', tableId],
    queryFn: async () => {
      const { data } = await api.get(`/api/tables/${tableId}`)
      return data
    },
    enabled: !!tableId,
    refetchOnMount: true,
  })
}

export function useUpdateTableStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/api/tables/${id}/status`, { status })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tables'] })
  })
}

// ===== MENU =====
export function useMenuCategories(restaurantId: string, branchId?: string) {
  return useQuery({
    queryKey: ['menu-categories', restaurantId, branchId],
    queryFn: async () => {
      const { data } = await api.get(`/api/menu/categories/restaurant/${restaurantId}`, { params: { branchId } })
      return data
    },
    enabled: !!restaurantId,
    refetchOnMount: true,
  })
}

export function useCreateMenuCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: any) => {
      const { data } = await api.post('/api/menu/categories', dto)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
  })
}

export function useUpdateMenuCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: any) => {
      const { data } = await api.put(`/api/menu/categories/${id}`, dto)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
  })
}

export function useDeleteMenuCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/menu/categories/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-categories'] })
  })
}

export function useMenuItems(restaurantId: string, branch?: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['menu-items', restaurantId, branch, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/menu/items/restaurant/${restaurantId}/branch/${branch || null}`, { params })
      return data
    },
    enabled: !!restaurantId,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  })
}


export function useMenuItemsInBranch(branchId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['menu-items', branchId, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/menu/items/branch/${branchId}`, { params })
      return data
    },
    enabled: !!branchId,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
  })
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Record<string, unknown>) => {
      const { data } = await api.post('/api/menu/items', dto)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-items'] })
  })
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: Record<string, unknown>) => {
      const { data } = await api.put(`/api/menu/items/${id}`, dto)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-items'] })
  })
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/menu/items/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menu-items'] })
  })
}

// ===== ORDERS =====
export function useOrders(restaurantId: string, branchId?: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['orders', restaurantId, branchId, params],
    queryFn: async () => {
      const url = branchId 
        ? `/api/orders/branch/${branchId}` 
        : `/api/orders/restaurant/${restaurantId}`
      const { data } = await api.get(url, { params })
      return data
    },
    enabled: !!(restaurantId || branchId)
  })
}

export function useRecentPayments(workingId: string, mode: 'branch' | 'restaurant', params?: Record<string, any>) {
  return useQuery({
    queryKey: ['payments-recent', mode, workingId, params],
    queryFn: async () => {
      const endpoint = mode === 'branch' 
        ? `/api/payment/recent/branch/${workingId}` 
        : `/api/payment/recent/restaurant/${workingId}`
      const { data } = await api.get(endpoint, { params })
      return data
    },
    enabled: !!workingId
  })
}

export function useActiveOrders(workingId: string, type: 'branch' | 'restaurant' = 'branch') {
  return useQuery({
    queryKey: ['orders', 'active', type, workingId],
    queryFn: async () => {
      const endpoint = type === 'branch'
        ? `/api/orders/active/branch/${workingId}`
        : `/api/orders/active/restaurant/${workingId}`
      const { data } = await api.get(endpoint)
      return data
    },
    enabled: !!workingId,
    refetchInterval: 15000,
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/${id}`)
      return data
    },
    enabled: !!id
  })
}

export function useTableOrders(tableId: string) {
  return useQuery({
    queryKey: ['orders', 'table', tableId],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/table/${tableId}`)
      return data
    },
    enabled: !!tableId
  })
}

export function useKitchenOrders(branchId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['orders', 'kitchen', branchId, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/kitchen/branch/${branchId}`, { params })
      return data
    },
    enabled: !!branchId,
    refetchInterval: 8000, // More frequent for kitchen
  })
}

export function useKitchenTickets(branchId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['kitchen-tickets', branchId, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/kitchen/branch/${branchId}`, { params })
      return data
    },
    enabled: !!branchId,
    refetchInterval: 10000,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Record<string, unknown>) => {
      const { data } = await api.post('/api/orders', dto)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })
}

export function useAddOrderItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, ...dto }: { orderId: string } & Record<string, unknown>) => {
      const { data } = await api.post(`/api/orders/${orderId}/items`, dto)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  })
}

export function useAddOrderItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, items }: { orderId: string, items: any[] }) => {
      const { data } = await api.post(`/api/orders/${orderId}/items/multiple`, items)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/api/orders/${id}/status`, { status })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })
}

export function useSplitTable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: any) => {
      const { data } = await api.post('/api/orders/split', dto)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })
}

export function useMergeTables() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: any) => {
      const { data } = await api.post('/api/orders/merge', dto)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })
}

export function useUpdateOrderItemStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const { data } = await api.patch(`/api/orders/items/${itemId}/status`, { status })
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] })
  })
}

export function useDishSalesStats(workingId: string, filter: string, type: 'branch' | 'restaurant' = 'branch') {
  return useQuery({
    queryKey: ['orders', 'stats', 'dish-sales', type, workingId, filter],
    queryFn: async () => {
      const endpoint = type === 'branch'
        ? `/api/orders/stats/dish-sales/branch/${workingId}`
        : `/api/orders/stats/dish-sales/restaurant/${workingId}`
      const { data } = await api.get(endpoint, { params: { filter } })
      return data
    },
    enabled: !!workingId
  })
}

// ===== PAYMENTS =====
export function useProcessPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: Record<string, unknown>) => {
      const { data } = await api.post('/api/payment', dto)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
    }
  })
}



// ===== RESERVATIONS =====
export function useReservations(branchId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['reservations', branchId, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/reservations/branch/${branchId}`, { params })
      return data.items || []
    },
    enabled: !!branchId
  })
}

// ===== CUSTOMERS =====
export function useCustomers(restaurantId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['customers', restaurantId, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/customers/restaurant/${restaurantId}`, { params })
      return data
    },
    enabled: !!restaurantId,
    refetchOnMount: true,
  })
}

// ===== EMPLOYEES =====
export function useEmployees(branchId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['employees', branchId, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/employees/branch/${branchId}`, { params })
      return data
    },
    enabled: !!branchId
  })
}

export function useEmployeeShifts(branchId: string, date: string) {
  return useQuery({
    queryKey: ['shifts', branchId, date],
    queryFn: async () => {
      const { data } = await api.get(`/api/employees/shifts/branch/${branchId}`, { params: { date } })
      return data
    },
    enabled: !!branchId
  })
}

export function useInventoryItems(workingId: string, type: 'branch' | 'restaurant' = 'branch', params?: Record<string, any>) {
  return useQuery({
    queryKey: ['inventory-items', type, workingId, params],
    queryFn: async () => {
      const endpoint = type === 'branch' 
        ? `/api/inventory/items/branch/${workingId}` 
        : `/api/inventory/items/restaurant/${workingId}`
      const { data } = await api.get(endpoint, { params })
      return data
    },
    enabled: !!workingId
  })
}

export function useSuppliers(restaurantId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['suppliers', restaurantId, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/inventory/suppliers/restaurant/${restaurantId}`, { params })
      return data
    },
    enabled: !!restaurantId
  })
}

// ===== PROMOTIONS =====
export function usePromotions(restaurantId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['promotions', restaurantId, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/promotions/restaurant/${restaurantId}`, { params })
      return data.items || []
    },
    enabled: !!restaurantId,
    refetchOnMount: true,
  })
}

// ===== DASHBOARD & STATS =====
export function useDashboardOverview(workingId: string, mode: 'branch' | 'restaurant', filter: string) {
  return useQuery({
    queryKey: ['dashboard-overview', workingId, mode, filter],
    queryFn: async () => {
      const { data } = await api.get(`/api/dashboard/overview/${workingId}`, { params: { mode, filter } })
      return data
    },
    enabled: !!workingId
  })
}

export function useHourlyStats(workingId: string, mode: 'branch' | 'restaurant', filter: string) {
  return useQuery({
    queryKey: ['dashboard-hourly', workingId, mode, filter],
    queryFn: async () => {
      const { data } = await api.get(`/api/dashboard/hourly/${workingId}`, { params: { mode, filter } })
      return data
    },
    enabled: !!workingId
  })
}

export function useCategoryRevenue(workingId: string, mode: 'branch' | 'restaurant', filter: string) {
  return useQuery({
    queryKey: ['dashboard-category-revenue', workingId, mode, filter],
    queryFn: async () => {
      const { data } = await api.get(`/api/dashboard/category-revenue/${workingId}`, { params: { mode, filter } })
      return data
    },
    enabled: !!workingId
  })
}

// ===== AUDIT LOGS =====
export function useAuditLogs(params: { page?: number; pageSize?: number; module?: string; search?: string }) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const { data } = await api.get('/api/audit', { params })
      return data
    }
  })
}

// ===== ROLES =====
export function useRoles(restaurantId: string, params?: Record<string, any>) {
  return useQuery({
    queryKey: ['roles', restaurantId, params],
    queryFn: async () => {
      const { data } = await api.get(`/api/roles/restaurant/${restaurantId}`, { params })
      return data
    },
    enabled: !!restaurantId,
    refetchOnMount: true,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dto: any) => {
      const { data } = await api.post('/api/roles', dto)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: any) => {
      const { data } = await api.put(`/api/roles/${id}`, dto)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/roles/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] })
  })
}
