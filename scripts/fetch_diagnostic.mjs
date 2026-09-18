const https = require('https');

function fetchDiagnostic() {
  const url = 'https://crm-dashboard-l79s.vercel.app/api/auth/diagnostic';
  console.log(`Fetching ${url}...`);

  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('BODY:', data);
      }
    });
  }).on('error', (err) => {
    console.error('Error:', err.message);
  });
}

fetchDiagnostic();
