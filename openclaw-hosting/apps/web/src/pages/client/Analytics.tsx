export function Analytics() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Usage Statistics</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">1,234</p>
            <p className="text-sm text-gray-500">Messages</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">56</p>
            <p className="text-sm text-gray-500">API Calls</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">12</p>
            <p className="text-sm text-gray-500">Skills Used</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">99.9%</p>
            <p className="text-sm text-gray-500">Uptime</p>
          </div>
        </div>
      </div>
    </div>
  )
}
