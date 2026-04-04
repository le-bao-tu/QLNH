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

// ===== TABLES =====
export function useTables(branchId: string) {
  return useQuery({
    queryKey: ['tables', branchId],
    queryFn: async () => {
      const { data } = await api.get(`/api/tables/branch/${branchId}`)
      return data
    },
    enabled: !!branchId,
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
export function useMenuCategories(restaurantId: string) {
  return useQuery({
    queryKey: ['menu-categories', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/menu/categories/restaurant/${restaurantId}`)
      return data
    },
    enabled: !!restaurantId,
    refetchOnMount: true,
  })
}

export function useMenuItems(restaurantId: string) {
  return useQuery({
    queryKey: ['menu-items', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/menu/items/restaurant/${restaurantId}`)
      return data
    },
    enabled: !!restaurantId,
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
export function useActiveOrders(branchId: string) {
  return useQuery({
    queryKey: ['orders', 'active', branchId],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/active/branch/${branchId}`)
      return data
    },
    enabled: !!branchId,
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

export function useKitchenOrders(branchId: string) {
  return useQuery({
    queryKey: ['orders', 'kitchen', branchId],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/kitchen/branch/${branchId}`)
      return data
    },
    enabled: !!branchId,
    refetchInterval: 8000, // More frequent for kitchen
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

export function useRecentPayments(branchId: string) {
  return useQuery({
    queryKey: ['payments', 'recent', branchId],
    queryFn: async () => {
      // Backend does not have a /recent/branch/id endpoint in PaymentController yet.
      // We will follow the backend singular route pattern.
      const { data } = await api.get(`/api/payment/recent/branch/${branchId}`)
      return data
    },
    enabled: !!branchId
  })
}

// ===== RESERVATIONS =====
export function useReservations(branchId: string, date?: string) {
  return useQuery({
    queryKey: ['reservations', branchId, date],
    queryFn: async () => {
      const { data } = await api.get(`/api/reservations/branch/${branchId}`, { params: { date } })
      return data
    },
    enabled: !!branchId
  })
}

// ===== CUSTOMERS =====
export function useCustomers(restaurantId: string, search?: string) {
  return useQuery({
    queryKey: ['customers', restaurantId, search],
    queryFn: async () => {
      const { data } = await api.get(`/api/customers/restaurant/${restaurantId}`, { params: { search } })
      return data
    },
    enabled: !!restaurantId,
    refetchOnMount: true,
  })
}

// ===== EMPLOYEES =====
export function useEmployees(branchId: string) {
  return useQuery({
    queryKey: ['employees', branchId],
    queryFn: async () => {
      const { data } = await api.get(`/api/employees/branch/${branchId}`)
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

// ===== INVENTORY =====
export function useInventoryItems(branchId: string) {
  return useQuery({
    queryKey: ['inventory-items', branchId],
    queryFn: async () => {
      const { data } = await api.get(`/api/inventory/items/branch/${branchId}`)
      return data
    },
    enabled: !!branchId
  })
}

export function useSuppliers(restaurantId: string) {
  return useQuery({
    queryKey: ['suppliers', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/inventory/suppliers/restaurant/${restaurantId}`)
      return data
    },
    enabled: !!restaurantId
  })
}

// ===== PROMOTIONS =====
export function usePromotions(restaurantId: string) {
  return useQuery({
    queryKey: ['promotions', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/promotions/restaurant/${restaurantId}`)
      return data
    },
    enabled: true,
    refetchOnMount: true,
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

