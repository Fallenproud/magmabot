#!/usr/bin/env node
/**
 * E2E Smoke Test — Channels UI
 *
 * Calls the config.schema RPC endpoint and verifies that
 * Telegram and WhatsApp channel forms render correctly
 * (i.e. their schemas exist and contain expected fields).
 *
 * Usage:  node scripts/smoke-channels.mjs
 * Exit:   0 = pass, 1 = fail
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- Load token from .env ----------
function loadToken() {
  if (process.env.MAGMABOT_TOKEN) return process.env.MAGMABOT_TOKEN;
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const m = line.match(/^MAGMABOT_TOKEN=(.+)$/);
      if (m) return m[1].trim();
    }
  }
  return 'magbot123';
}

const token = loadToken();
const port = process.env.MAGMABOT_PORT || 18789;
const baseUrl = `http://localhost:${port}`;

// ---------- Helpers ----------
let failures = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
  } else {
    console.error(`  ❌ ${label}`);
    failures++;
  }
}

// ---------- Tests ----------
async function run() {
  console.log(`\n🔥 MagmaBot Channels Smoke Test\n`);
  console.log(`Gateway: ${baseUrl}`);
  console.log(`Token:   ${token.slice(0, 4)}***\n`);

  // 1. Fetch config.schema
  console.log('1️⃣  Fetching config.schema...');
  let schema;
  try {
    const res = await fetch(`${baseUrl}/rpc`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'config.schema',
        params: {},
        id: 1,
      }),
    });
    assert(res.ok, `RPC responded ${res.status}`);
    const json = await res.json();
    assert(!json.error, 'No RPC error');
    schema = json.result;
  } catch (err) {
    console.error(`  ❌ Could not reach gateway: ${err.message}`);
    console.error('\n  Is the gateway running? Start it with magma-launch.bat\n');
    process.exit(1);
  }

  // 2. Verify channels list
  console.log('\n2️⃣  Checking channel list...');
  const channels = schema?.channels ?? [];
  const channelIds = channels.map(c => c.id);
  assert(channelIds.includes('telegram'), 'Telegram channel present');
  assert(channelIds.includes('whatsapp'), 'WhatsApp channel present');

  // 3. Telegram schema
  console.log('\n3️⃣  Validating Telegram config schema...');
  const telegram = channels.find(c => c.id === 'telegram');
  assert(!!telegram?.configSchema, 'Telegram has configSchema');
  if (telegram?.configSchema) {
    const props = telegram.configSchema.properties ?? {};
    const keys = Object.keys(props);
    assert(keys.length > 0, `Telegram schema has ${keys.length} field(s): ${keys.join(', ')}`);
  }

  // 4. WhatsApp schema
  console.log('\n4️⃣  Validating WhatsApp config schema...');
  const whatsapp = channels.find(c => c.id === 'whatsapp');
  assert(!!whatsapp?.configSchema, 'WhatsApp has configSchema');
  if (whatsapp?.configSchema) {
    const props = whatsapp.configSchema.properties ?? {};
    const keys = Object.keys(props);
    assert(keys.length > 0, `WhatsApp schema has ${keys.length} field(s): ${keys.join(', ')}`);
  }

  // 5. Summary
  console.log('\n' + '─'.repeat(40));
  if (failures === 0) {
    console.log('✅ All checks passed!\n');
    process.exit(0);
  } else {
    console.log(`❌ ${failures} check(s) failed.\n`);
    process.exit(1);
  }
}

run();
