'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { useOrganization } from '@/lib/useOrganization'
import BulkImportCustomers from '@/components/BulkImportCustomers'
import BulkImportContacts from '@/components/BulkImportContacts'
import { AlertCircle } from 'lucide-react'

export default function BulkImportPage() {
  const router = useRouter()
  const { org, isAdmin, loading: orgLoading, error: orgError } = useOrganization()
  const [activeTab, setActiveTab] = useState('customers')

  // Redirect if not admin
  if (!orgLoading && !isAdmin) {
    router.push('/dashboard')
  }

  if (orgLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 bg-slate-100">
          <div className="text-center py-12">
            <p className="text-slate-600">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  if (orgError) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 bg-slate-100">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Error: {orgError}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 bg-slate-100">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">
            Bulk Import
          </h1>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Duplicate records will be skipped</li>
                <li>Review error messages and correct your CSV before retrying</li>
                <li>All imported data will be visible to all team members</li>
              </ul>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-0 border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'customers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Import Customers
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'contacts'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800'
              }`}
            >
              Import Contacts
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'customers' && <BulkImportCustomers org={org} />}
          {activeTab === 'contacts' && <BulkImportContacts org={org} />}
        </div>
      </main>
    </div>
  )
}
