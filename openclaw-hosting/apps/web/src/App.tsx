import { Routes, Route } from 'react-router-dom'

// Client pages
import { Overview } from './pages/client/Overview'
import { Instance } from './pages/client/Instance'
import { Channels } from './pages/client/Channels'
import { AISettings } from './pages/client/AISettings'
import { Skills } from './pages/client/Skills'
import { Analytics } from './pages/client/Analytics'

// Admin pages
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminInstances } from './pages/admin/Instances'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Client Routes */}
        <Route path="/" element={<Overview />} />
        <Route path="/instance" element={<Instance />} />
        <Route path="/channels" element={<Channels />} />
        <Route path="/ai-settings" element={<AISettings />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/analytics" element={<Analytics />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/instances" element={<AdminInstances />} />
      </Routes>
    </div>
  )
}

export default App
