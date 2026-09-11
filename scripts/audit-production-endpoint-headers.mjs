import https from 'node:https';

function checkEndpoint(urlStr) {
  return new Promise((resolve) => {
    const parsed = new URL(urlStr);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Production-Audit-Agent/1.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url: urlStr,
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', (err) => resolve({ url: urlStr, error: err.message }));
    req.end();
  });
}

async function runAudit() {
  console.log('🌐 Auditing Production Vercel URL and Headers...\n');
  const prodUrl = 'https://crm-dashboard-l79s.vercel.app/';
  const result = await checkEndpoint(prodUrl);

  console.log(`Status Code: ${result.statusCode}`);
  console.log(`Headers:`);
  Object.entries(result.headers || {}).forEach(([k, v]) => {
    console.log(`  ${k}: ${v}`);
  });

  if (result.statusCode === 200 && result.body) {
    console.log('\n📄 Parsing assets from index.html:');
    const scriptMatches = [...result.body.matchAll(/src="(\/assets\/[^"]+)"/g)].map(m => m[1]);
    const cssMatches = [...result.body.matchAll(/href="(\/assets\/[^"]+)"/g)].map(m => m[1]);

    const allAssets = [...new Set([...scriptMatches, ...cssMatches])];
    console.log(`Found ${allAssets.length} assets:`, allAssets);

    for (const asset of allAssets) {
      const assetUrl = `https://crm-dashboard-l79s.vercel.app${asset}`;
      const assetRes = await checkEndpoint(assetUrl);
      console.log(`Asset ${asset}: HTTP ${assetRes.statusCode} (${assetRes.body ? assetRes.body.length : 0} bytes)`);

      // Check bundle for any service_role keys or private secret patterns
      if (assetRes.body) {
        if (assetRes.body.includes('SUPABASE_SERVICE_ROLE_KEY') || assetRes.body.includes('service_role')) {
          console.warn(`⚠️ Warning: Potential service_role string found in asset ${asset}`);
        }
      }
    }
  }

  console.log('\nAudit complete.');
}

runAudit().catch(console.error);
