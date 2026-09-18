const https = require('https');

const SUPABASE_URL = 'https://lyaryldpiviaytcarbtn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXJ5bGRwaXZpYXl0Y2FyYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTcwMDAsImV4cCI6MjA1NjkzMzAwMH0.corpbd_production_anon_key';

function postJSON(path, body) {
  return new Promise((resolve) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const dataStr = JSON.stringify(body);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataStr)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    req.write(dataStr);
    req.end();
  });
}

async function testAuth() {
  console.log('Testing authentication endpoint...');
  const res = await postJSON('/auth/v1/token?grant_type=password', {
    email: 'devika.p@rajmudragroup.com',
    password: 'Password123!'
  });
  console.log('Response status:', res.status);
  console.log('Response data:', JSON.stringify(res.data, null, 2));
}

testAuth();
