import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
const port = 18789;

async function checkSchema() {
  const response = await fetch(`http://localhost:${port}/rpc`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'config.schema',
      params: {},
      id: 1
    })
  });

  const data = await response.json();
  if (data.error) {
    console.error('Error:', data.error);
    return;
  }

  const channels = data.result.channels;
  console.log('Channels in schema:', channels.map(c => c.id));
  
  const telegram = channels.find(c => c.id === 'telegram');
  console.log('Telegram schema exists:', !!telegram?.configSchema);
  
  const whatsapp = channels.find(c => c.id === 'whatsapp');
  console.log('WhatsApp schema exists:', !!whatsapp?.configSchema);
}

checkSchema().catch(console.error);
