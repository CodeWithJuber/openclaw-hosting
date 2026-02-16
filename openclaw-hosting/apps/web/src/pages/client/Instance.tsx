export function Instance() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Instance Management</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Instance Details</h2>
        
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Instance ID</dt>
            <dd className="font-mono">abc1234</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Hostname</dt>
            <dd>abc1234.yourdomain.com</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">IP Address</dt>
            <dd className="font-mono">78.46.123.45</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Created</dt>
            <dd>2025-01-15</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
