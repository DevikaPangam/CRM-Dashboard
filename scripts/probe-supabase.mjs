import https from 'node:https';

const url = 'https://lyaryldpiviaytcarbtn.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXJ5bGRwaXZpYXl0Y2FyYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTcwMDAsImV4cCI6MjA1NjkzMzAwMH0.corpbd_production_anon_key';

https.get(url, (res) => {
  let data = '';
  res.on('data', (c) => (data += c));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Body:', data.slice(0, 500));
  });
}).on('error', console.error);
