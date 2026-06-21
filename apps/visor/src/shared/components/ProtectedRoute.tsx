import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../auth/authStore';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { user, hydrated } = useAuthStore();
  const location = useLocation();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-[#141210]">
        <div className="w-8 h-8 border-2 border-[#b57b54]/30 border-t-[#b57b54] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
