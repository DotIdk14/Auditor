import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './auth/authStore';
import Layout from './shared/components/Layout';
import ProtectedRoute from './shared/components/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/calls/DashboardPage';
import AuditorPage from './features/audits/AuditorPage';
import ContactsPage from './features/contacts/ContactsPage';
import ContactDetailPage from './features/contacts/ContactDetailPage';
import ResourcesPage from './features/resources/ResourcesPage';

export default function App() {
  const { hydrated, checkSession } = useAuthStore();

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      checkSession();
    } else {
      useAuthStore.setState({ hydrated: true });
    }
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-[#141210]">
        <div className="w-8 h-8 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="auditor/:callId" element={<AuditorPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="contacts/:id" element={<ContactDetailPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
