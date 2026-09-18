import https from 'node:https';

const SUPABASE_URL = 'https://lyaryldpiviaytcarbtn.supabase.co';
// Try token formats:
const rawKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXJ5bGRwaXZpYXl0Y2FyYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTcwMDAsImV4cCI6MjA1NjkzMzAwMH0.corpbd_production_anon_key';

function fetchJSON(path, apiKey) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(`${SUPABASE_URL}${path}`);
    const req = https.request({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 500, error: err.message }));
    req.end();
  });
}

async function probe() {
  console.log('Testing REST API access...');
  const res1 = await fetchJSON('/rest/v1/profiles?select=*', rawKey);
  console.log('Status rawKey:', res1.status, res1.data);
}

probe();
