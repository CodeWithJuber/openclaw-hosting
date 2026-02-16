export function Overview() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
      <p className="text-gray-600">Welcome to your OpenClaw Hosting dashboard.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Instance Status</h3>
          <p className="text-green-600">Active</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Plan</h3>
          <p>Professional</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Region</h3>
          <p>Frankfurt</p>
        </div>
      </div>
    </div>
  )
}
