export function Skills() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Skills Marketplace</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Web Search</h3>
          <p className="text-sm text-gray-500 mt-1">Search the web for information</p>
          <button className="mt-3 px-3 py-1 bg-green-600 text-white text-sm rounded">
            Installed
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">File System</h3>
          <p className="text-sm text-gray-500 mt-1">Read and write files</p>
          <button className="mt-3 px-3 py-1 bg-green-600 text-white text-sm rounded">
            Installed
          </button>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Browser</h3>
          <p className="text-sm text-gray-500 mt-1">Control web browser</p>
          <button className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded">
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
