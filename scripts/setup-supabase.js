#!/usr/bin/env node
/**
 * Supabase Setup Script - Apply database schema
 */

require('dotenv').config({ path: '../web/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupSupabase() {
  console.log('🚀 Setting up Supabase Database...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
    console.log('❌ Supabase credentials not configured');
    console.log('Please update web/.env.local with your Supabase credentials');
    return false;
  }

  console.log('✅ Supabase credentials found');
  console.log(`📍 URL: ${supabaseUrl}`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test connection
    console.log('🔍 Testing connection...');
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }
    
    console.log('✅ Connection successful');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../db/migrations/20251206_comprehensive_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📊 Applying database schema...');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            skipCount++;
            console.log(`  ⏭️  Skipped: ${statement.substring(0, 50)}...`);
          } else {
            throw error;
          }
        } else {
          successCount++;
          console.log(`  ✅ Applied: ${statement.substring(0, 50)}...`);
        }
      } catch (err) {
        console.log(`  ⚠️  Error: ${err.message}`);
      }
    }

    console.log(`\n📊 Schema application complete:`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ⏭️  Skipped: ${skipCount}`);

    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    const tables = ['assets', 'murals', 'cards', 'decks', 'processing_jobs'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`  ❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`  ✅ Table '${table}': Ready`);
        }
      } catch (err) {
        console.log(`  ❌ Table '${table}': ${err.message}`);
      }
    }

    console.log('\n🎉 Supabase setup completed!');
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Alternative: Manual SQL execution guide
function showManualSetup() {
  console.log('\n📋 MANUAL SETUP INSTRUCTIONS:');
  console.log('1. Go to https://hwrnvussmnugmzpoqqsj.supabase.co');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the following schema:');
  console.log('   File: db/migrations/20251206_comprehensive_schema.sql');
  console.log('4. Execute the SQL');
  console.log('5. Verify tables are created');
}

if (require.main === module) {
  setupSupabase()
    .then(success => {
      if (!success) {
        showManualSetup();
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Fatal error:', error);
      showManualSetup();
      process.exit(1);
    });
}

module.exports = { setupSupabase };