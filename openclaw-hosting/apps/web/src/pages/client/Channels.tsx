export function Channels() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Channel Configuration</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600 mb-4">
          Connect your OpenClaw instance to messaging platforms.
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <h3 className="font-semibold">Telegram</h3>
              <p className="text-sm text-gray-500">Connect via Bot API</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Connect
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded">
            <div>
              <h3 className="font-semibold">Discord</h3>
              <p className="text-sm text-gray-500">Connect via Bot Token</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
