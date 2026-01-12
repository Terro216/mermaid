import { Routes, Route, Navigate } from 'react-router-dom'
import HostView from './components/HostView'
import GuestView from './components/GuestView'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-light to-ocean-dark overflow-hidden">
      <Routes>
        <Route path="/host" element={<HostView />} />
        <Route path="/play" element={<GuestView />} />
        <Route path="/" element={<Navigate to="/play" replace />} />
      </Routes>
    </div>
  )
}

export default App

