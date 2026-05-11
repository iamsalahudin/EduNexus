'use client'

<<<<<<< HEAD
import InventoryWorkspace from '@/components/inventory/InventoryWorkspace'

export default function InventoryPage() {
  return <InventoryWorkspace section="overview" />
=======
export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">Manage school inventory and items</p>
        </div>
      </div>
      {/* Content will be added here */}
    </div>
  )
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
}
