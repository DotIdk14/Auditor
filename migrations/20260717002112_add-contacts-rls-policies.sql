-- ============================================
-- Add missing RLS policies for public.contacts
-- Allows non-admin users (area_manager, coordinator,
-- supervisor, agent) to INSERT and UPDATE contacts
-- ============================================

-- INSERT policy: any authenticated user with a profile can create contacts
-- The application already enforces scope via assigned_to/area_id/team_id
CREATE POLICY "contacts_insert_authenticated" ON public.contacts FOR INSERT WITH CHECK (
  auth.email() IN (SELECT email FROM public.profiles WHERE role IN ('admin', 'area_manager', 'coordinator', 'supervisor', 'agent'))
);

-- UPDATE policy: users can update contacts in their area (or any contact if admin)
CREATE POLICY "contacts_update_authenticated" ON public.contacts FOR UPDATE USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
  OR auth.email() IN (SELECT email FROM public.profiles WHERE area_id = contacts.area_id)
) WITH CHECK (
  auth.email() IN (SELECT email FROM public.profiles WHERE role = 'admin')
  OR auth.email() IN (SELECT email FROM public.profiles WHERE area_id = contacts.area_id)
);

-- DELETE policy: agents cannot delete, but area managers/coordinators/supervisors can
CREATE POLICY "contacts_delete_authenticated" ON public.contacts FOR DELETE USING (
  auth.email() IN (SELECT email FROM public.profiles WHERE role IN ('admin', 'area_manager', 'coordinator', 'supervisor'))
);
