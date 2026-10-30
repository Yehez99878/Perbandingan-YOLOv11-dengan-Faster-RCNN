import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { DashboardPage, ComparisonPage } from './pages'

export default function App() {
  return <BrowserRouter><Routes><Route element={<AppLayout />}>
    <Route index element={<DashboardPage />} />
    <Route path="/comparison" element={<ComparisonPage />} />
    <Route path="/models/:modelId" element={<Navigate to="/comparison" replace />} />
    <Route path="/metrics" element={<Navigate to="/comparison" replace />} />
    <Route path="/confusion-matrix" element={<Navigate to="/comparison" replace />} />
    <Route path="/image-testing" element={<Navigate to="/comparison" replace />} />
    <Route path="/history" element={<Navigate to="/comparison" replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route></Routes></BrowserRouter>
}
