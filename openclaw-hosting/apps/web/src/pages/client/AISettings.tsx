export function AISettings() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">AI Settings</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">API Keys</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
            <input
              type="password"
              placeholder="sk-..."
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Anthropic API Key</label>
            <input
              type="password"
              placeholder="sk-ant-..."
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
