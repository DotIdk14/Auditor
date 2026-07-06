/**
 * Seed script for initial CRM setup.
 * Run: npx tsx scripts/seed.ts
 * 
 * Creates:
 * 1. Admin user in Supabase Auth (ianidk1@gmail.com)
 * 2. Profile with admin role
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://vvvamcmbcfwgakjonwgw.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY no configurada en .env.local");
  console.log("Agrega: SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createAuthUser(email: string, password: string, fullName: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    if (error.message.includes("already exists")) {
      const { data: users } = await admin.auth.admin.listUsers();
      const existing = users.users.find(u => u.email === email);
      if (existing) {
        console.log(`  ↳ Usuario ya existe: ${email} (${existing.id})`);
        return existing;
      }
    }
    throw error;
  }

  console.log(`  ✅ Creado: ${email} (${data.user.id})`);
  return data.user;
}

async function upsertProfile(userId: string, email: string, fullName: string, role: string) {
  const { error } = await admin.from("profiles").upsert({
    id: userId,
    email,
    full_name: fullName,
    role,
    is_active: true,
  });

  if (error) {
    console.error(`  ❌ Error al crear perfil para ${email}:`, error.message);
  } else {
    console.log(`  ✅ Perfil: ${email} → ${role}`);
  }
}

async function main() {
  console.log("🚀 Iniciando seed de datos...\n");

  // 1. Create admin user
  console.log("📝 Creando usuario administrador...");
  const adminAuthUser = await createAuthUser("ianidk1@gmail.com", "Admin2026!", "Ian Administrador");
  await upsertProfile(adminAuthUser.id, "ianidk1@gmail.com", "Ian Administrador", "admin");

  console.log("\n🎉 Seed completado!");
  console.log("\n📋 Credenciales:");
  console.log("  Admin: ianidk1@gmail.com / Admin2026!");
}

main().catch(console.error);
