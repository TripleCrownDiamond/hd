/**
 * create-admin.mjs
 * Crée ou met à jour le compte admin dans Supabase et lui assigne le rôle "admin".
 * Usage : node scripts/create-admin.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Lire .env.local
const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
const get = (key) => {
  const m = env.match(new RegExp(`^${key}=(.+)`, "m"));
  return m ? m[1].trim() : null;
};

const SUPABASE_URL = get("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = get("SUPABASE_SECRET_KEY");

const ADMIN_EMAIL = "admin@holzdirekt.store";
const ADMIN_PASSWORD = "Azerty%1234#1234";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SECRET_KEY manquant dans .env.local");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${SERVICE_KEY}`,
  "apikey": SERVICE_KEY,
};

// 1. Chercher si l'utilisateur existe déjà
async function findUser(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, { headers });
  const data = await res.json();
  return data.users?.[0] ?? null;
}

// 2. Créer l'utilisateur
async function createUser(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Création échouée: ${JSON.stringify(data)}`);
  return data;
}

// 3. Mettre à jour le mot de passe d'un utilisateur existant
async function updatePassword(userId, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`MàJ mot de passe échouée: ${JSON.stringify(data)}`);
  return data;
}

// 4. Assigner le rôle admin dans user_roles
async function assignRole(userId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
    method: "POST",
    headers: {
      ...headers,
      "Prefer": "resolution=merge-duplicates",
    },
    body: JSON.stringify({ profile_id: userId, role: "admin" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Rôle non assigné: ${text}`);
  }
}

async function main() {
  console.log(`\n🔧 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📧 Email admin : ${ADMIN_EMAIL}\n`);

  let user = await findUser(ADMIN_EMAIL);

  if (user) {
    console.log(`ℹ️  Utilisateur existant trouvé: ${user.id}`);
    console.log(`🔑 Mise à jour du mot de passe...`);
    await updatePassword(user.id, ADMIN_PASSWORD);
    console.log(`✅ Mot de passe mis à jour.`);
  } else {
    console.log(`➕ Création du compte admin...`);
    user = await createUser(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log(`✅ Compte créé: ${user.id}`);
  }

  console.log(`🎭 Attribution du rôle "admin"...`);
  await assignRole(user.id);
  console.log(`✅ Rôle admin attribué.\n`);

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Compte admin prêt !`);
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  console.log(`   URL      : ${SUPABASE_URL.replace("https://", "https://").split(".")[0].split("//")[1]}.supabase.co/project/...`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch((e) => {
  console.error("❌ Erreur:", e.message);
  process.exit(1);
});
