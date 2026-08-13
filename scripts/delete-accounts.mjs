#!/usr/bin/env node
/**
 * Delete Supabase accounts interactively.
 *
 * Usage:
 *   node scripts/delete-accounts.mjs            # list accounts only
 *   node scripts/delete-accounts.mjs --list     # list accounts only
 *   node scripts/delete-accounts.mjs <email...> # delete specific emails
 *   node scripts/delete-accounts.mjs --all-test # delete test-/cdtest-/final- test accounts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import pg from "pg";

const ROOT = process.cwd();
const ENV_FILE = resolve(ROOT, ".env.local");

function loadEnv() {
  const vars = {};
  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  if (!vars.DATABASE_URL) {
    console.error("DATABASE_URL not found in .env.local");
    process.exit(1);
  }
  return vars;
}

async function listAccounts(pool) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.name, u."createdAt",
            (SELECT count(*) FROM users p WHERE p.id = u.id) AS has_profile
     FROM "user" u ORDER BY u."createdAt"`
  );
  return rows;
}

async function accountDataCounts(pool, email) {
  const { rows } = await pool.query(
    `SELECT
      (SELECT count(*) FROM users p WHERE p.email = $1) AS profile,
      (SELECT count(*) FROM workspaces w JOIN users p ON p.id = w.user_id WHERE p.email = $1) AS workspaces,
      (SELECT count(*) FROM tasks t JOIN users p ON p.id = t.user_id WHERE p.email = $1) AS tasks,
      (SELECT count(*) FROM habits h JOIN users p ON p.id = h.user_id WHERE p.email = $1) AS habits,
      (SELECT count(*) FROM session s JOIN "user" u ON u.id = s."userId" WHERE u.email = $1) AS sessions`,
    [email]
  );
  return rows[0];
}

function confirm(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolvePromise) => {
    rl.question(`${prompt} (y/N) `, (ans) => {
      rl.close();
      resolvePromise(ans.trim().toLowerCase() === "y");
    });
  });
}

async function deleteAccount(pool, email, dryRun) {
  if (dryRun) {
    const counts = await accountDataCounts(pool, email);
    console.log(`  would delete "${email}":`, JSON.stringify(counts));
    return;
  }
  const delUser = await pool.query(`DELETE FROM "user" WHERE email = $1`, [email]);
  await pool.query(`DELETE FROM users WHERE email = $1`, [email]);
  console.log(`  deleted "${email}" (${delUser.rowCount} auth record)`);
}

async function main() {
  const args = process.argv.slice(2);
  const env = loadEnv();
  const pool = new pg.Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    const accounts = await listAccounts(pool);
    if (accounts.length === 0) {
      console.log("No accounts found.");
      return;
    }

    const testPattern = /^(test-|cdtest-|final-).*@example\.com$/;
    const testAccounts = accounts.filter((a) => testPattern.test(a.email));
    const wantAllTest = args.includes("--all-test");

    if (wantAllTest || args.length === 0 || args.includes("--list")) {
      console.log("\nAccounts:");
      accounts.forEach((a) => console.log(`  ${a.email}  (created ${a.createdAt?.toISOString?.() ?? a.createdAt})`));
      if (args.includes("--list")) return;

      if (testAccounts.length > 0 && (wantAllTest || args.length === 0)) {
        const answer = await confirm(
          `\nDelete ${testAccounts.length} test account(s): ${testAccounts.map((a) => a.email).join(", ")}?`
        );
        if (!answer) {
          console.log("Nothing deleted.");
          return;
        }
        await pool.query("BEGIN");
        for (const a of testAccounts) await deleteAccount(pool, a.email, false);
        await pool.query("COMMIT");
        console.log("Done.");
        return;
      }
      return;
    }

    const emails = args.filter((a) => !a.startsWith("--"));
    if (emails.length === 0) {
      console.log("No emails provided. Usage: node scripts/delete-accounts.mjs <email...>");
      return;
    }

    const missing = emails.filter((e) => !accounts.some((a) => a.email === e));
    if (missing.length > 0) {
      console.error(`Not found: ${missing.join(", ")}`);
      return;
    }

    console.log("\nDry run — nothing deleted yet:");
    for (const e of emails) await deleteAccount(pool, e, true);

    const answer = await confirm(`\nDelete ${emails.length} account(s) permanently?`);
    if (!answer) {
      console.log("Aborted. Nothing deleted.");
      return;
    }
    await pool.query("BEGIN");
    for (const e of emails) await deleteAccount(pool, e, false);
    await pool.query("COMMIT");
    console.log("Done.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
