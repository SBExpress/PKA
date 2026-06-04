'use client'

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Download } from 'lucide-react'

export default function BulkImportCustomers({ org }) {
  const [csvData, setCSVData] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Handle file upload
  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      setCSVData(event.target.result)
      setError(null)
      setResult(null)
    }
    reader.readAsText(file)
  }

  // Handle CSV paste
  function handleCSVPaste(e) {
    setCSVData(e.target.value)
    setError(null)
  }

  // Submit import
  async function handleImport() {
    if (!csvData.trim()) {
      setError('Please provide CSV data')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/customers/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: org.id,
          csv_data: csvData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Import failed')
        setLoading(false)
        return
      }

      setResult(data)
      setCSVData('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Download error CSV
  function downloadErrorCSV() {
    if (!result?.errors || result.errors.length === 0) return

    const errorLines = [
      'row,errors',
      ...result.errors.map(
        e => `${e.row},"${Array.isArray(e.errors) ? e.errors.join('; ') : e.errors}"`
      ),
    ]

    const csv = errorLines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customer-import-errors-${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">CSV Format:</h3>
        <code className="text-xs bg-blue-100 p-3 block rounded text-blue-900 mb-2 overflow-x-auto">
          name,email,phone,type,address,notes
          <br />
          ABC Corp,contact@abc.com,555-1234,customer,123 Main St,Good customer
        </code>
        <p className="text-sm text-blue-800">
          <strong>Required:</strong> name | <strong>Optional:</strong> email,
          phone, type (customer/vendor/both), address, notes
        </p>
      </div>

      {/* File Upload & Text Paste */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Option 1: Upload CSV File
          </label>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-slate-300 transition-colors">
            <Upload className="mx-auto text-slate-400 mb-2" size={24} />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
            >
              Click to upload
            </label>
            <p className="text-xs text-slate-500 mt-1">or drag and drop</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Option 2: Paste CSV Data
          </label>
          <textarea
            value={csvData}
            onChange={handleCSVPaste}
            placeholder="name,email,phone,type,address,notes&#10;ABC Corp,contact@abc.com,555-1234,customer,123 Main St,Good customer"
            className="w-full h-32 border border-slate-200 rounded-lg p-3 text-sm font-mono text-slate-700"
          />
        </div>
      </div>

      {/* Import Button */}
      <button
        onClick={handleImport}
        disabled={loading || !csvData.trim()}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Importing...' : 'Import Customers'}
      </button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          {result.successful > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
              <div>
                <p className="font-semibold text-green-900">
                  Import successful!
                </p>
                <p className="text-green-800">
                  {result.successful} customer{result.successful !== 1 ? 's' : ''}{' '}
                  imported
                </p>
              </div>
            </div>
          )}

          {result.failed > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3">
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-semibold text-yellow-900">
                      {result.failed} row{result.failed !== 1 ? 's' : ''} failed
                    </p>
                    <p className="text-yellow-800 text-sm">
                      Fix the errors below and try again
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadErrorCSV}
                  className="text-yellow-700 hover:text-yellow-800 text-sm font-medium flex items-center gap-1"
                >
                  <Download size={14} />
                  Download Errors
                </button>
              </div>

              {/* Error Table */}
              <div className="mt-3 bg-white rounded border border-yellow-200 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-yellow-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-yellow-900">
                        Row
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-yellow-900">
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-100">
                    {result.errors.map((err, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 text-yellow-900 font-mono">
                          {err.row}
                        </td>
                        <td className="px-3 py-2 text-yellow-800">
                          {Array.isArray(err.errors)
                            ? err.errors.join(', ')
                            : err.errors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
            <p>
              Total: {result.total} | Successful: {result.successful} | Failed:{' '}
              {result.failed}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
