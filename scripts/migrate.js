#!/usr/bin/env node
/* eslint-env node */
'use strict';

const fs = require('fs');
const path = require('path');

// Load .env manually (no dotenv dep required — just parse KEY=VALUE lines)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    });
}

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PROJECT_REF) {
  console.error('✖  Missing SUPABASE_PROJECT_REF in .env');
  process.exit(1);
}
if (!SERVICE_KEY) {
  console.error('✖  Missing SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const SQL_FILE = path.join(__dirname, '..', 'supabase', 'migrations', '002_push_tokens.sql');
if (!fs.existsSync(SQL_FILE)) {
  console.error('✖  Migration file not found:', SQL_FILE);
  process.exit(1);
}

const sql = fs.readFileSync(SQL_FILE, 'utf8');

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;

console.log(`→  Applying migration to project ${PROJECT_REF} …`);

(async () => {
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });
  } catch (err) {
    console.error('✖  Network error:', err.message);
    process.exit(1);
  }

  const text = await res.text();

  if (!res.ok) {
    console.error(`✖  Supabase API returned ${res.status}:`);
    console.error(text);
    console.error('');
    console.error('Note: This endpoint requires a Supabase Personal Access Token (PAT),');
    console.error('not the service role key. Generate one at:');
    console.error('  https://app.supabase.com/account/tokens');
    console.error('Then set SUPABASE_SERVICE_ROLE_KEY=<your-PAT> in .env');
    process.exit(1);
  }

  console.log('✔  Migration applied successfully.');
  if (text && text !== 'null' && text !== '[]') {
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      console.log(text);
    }
  }
})();
