import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Quotations from './pages/Quotations';
import QuotationBuilder from './pages/QuotationBuilder';
import ProductLibrary from './pages/ProductLibrary';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { user, authLoading } = useApp();
  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-gradient)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)', fontWeight: 700 }}>QuoteFlow</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Loading...</div>
        </div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, authLoading } = useApp();
  if (authLoading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"        element={<Dashboard />} />
        <Route path="quotations"       element={<Quotations />} />
        <Route path="quotations/new"   element={<QuotationBuilder />} />
        <Route path="quotations/:id/edit" element={<QuotationBuilder />} />
        <Route path="products"         element={<ProductLibrary />} />
        <Route path="inventory"        element={<Inventory />} />
        <Route path="settings"         element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
