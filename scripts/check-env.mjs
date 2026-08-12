#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const required = [
  "DATABASE_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local — copy .env.local.example");
  process.exit(1);
}

const raw = fs.readFileSync(envPath, "utf8");
const values = {};
for (const line of raw.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) values[m[1].trim()] = m[2].trim();
}

let ok = true;
for (const key of required) {
  const v = values[key] || process.env[key];
  if (
    !v ||
    v.includes("placeholder") ||
    v.includes("xxx") ||
    v.includes("user:pass@ep-")
  ) {
    console.error(`✗ ${key} is missing or still a placeholder`);
    ok = false;
  } else {
    console.log(`✓ ${key}`);
  }
}

if (!ok) {
  console.error("\nSee DEPLOY.md for Neon + Clerk setup");
  process.exit(1);
}
console.log("\nEnv looks ready. Run: npm run dev");
