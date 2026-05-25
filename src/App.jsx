import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import LandingPage from './pages/LandingPage';
import HowItWorksPage from './pages/HowItWorksPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import TendersList from './pages/admin/TendersList';
import CreateTender from './pages/admin/CreateTender';
import BidManagement from './pages/admin/BidManagement';
import ContractorManagement from './pages/admin/ContractorManagement';
import DocumentManagement from './pages/admin/DocumentManagement';
import AdminProfile from './pages/admin/AdminProfile';
import ReviewBoq from './pages/admin/ReviewBoq';
import BidComparison from './pages/admin/BidComparison';
import TenderDetails from './pages/TenderDetails';
import BidDetails from './pages/admin/BidDetails';

// Shared Pages
import Notifications from './pages/Notifications';

// Owner Pages
import OwnerLayout from './components/layout/OwnerLayout';
import OwnerDashboard from './pages/owner/Dashboard';
import UserManagement from './pages/owner/UserManagement';
import UserProfile from './pages/owner/UserProfile';
import RevenueDashboard from './pages/owner/RevenueDashboard';
import AuditLog from './pages/owner/AuditLog';
import Configuration from './pages/owner/Configuration';
import NotificationControl from './pages/owner/NotificationControl';
import Advertisements from './pages/owner/Advertisements';

// Contractor Pages
import ContractorDashboard from './pages/contractor/Dashboard';
import ActiveTenders from './pages/contractor/ActiveTenders';
import MyBids from './pages/contractor/MyBids';
import Profile from './pages/contractor/Profile';
import DocumentCenter from './pages/contractor/DocumentCenter';
import Billing from './pages/contractor/Billing';
import PaymentSuccess from './pages/contractor/PaymentSuccess';
import PaymentCancel from './pages/contractor/PaymentCancel';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/" element={<LandingPage />} />
              <Route path="/come-funziona" element={<HowItWorksPage />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin', 'contractor']} />}>
                <Route element={<Layout />}>

                  {/* Admin Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                      <Route index element={<AdminDashboard />} />
                      <Route path="/admin/create-tender" element={<CreateTender />} />
                      <Route path="/admin/edit-tender/:id" element={<CreateTender />} />
                      <Route path="/admin/tenders" element={<TendersList />} />
                      <Route path="/admin/bids" element={<BidManagement />} />
                      <Route path="/admin/contractors" element={<ContractorManagement />} />
                      <Route path="/admin/documents" element={<DocumentManagement />} />
                      <Route path="/admin/notifications" element={<Notifications />} />
                      <Route path="/admin/profile" element={<AdminProfile />} />
                    </Route>
                    <Route path="/admin/tenders/:id" element={<TenderDetails />} />
                    <Route path="/admin/tenders/:id/boq-review" element={<ReviewBoq />} />
                    <Route path="/admin/tenders/:id/compare" element={<BidComparison />} />
                    <Route path="/admin/bids/:id" element={<BidDetails />} />
                  </Route>

                  {/* Contractor Routes */}
                  <Route element={<ProtectedRoute allowedRoles={['contractor']} />}>
                    <Route path="/contractor" element={<ContractorDashboard />} />
                    <Route path="/contractor/tenders" element={<ActiveTenders />} />
                    <Route path="/contractor/bids" element={<MyBids />} />
                    <Route path="/contractor/documents" element={<DocumentCenter />} />
                    <Route path="/contractor/notifications" element={<Notifications />} />
                    <Route path="/contractor/billing" element={<Billing />} />
                    <Route path="/contractor/profile" element={<Profile />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />
                    <Route path="/contractor/tenders/:id" element={<TenderDetails />} />
                    {/* Alias routes requested by client for quoting view */}
                    <Route path="/contractor/appalti/:id/preventivo" element={<TenderDetails />} />
                    <Route path="/imprese/appalti/:id/preventivo" element={<TenderDetails />} />
                  </Route>

                </Route>
              </Route>

              {/* Owner Routes */}
              <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                <Route path="/owner" element={<OwnerLayout />}>
                  <Route index element={<OwnerDashboard />} />
                  <Route path="/owner/users" element={<UserManagement />} />
                  <Route path="/owner/users/:id" element={<UserProfile />} />
                  <Route path="/owner/tenders" element={<TendersList />} />
                  <Route path="/owner/edit-tender/:id" element={<CreateTender />} />
                  <Route path="/owner/tenders/:id" element={<TenderDetails />} />
                  <Route path="/owner/bids/:id" element={<BidDetails />} />
                  <Route path="/owner/revenue" element={<RevenueDashboard />} />
                  <Route path="/owner/audit" element={<AuditLog />} />
                  <Route path="/owner/config" element={<Configuration />} />
                  <Route path="/owner/notifications" element={<NotificationControl />} />
                  <Route path="/owner/advertisements" element={<Advertisements />} />
                  <Route path="/owner/profile" element={<AdminProfile />} />
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
