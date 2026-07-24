import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const envFile = fs.readFileSync('e:/Gatezly/gatezly-portal/.env.local', 'utf-8');
const env = Object.fromEntries(envFile.split('\n').filter(l => l.includes('=')).map(l => {
  const parts = l.split('=');
  return [parts[0].trim(), parts.slice(1).join('=').trim().replace(/"/g, '')];
}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  // Query PostgREST OpenAPI to get all tables
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
    headers: { 'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
  });
  const data = await res.json();
  console.log('Tables:', Object.keys(data.definitions || {}));
}
test();
