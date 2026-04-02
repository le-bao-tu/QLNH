interface MenuItem {
    id: string
    name: string
    price?: number
    category?: string
    imageUrl?: string
}

interface MenuItemDTO {
    id: string,
    categoryId: string,
    categoryName: string,
    name: string,
    description: string,
    price: number,
    imageUrl: string,
    unit: string,
    isAvailable: boolean,
    sortOrder: number,
    itemType: string,
    comboItems: []
}