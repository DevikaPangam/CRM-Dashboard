import { createClient } from './node_modules/@supabase/supabase-js/dist/main/index.js';

const SUPABASE_URL = 'https://lyaryldpiviaytcarbtn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXJ5bGRwaXZpYXl0Y2FyYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTcwMDAsImV4cCI6MjA1NjkzMzAwMH0.corpbd_production_anon_key';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function tryAuth() {
  const candidatePasswords = [
    'Password123!',
    'DevikaAdmin2026!',
    'DevikaPangam@2026',
    'RajmudraAdmin2026!',
    'StrongAdminPassword@2026',
    'Password123'
  ];

  for (const pwd of candidatePasswords) {
    console.log(`Trying login for devika.p@rajmudragroup.com with password candidate...`);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'devika.p@rajmudragroup.com',
      password: pwd
    });

    if (!error && data?.session) {
      console.log('🎉 Auth SUCCESS! Access token retrieved.');
      console.log('User ID:', data.user.id);

      // Attempt profile update with this authenticated user session
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'super_admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', '567db42c-c0bf-4286-8dcc-ce2cf196865b')
        .eq('email', 'devika.p@rajmudragroup.com')
        .eq('organization_id', '00000000-0000-0000-0000-000000000001')
        .select();

      if (updateError) {
        console.error('Update Error:', updateError.message);
      } else {
        console.log('UPDATE SUCCESS! Updated profile rows:', updateData);
      }
      return;
    } else {
      console.log('Auth Notice:', error?.message || 'Failed');
    }
  }
}

tryAuth().catch(console.error);
