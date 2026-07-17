import { createClient, createAdminClient } from "@insforge/sdk";

const baseUrl = process.env.INSFORGE_BASE_URL || "";
const anonKey = process.env.INSFORGE_ANON_KEY || "";
const apiKey = process.env.INSFORGE_API_KEY || "";

export const insforge = createClient({ baseUrl, anonKey });
export const insforgeAdmin = apiKey ? createAdminClient({ baseUrl, apiKey }) : null;
