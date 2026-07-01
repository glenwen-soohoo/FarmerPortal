import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import FlowDoc from './pages/FlowDoc'
import FarmerLayout from './pages/farmer/FarmerLayout'
import Login from './pages/farmer/Login'
import Shippable from './pages/farmer/Shippable'
import Upcoming from './pages/farmer/Upcoming'
import History from './pages/farmer/History'
import AllOrders from './pages/farmer/AllOrders'
import Me from './pages/farmer/Me'
import Dashboard from './pages/admin/Dashboard'
import Binding from './pages/admin/Binding'
import Accounts from './pages/admin/Accounts'
import OrderDetail from './pages/admin/OrderDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/flow" element={<FlowDoc />} />

      {/* 農友端 */}
      <Route path="/farmer/login" element={<Login />} />
      <Route path="/farmer" element={<FarmerLayout />}>
        <Route path="shippable" element={<Shippable />} />
        <Route path="upcoming" element={<Upcoming />} />
        <Route path="history" element={<History />} />
        <Route path="all" element={<AllOrders />} />
        <Route path="me" element={<Me />} />
      </Route>

      {/* 業務端後台 */}
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/binding" element={<Binding />} />
      <Route path="/admin/accounts" element={<Accounts />} />
      <Route path="/admin/orders/:id" element={<OrderDetail />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
