const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const supabaseUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const supabaseKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@balik.in',
    password: 'admin1234'
  });

  if (authError) {
    console.error('Login error:', authError);
    return;
  }

  const userId = authData.user.id;
  console.log('Logged in as:', userId);

  const { data: items, error: itemsError } = await supabase.from('items').insert([
    { 
      user_id: userId, 
      item_name: 'MacBook Pro M2', 
      item_category: 'elektronik', 
      item_description: 'Laptop kerja dengan stiker Balik.in',
      qr_code: 'MAC-12345-' + Date.now(),
      status: 'active',
      is_active: true,
      reward_offered: true,
      reward_amount: 500000,
      contact_preference: 'chat',
      total_scans: 0
    }
  ]).select();

  if (itemsError) {
    console.error('Insert error:', itemsError);
  } else {
    console.log('Inserted items successfully:', items);
  }
}

run();
