import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './auth/authStore';
import Layout from './shared/components/Layout';
import ProtectedRoute from './shared/components/ProtectedRoute';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/calls/DashboardPage';
import AuditorPage from './features/audits/AuditorPage';
import AuditorDashboardPage from './features/audits/AuditorDashboardPage';
import ContactsPage from './features/contacts/ContactsPage';
import ContactDetailPage from './features/contacts/ContactDetailPage';
import ResourcesPage from './features/resources/ResourcesPage';

export default function App() {
  // Esperar a que Zustand persist termine de hidratar desde sessionStorage
  const [ready, setReady] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setReady(true));
    return unsub;
  }, []);

  // Una vez listo, verificar sesión si hay token persistido
  useEffect(() => {
    if (ready) {
      const { accessToken, checkSession } = useAuthStore.getState();
      if (accessToken) {
        checkSession();
      }
    }
  }, [ready]);

  if (!ready) {
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
        <Route path="auditor" element={<AuditorDashboardPage />} />
        <Route path="auditor/:callId" element={<AuditorPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="contacts/:id" element={<ContactDetailPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
