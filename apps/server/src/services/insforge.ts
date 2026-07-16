import { createClient } from "@insforge/sdk";

const baseUrl = process.env.INSFORGE_BASE_URL || "";
const anonKey = process.env.INSFORGE_ANON_KEY || "";

export const insforge = createClient({ baseUrl, anonKey });
