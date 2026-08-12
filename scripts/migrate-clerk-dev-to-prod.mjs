/**
 * Migrate Clerk users: Development (sk_test) → Production (sk_live)
 * and remap Neon profile IDs (profiles.id = Clerk user id).
 *
 * Usage:
 *   1. In .env.local add:
 *        CLERK_SECRET_KEY_DEV=sk_test_...
 *        CLERK_SECRET_KEY_PROD=sk_live_...
 *      (or reuse CLERK_SECRET_KEY as DEV if it is still sk_test)
 *   2. Dry run:
 *        node --env-file=.env.local scripts/migrate-clerk-dev-to-prod.mjs
 *   3. Real run:
 *        node --env-file=.env.local scripts/migrate-clerk-dev-to-prod.mjs --apply
 *
 * Passwords are NOT copied (Clerk doesn't expose hashes via API).
 * Users must create/reset password on next login (flujo /crear-contrasena).
 */
import { createClerkClient } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");
const DEV_KEY = (() => {
  const named = process.env.CLERK_SECRET_KEY_DEV || "";
  if (named.startsWith("sk_test_")) return named;
  const fallback = process.env.CLERK_SECRET_KEY || "";
  if (fallback.startsWith("sk_test_")) return fallback;
  return "";
})();
const PROD_KEY = process.env.CLERK_SECRET_KEY_PROD || "";
const DATABASE_URL = process.env.DATABASE_URL || "";

if (!DEV_KEY) {
  console.error(
    "Falta secret de Development: CLERK_SECRET_KEY_DEV=sk_test_... o CLERK_SECRET_KEY=sk_test_..."
  );
  process.exit(1);
}
if (!PROD_KEY.startsWith("sk_live_")) {
  console.error("Falta CLERK_SECRET_KEY_PROD=sk_live_... (Secret Key de Production)");
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}

const dev = createClerkClient({ secretKey: DEV_KEY });
const prod = createClerkClient({ secretKey: PROD_KEY });
const sql = neon(DATABASE_URL);

async function listAllUsers(client) {
  const out = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const page = await client.users.getUserList({ limit, offset, orderBy: "-created_at" });
    const data = page.data || [];
    out.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return out;
}

function primaryEmail(user) {
  const primary = user.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId
  );
  return (
    primary?.emailAddress ||
    user.emailAddresses?.[0]?.emailAddress ||
    null
  );
}

async function findProdByEmail(email) {
  const res = await prod.users.getUserList({ emailAddress: [email], limit: 5 });
  return res.data?.[0] || null;
}

async function findProdByExternalId(externalId) {
  const res = await prod.users.getUserList({ externalId, limit: 5 });
  return res.data?.[0] || null;
}

async function remapProfileId(oldId, newId) {
  if (oldId === newId) return;
  const rows = await sql`select id from profiles where id = ${oldId} limit 1`;
  if (!rows[0]) return;

  // Clone profile under new Clerk id first (FK-safe), then repoint children, then drop old.
  const existingNew = await sql`select id from profiles where id = ${newId} limit 1`;
  if (!existingNew[0]) {
    await sql`
      insert into profiles (
        id, role, account_status, reviewed_at, reviewed_by,
        display_name, handle, tiktok_handle, category, followers, tiktok_followers,
        city, province, age, phone, brand_name, email,
        industry, company_location, contact_person, contact_channel,
        influencer_experience, goals, content_themes, platforms,
        avatar_url, onboarding_completed, created_at, updated_at
      )
      select
        ${newId}, role, account_status, reviewed_at, reviewed_by,
        display_name, handle, tiktok_handle, category, followers, tiktok_followers,
        city, province, age, phone, brand_name, email,
        industry, company_location, contact_person, contact_channel,
        influencer_experience, goals, content_themes, platforms,
        avatar_url, onboarding_completed, created_at, now()
      from profiles
      where id = ${oldId}
    `;
  }

  await sql`update events set brand_id = ${newId} where brand_id = ${oldId}`;
  await sql`update applications set creator_id = ${newId} where creator_id = ${oldId}`;
  await sql`update creator_posts set creator_id = ${newId} where creator_id = ${oldId}`;
  await sql`update profiles set reviewed_by = ${newId} where reviewed_by = ${oldId}`;
  await sql`delete from profiles where id = ${oldId}`;
}

async function main() {
  console.log(APPLY ? "MODE: APPLY (escribe cambios)" : "MODE: DRY-RUN (no escribe)");
  console.log("Listando users Development…");
  const devUsers = await listAllUsers(dev);
  console.log(`Dev users: ${devUsers.length}`);

  console.log("Listando users Production…");
  const prodUsers = await listAllUsers(prod);
  console.log(`Prod users (antes): ${prodUsers.length}`);

  const results = {
    created: 0,
    existed: 0,
    remapped: 0,
    skipped: 0,
    errors: [],
  };

  for (const [i, user] of devUsers.entries()) {
    const email = primaryEmail(user);
    const label = email || user.id;
    process.stdout.write(`[${i + 1}/${devUsers.length}] ${label} … `);

    if (!email) {
      console.log("SKIP (sin email)");
      results.skipped++;
      continue;
    }

    try {
      let target =
        (await findProdByExternalId(user.id)) ||
        (await findProdByEmail(email));

      if (!target) {
        if (!APPLY) {
          console.log("WOULD CREATE");
          results.created++;
          continue;
        }
        target = await prod.users.createUser({
          emailAddress: [email],
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          externalId: user.id,
          skipPasswordChecks: true,
          skipPasswordRequirement: true,
          publicMetadata: user.publicMetadata || {},
          privateMetadata: user.privateMetadata || {},
          unsafeMetadata: {
            ...(user.unsafeMetadata || {}),
            migratedFromDevId: user.id,
          },
        });
        console.log(`CREATED → ${target.id}`);
        results.created++;
      } else {
        console.log(`EXISTS → ${target.id}`);
        results.existed++;
        if (APPLY && target.externalId !== user.id) {
          try {
            await prod.users.updateUser(target.id, { externalId: user.id });
          } catch {
            /* ignore if conflict */
          }
        }
      }

      if (!APPLY) {
        results.remapped++;
        continue;
      }

      const profile = await sql`select id from profiles where id = ${user.id} limit 1`;
      if (profile[0] && profile[0].id !== target.id) {
        await remapProfileId(user.id, target.id);
        console.log(`  remapped DB ${user.id.slice(0, 10)}… → ${target.id.slice(0, 10)}…`);
        results.remapped++;
      } else if (!profile[0]) {
        // Profile might already be under new id, or missing
        const byNew = await sql`select id from profiles where id = ${target.id} limit 1`;
        if (!byNew[0]) {
          // Try match by email and remap that row's id
          const byEmail = await sql`
            select id from profiles
            where lower(coalesce(email,'')) = ${email.toLowerCase()}
            limit 1
          `;
          if (byEmail[0] && byEmail[0].id !== target.id) {
            await remapProfileId(byEmail[0].id, target.id);
            console.log(`  remapped by email → ${target.id.slice(0, 10)}…`);
            results.remapped++;
          }
        }
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || String(err);
      console.log(`ERROR: ${msg}`);
      results.errors.push({ email, msg });
    }

    // gentle pacing for Clerk rate limits
    await new Promise((r) => setTimeout(r, APPLY ? 120 : 20));
  }

  console.log("\n=== RESUMEN ===");
  console.log(results);
  if (!APPLY) {
    console.log("\nPara aplicar de verdad:");
    console.log("  node --env-file=.env.local scripts/migrate-clerk-dev-to-prod.mjs --apply");
  } else {
    console.log("\nListo. Los usuarios deben crear/recuperar contraseña en el próximo login.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
