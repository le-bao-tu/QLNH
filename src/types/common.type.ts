interface Order {
    id: string
    tableNumber: number
    status: string
    totalAmount: number
    itemCount: number
    createdAt: string
}

interface Table {
    id: string
    tableNumber: number
    status: string
    capacity: number
}

interface Payment {
    id: string
    amount: number,
    method: string,
    status: string,
    orderId: string,
    createdAt: string
}

interface Reservation {
    id: string
    status: string
}

interface InventoryItem {
    id: string
    isLowStock: boolean
}