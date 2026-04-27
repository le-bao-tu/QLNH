'use client'

import { useAuth } from '@/lib/auth'
import { useBranches } from '@/hooks/useApi'
import { SelectBox } from './SelectBox'

export function BranchSelector({isSelectAll = true}: {isSelectAll?: boolean}) {
  const { user, selectedBranchId, setSelectedBranchId } = useAuth()
  const { data: branches = [] } = useBranches(user?.restaurantId as string)

  if (!user?.isOwner) return null

  // Create options list with "All" option
  const options = [
    isSelectAll && { id: '', name: 'Tất cả chi nhánh' },
    ...branches
  ]

  return (
    <div style={{ minWidth: 200 }}>
      <SelectBox 
        options={options} 
        optionLabel='name' 
        optionValue='id' 
        onChange={val => setSelectedBranchId(val)} 
        value={selectedBranchId} 
        placeholder="Chọn chi nhánh"
      />
    </div>
  )
}
