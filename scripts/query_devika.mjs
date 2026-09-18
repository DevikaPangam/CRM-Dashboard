import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'devika.p@rajmudragroup.com');

  if (error) {
    console.error('Error fetching Devika profile:', error);
  } else {
    console.log('Devika Profiles:', profiles);
  }
}

main();
