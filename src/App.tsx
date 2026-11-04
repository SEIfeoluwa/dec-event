import { Navigate, Routes, Route } from 'react-router-dom'

import HomePage from './pages/HomePage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import GuestLookupPage from './pages/GuestLookupPage'

import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/rsvp-lookup-6a66d28f" element={<GuestLookupPage />} />
    </Routes>
  )
}
