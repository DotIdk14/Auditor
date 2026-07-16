import admin from "firebase-admin";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

let firebaseInitialized = false;
let cachedDirname: string | null = null;

function getDirname(): string {
  if (cachedDirname) return cachedDirname;
  try {
    cachedDirname = dirname(fileURLToPath(import.meta.url));
  } catch {
    cachedDirname = process.cwd();
  }
  return cachedDirname;
}

function getServiceAccount(): admin.ServiceAccount {
  const envJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (envJson) {
    return JSON.parse(envJson) as admin.ServiceAccount;
  }
  const filePath = join(getDirname(), "../../firebase-service-account.json");
  return JSON.parse(readFileSync(filePath, "utf-8")) as admin.ServiceAccount;
}

function initFirebaseAdmin() {
  if (firebaseInitialized) return;
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
  });
  firebaseInitialized = true;
}

const DEFAULT_PASSWORD = "Supervisor2026!";

export async function syncSupervisoresFromSupabase(supabase: any, setPassword?: string): Promise<{
  created: number;
  updated: number;
  passwords: { email: string; password: string }[];
  errors: string[];
}> {
  initFirebaseAdmin();

  const result = { created: 0, updated: 0, passwords: [] as { email: string; password: string }[], errors: [] as string[] };

  if (!supabase) {
    result.errors.push("Supabase client not configured");
    return result;
  }

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
    const pwd = setPassword || DEFAULT_PASSWORD;

    try {
      const existingUser = await admin.auth().getUserByEmail(profile.email).catch(() => null);

      if (existingUser) {
        await admin.auth().updateUser(existingUser.uid, {
          displayName: profile.nombre || profile.email.split("@")[0],
          password: setPassword ? pwd : undefined,
        });
        if (setPassword) result.passwords.push({ email: profile.email, password: pwd });
        result.updated++;
      } else {
        await admin.auth().createUser({
          email: profile.email,
          emailVerified: true,
          password: pwd,
          displayName: profile.nombre || profile.email.split("@")[0],
        });
        result.passwords.push({ email: profile.email, password: pwd });
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
  const uuid = crypto.randomUUID().replace(/-/g, '');
  let pwd = "";
  for (let i = 0; i < 16; i++) {
    pwd += chars.charAt(parseInt(uuid.substring(i * 2, i * 2 + 2), 16) % chars.length);
  }
  return pwd;
}
