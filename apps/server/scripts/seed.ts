/**
 * Seed script for initial CRM setup.
 * Run: npx tsx scripts/seed.ts
 * 
 * Creates:
 * 1. Admin user in Supabase Auth (ianidk1@gmail.com)
 * 2. Profile with admin role
 * 3. Test agents in each area/team
 * 4. Sample contacts for testing
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

const anon = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || ""
);

interface SeedUser {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "area_manager" | "coordinator" | "supervisor" | "agent" | "qa";
  areaCode?: string;
  teamCode?: string;
}

async function createAuthUser(email: string, password: string, fullName: string) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    // User might already exist
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

async function upsertProfile(userId: string, user: SeedUser) {
  // Get area and team IDs if specified
  let areaId: string | null = null;
  let teamId: string | null = null;

  if (user.areaCode) {
    const { data: areas } = await admin
      .from("areas")
      .select("id")
      .eq("code", user.areaCode)
      .limit(1);

    if (areas && areas.length > 0) {
      areaId = areas[0].id;

      if (user.teamCode) {
        const { data: teams } = await admin
          .from("teams")
          .select("id")
          .eq("code", user.teamCode)
          .eq("area_id", areaId)
          .limit(1);

        if (teams && teams.length > 0) {
          teamId = teams[0].id;
        }
      }
    }
  }

  const { error } = await admin.from("profiles").upsert({
    id: userId,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    area_id: areaId,
    team_id: teamId,
    is_active: true,
  });

  if (error) {
    console.error(`  ❌ Error al crear perfil para ${user.email}:`, error.message);
  } else {
    console.log(`  ✅ Perfil: ${user.email} → ${user.role}` + (areaId ? ` (área: ${user.areaCode})` : ""));
  }
}

async function main() {
  console.log("🚀 Iniciando seed de datos...\n");

  // 1. Create admin user
  const adminUser: SeedUser = {
    email: "ianidk1@gmail.com",
    password: "Admin2026!",
    fullName: "Ian Administrador",
    role: "admin",
  };

  console.log("📝 Creando usuario administrador...");
  const adminAuthUser = await createAuthUser(adminUser.email, adminUser.password, adminUser.fullName);
  await upsertProfile(adminAuthUser.id, adminUser);

  // 2. Create test users per area
  const testUsers: SeedUser[] = [
    // Ventas Norte
    { email: "manager.norte@test.com", password: "Test2026!", fullName: "María García", role: "area_manager", areaCode: "VENTAS_NORTE" },
    { email: "coord.norte@test.com", password: "Test2026!", fullName: "Carlos López", role: "coordinator", areaCode: "VENTAS_NORTE" },
    { email: "sup.alpha@test.com", password: "Test2026!", fullName: "Ana Martínez", role: "supervisor", areaCode: "VENTAS_NORTE", teamCode: "ALPHA" },
    { email: "agent.norte1@test.com", password: "Test2026!", fullName: "Pedro Sánchez", role: "agent", areaCode: "VENTAS_NORTE", teamCode: "ALPHA" },
    { email: "agent.norte2@test.com", password: "Test2026!", fullName: "Laura Díaz", role: "agent", areaCode: "VENTAS_NORTE", teamCode: "ALPHA" },

    // Ventas Sur
    { email: "manager.sur@test.com", password: "Test2026!", fullName: "Roberto Fernández", role: "area_manager", areaCode: "VENTAS_SUR" },
    { email: "sup.beta@test.com", password: "Test2026!", fullName: "Sofía Ruiz", role: "supervisor", areaCode: "VENTAS_SUR", teamCode: "BETA" },
    { email: "agent.sur1@test.com", password: "Test2026!", fullName: "Diego Torres", role: "agent", areaCode: "VENTAS_SUR", teamCode: "BETA" },

    // Retención
    { email: "manager.ret@test.com", password: "Test2026!", fullName: "Elena Vargas", role: "area_manager", areaCode: "RETENCION" },
    { email: "agent.ret1@test.com", password: "Test2026!", fullName: "Jorge Morales", role: "agent", areaCode: "RETENCION", teamCode: "GAMMA" },
    { email: "agent.ret2@test.com", password: "Test2026!", fullName: "Carmen Flores", role: "agent", areaCode: "RETENCION", teamCode: "GAMMA" },

    // QA
    { email: "qa.norte@test.com", password: "Test2026!", fullName: "Luis Mendoza", role: "qa", areaCode: "VENTAS_NORTE" },
    { email: "qa.sur@test.com", password: "Test2026!", fullName: "Patricia Ortiz", role: "qa", areaCode: "VENTAS_SUR" },
  ];

  console.log("\n📝 Creando usuarios de prueba...");
  for (const user of testUsers) {
    try {
      const authUser = await createAuthUser(user.email, user.password, user.fullName);
      await upsertProfile(authUser.id, user);
    } catch (err: any) {
      console.error(`  ❌ Error con ${user.email}:`, err.message);
    }
  }

  // 3. Create sample contacts for testing
  console.log("\n📝 Creando contactos de prueba...");
  const { data: agents } = await admin
    .from("profiles")
    .select("id, full_name, area_id, team_id")
    .eq("role", "agent");

  const { data: stages } = await admin
    .from("pipeline_stages")
    .select("id, name")
    .order("display_order");

  const { data: pipeline } = await admin
    .from("pipelines")
    .select("id")
    .eq("is_default", true)
    .limit(1)
    .single();

  if (agents && stages && pipeline) {
    const sampleContacts = [
      { name: "TechCorp Solutions", phone: "+525511223344", email: "contacto@techcorp.com", company: "TechCorp Solutions", stage: "Nuevo" },
      { name: "GlobalConnect SA", phone: "+525522334455", email: "ventas@globalconnect.com", company: "GlobalConnect SA", stage: "Contactado" },
      { name: "InnovaSoft México", phone: "+525533445566", email: "info@innovasoft.mx", company: "InnovaSoft México", stage: "Calificado" },
      { name: "DataFlow Systems", phone: "+525544556677", email: "ventas@dataflow.com", company: "DataFlow Systems", stage: "Propuesta" },
      { name: "CloudNine Services", phone: "+525555667788", email: "hola@cloudnine.com", company: "CloudNine Services", stage: "Negociación" },
      { name: "GreenEnergy Corp", phone: "+525566778899", email: "info@greenenergy.com", company: "GreenEnergy Corp", stage: "Cerrado Ganado" },
      { name: "BlueOcean Ventures", phone: "+525577889900", email: "contacto@blueocean.com", company: "BlueOcean Ventures", stage: "Cerrado Perdido" },
      { name: "SmartHome Technologies", phone: "+525588990011", email: "ventas@smarthome.com", company: "SmartHome Technologies", stage: "Nuevo" },
      { name: "Pyme Solutions MX", phone: "+525599001122", email: "info@pymesolutions.mx", company: "Pyme Solutions MX", stage: "Contactado" },
      { name: "NextGen Digital", phone: "+525500112233", email: "hola@nextgen.digital", company: "NextGen Digital", stage: "Nuevo" },
    ];

    for (let i = 0; i < sampleContacts.length; i++) {
      const contact = sampleContacts[i];
      const agent = agents[i % agents.length];
      const stage = stages.find(s => s.name === contact.stage) || stages[0];
      const sourceNames: Array<"inbound" | "outbound" | "referral" | "web"> = ["inbound", "outbound", "referral", "web"];

      const { error } = await admin.from("contacts").insert({
        full_name: contact.name,
        phone: contact.phone,
        email: contact.email,
        company: contact.company,
        source: sourceNames[i % sourceNames.length],
        status: contact.stage === "Cerrado Ganado" ? "customer" : contact.stage === "Cerrado Perdido" ? "churned" : "lead",
        assigned_to: agent.id,
        area_id: agent.area_id,
        team_id: agent.team_id,
        pipeline_id: pipeline.id,
        stage_id: stage.id,
        metadata: {
          estimatedValue: Math.floor(Math.random() * 50000) + 5000,
          industry: ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing"][i % 5],
        },
      });

      if (error) {
        console.error(`  ❌ Error al crear contacto ${contact.name}:`, error.message);
      } else {
        console.log(`  ✅ Contacto: ${contact.name} → ${contact.stage}`);
      }
    }
  }

  console.log("\n🎉 Seed completado!");
  console.log("\n📋 Credenciales de prueba:");
  console.log("  Admin: ianidk1@gmail.com / Admin2026!");
  console.log("  Manager Norte: manager.norte@test.com / Test2026!");
  console.log("  Agent Norte: agent.norte1@test.com / Test2026!");
  console.log("  QA Norte: qa.norte@test.com / Test2026!");
}

main().catch(console.error);
