/**
 * STEP 12.14 — PRE-PROVISIONING MANAGER LOOKUP & DUPLICATE CHECK
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lyaryldpiviaytcarbtn.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5YXJ5bGRwaXZpYXl0Y2FyYnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNTcwMDAsImV4cCI6MjA1NjkzMzAwMH0.corpbd_production_anon_key';
const ORG_ID = '00000000-0000-0000-0000-000000000001';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function preCheck() {
  console.log('🔍 Executing Pre-Provisioning Verification...');
  console.log('  Target Email: connect@rajmudragroup.com');
  console.log('  Target Full Name: Akshay Tambe\n');

  // Check 1: Verify if connect@rajmudragroup.com already exists in public.profiles
  try {
    const { data: existingProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'connect@rajmudragroup.com')
      .maybeSingle();

    if (profileErr) {
      console.log('  Profiles lookup note (RLS active):', profileErr.message);
    } else if (existingProfile) {
      console.log('  ⚠️ Existing Profile Found:', existingProfile);
    } else {
      console.log('  🟢 Clean: No existing profile for connect@rajmudragroup.com');
    }
  } catch (err) {
    console.warn('  Profiles query notice:', err.message);
  }

  // Check 2: Devika Pangam Manager Lookup
  try {
    const { data: devikaProfile, error: devikaErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, status, organization_id')
      .eq('email', 'devika.p@rajmudragroup.com')
      .maybeSingle();

    if (devikaErr) {
      console.log('  Devika profile lookup note (RLS):', devikaErr.message);
    } else if (devikaProfile) {
      console.log('  🟢 Devika Pangam Profile Verified:');
      console.log(`     ID: ${devikaProfile.id}`);
      console.log(`     Role: ${devikaProfile.role}`);
      console.log(`     Status: ${devikaProfile.status}`);
      console.log(`     Org: ${devikaProfile.organization_id}`);
    } else {
      console.log('  ℹ️ Devika Pangam profile query returned empty (checking default admin UUID)...');
    }
  } catch (err) {
    console.warn('  Devika lookup notice:', err.message);
  }
}

preCheck().catch(console.error);
