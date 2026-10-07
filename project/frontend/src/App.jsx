import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import TransactionForm from './pages/TransactionForm.jsx'
import PaymentResult from './pages/PaymentResult.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminTransactionDetail from './pages/AdminTransactionDetail.jsx'
import FeatureReference from './pages/FeatureReference.jsx'
import RulesEditor from './pages/RulesEditor.jsx'
import ModelComparison from './pages/ModelComparison.jsx'
import History from './pages/History.jsx'

function AdminGuard({ children }) {
  if (!localStorage.getItem('isAdmin')) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer side */}
        <Route path="/" element={<TransactionForm />} />
        <Route path="/result" element={<PaymentResult />} />

        {/* Admin side */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/transaction/:id" element={<AdminGuard><AdminTransactionDetail /></AdminGuard>} />
        <Route path="/admin/features" element={<AdminGuard><FeatureReference /></AdminGuard>} />
        <Route path="/admin/rules" element={<AdminGuard><RulesEditor /></AdminGuard>} />
        <Route path="/admin/comparison" element={<AdminGuard><ModelComparison /></AdminGuard>} />
        <Route path="/admin/history" element={<AdminGuard><History /></AdminGuard>} />
      </Routes>
    </BrowserRouter>
  )
}
