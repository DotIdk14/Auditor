import admin from "firebase-admin";
import { createClient } from "@supabase/supabase-js";
import serviceAccount from "../../firebase-service-account.json";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

let firebaseInitialized = false;

function initFirebaseAdmin() {
  if (firebaseInitialized) return;
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
  firebaseInitialized = true;
}

export async function syncSupervisoresFromSupabase(): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  initFirebaseAdmin();

  const result = { created: 0, updated: 0, errors: [] as string[] };

  if (!supabaseUrl || !supabaseAnonKey) {
    result.errors.push("SUPABASE_URL or SUPABASE_ANON_KEY not configured");
    return result;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("email, nombre, rol")
    .in("rol", ["admin", "coordinador"]);

  if (error || !profiles) {
    result.errors.push(`Supabase query failed: ${error?.message || "no data"}`);
    return result;
  }

  for (const profile of profiles) {
    if (!profile.email) continue;

    try {
      const existingUser = await admin.auth().getUserByEmail(profile.email).catch(() => null);

      if (existingUser) {
        await admin.auth().updateUser(existingUser.uid, {
          displayName: profile.nombre || profile.email.split("@")[0],
        });
        result.updated++;
      } else {
        const tempPassword = generateSecurePassword();
        await admin.auth().createUser({
          email: profile.email,
          emailVerified: true,
          password: tempPassword,
          displayName: profile.nombre || profile.email.split("@")[0],
        });
        result.created++;
      }
    } catch (err: any) {
      result.errors.push(`${profile.email}: ${err.message}`);
    }
  }

  return result;
}

function generateSecurePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 16; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}
