import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../auth/authStore';

export interface PositiveTipificacion {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  interactionType: 'llamada' | 'correo' | 'whatsapp';
  notes: string | null;
  created_by_name: string;
  created_at: string;
}

export function usePositiveTipificaciones() {
  const accessToken = useAuthStore(s => s.accessToken);

  return useQuery({
    queryKey: ['positive-tipificaciones'],
    queryFn: () => apiClient.get<PositiveTipificacion[]>('/positive-tipificaciones'),
    enabled: !!accessToken,
    refetchInterval: 30000,
  });
}
