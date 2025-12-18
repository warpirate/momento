// Test script to call the analyze-entry Edge Function directly
// Run with: node scripts/test-ai-enhance.cjs

console.log('=== SCRIPT STARTED ===');

try {
  console.log('Loading modules...');
  const { createClient } = require('@supabase/supabase-js');
  const { readFileSync } = require('fs');
  console.log('Modules loaded successfully');

  // Helper to read .env file manually
  function readEnvFile() {
    console.log('Reading .env file...');
    try {
      const envFile = readFileSync('.env', 'utf8');
      console.log('.env file read, length:', envFile.length);
      const envVars = {};
      envFile.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
          envVars[key.trim()] = values.join('=').trim();
        }
      });
      console.log('Parsed env vars:', Object.keys(envVars));
      return envVars;
    } catch (error) {
      console.error('Could not read .env file:', error.message);
      return {};
    }
  }

  // Get Supabase URL and anon key
  const env = readEnvFile();
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;

  console.log('\nEnvironment check:');
  console.log('Found env vars:', Object.keys(env).filter(k => k.includes('SUPABASE')));

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('\nMissing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
    console.log('Make sure your .env file contains:');
    console.log('SUPABASE_URL=your_project_url');
    console.log('SUPABASE_ANON_KEY=your_anon_key');
    process.exit(1);
  }

  console.log('\nSupabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey.substring(0, 10) + '...');

  // Create Supabase client
  console.log('\nCreating Supabase client...');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('Supabase client created');

  // Test cases
  const testCases = [
    {
      name: 'Grammar fix',
      content: 'i wrot this entrie with some erors and it need fixing',
      mode: 'grammar'
    },
    {
      name: 'Make clearer',
      content: 'The thing happened because of the stuff that was going on and then I felt something about it.',
      mode: 'clearer'
    },
    {
      name: 'Shorten',
      content: 'I went to the store and then I walked around and looked at many different items on the shelves before finally deciding to buy some groceries that I needed for dinner.',
      mode: 'shorten'
    },
    {
      name: 'Expand',
      content: 'I had a good day.',
      mode: 'expand'
    }
  ];

  async function testEnhanceFunction() {
    console.log('\n=== Testing AI Enhance Edge Function ===\n');

    for (const testCase of testCases) {
      console.log(`\n--- Test: ${testCase.name} (${testCase.mode}) ---`);
      console.log('Input:', testCase.content);
      
      try {
        console.log('Invoking function...');
        const { data, error } = await supabase.functions.invoke('analyze-entry', {
          body: {
            content: testCase.content,
            mode: testCase.mode
          }
        });
        // If we have an error with context, try to read the response body
        if (error && error.context && error.context.body) {
          console.log('Reading error response body...');
          try {
            const errorText = await error.context.text();
            console.log('Error response body:', errorText);
          } catch (e) {
            console.log('Could not read error body:', e.message);
          }
        }
        
        console.log('Function returned:', { data, error });

        if (error) {
          console.error('❌ Function error:', error);
          if (error.context) {
            console.error('Error context status:', error.context.status);
            console.error('Error context statusText:', error.context.statusText);
          }
          continue;
        }

        if (data?.success && data?.enhanced) {
          console.log('✅ Success!');
          console.log('Enhanced:', data.enhanced);
        } else {
          console.error('❌ Invalid response:', data);
        }
      } catch (err) {
        console.error('❌ Unexpected error:', err.message);
        console.error('Full error:', err);
      }
    }
  }

  // Run the test
  console.log('\nStarting test function...');
  testEnhanceFunction().then(() => {
    console.log('\n=== TEST COMPLETED ===');
  }).catch(err => {
    console.error('\n=== TEST FAILED ===', err);
  });

} catch (err) {
  console.error('=== SCRIPT ERROR ===', err);
  console.error('Stack:', err.stack);
}