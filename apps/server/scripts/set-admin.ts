/**
 * Script para asignar rol admin a un usuario existente.
 * Uso: npx tsx scripts/set-admin.ts <email>
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY en .env.local
 * Copia: SUPABASE_SERVICE_ROLE_KEY=… del proyecto Supabase (Settings → API → service_role key)
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL || "https://vvvamcmbcfwgakjonwgw.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY no configurada en .env.local");
  console.log("Crea .env.local con: SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role");
  process.exit(1);
}

const targetEmail = process.argv[2]?.toLowerCase().trim();
if (!targetEmail) {
  console.error("❌ Debes proporcionar un email: npx tsx scripts/set-admin.ts <email>");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`🔍 Buscando usuario: ${targetEmail}\n`);

  // 1. Buscar en auth.users
  const { data: users, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Error al listar usuarios:", listError.message);
    process.exit(1);
  }

  let user = users.users.find(u => u.email === targetEmail);

  if (!user) {
    console.log(`  ↳ Usuario no encontrado en auth.users. Creando...`);
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: targetEmail,
      password: crypto.randomUUID().slice(0, 16),
      email_confirm: true,
      user_metadata: { full_name: targetEmail.split("@")[0] },
    });

    if (createError) {
      console.error(`  ❌ Error al crear usuario:`, createError.message);
      process.exit(1);
    }

    user = newUser.user;
    console.log(`  ✅ Auth user creado: ${user.id}`);
  } else {
    console.log(`  ✅ Auth user encontrado: ${user.id}`);
  }

  // 2. Upsert profile con role admin
  const { error: upsertError } = await admin.from("profiles").upsert({
    id: user.id,
    email: targetEmail,
    full_name: user.user_metadata?.full_name || targetEmail.split("@")[0],
    role: "admin",
    is_active: true,
  });

  if (upsertError) {
    console.error(`  ❌ Error al actualizar perfil:`, upsertError.message);
    process.exit(1);
  }

  console.log(`  ✅ Perfil actualizado: ${targetEmail} → admin\n`);
  console.log("🎉 Listo! El usuario ahora tiene rol admin.");
}

main().catch(console.error);
