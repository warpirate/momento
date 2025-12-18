// Direct fetch test to bypass Supabase client
const { readFileSync } = require('fs');

// Helper to read .env file manually
function readEnvFile() {
  try {
    const envFile = readFileSync('.env', 'utf8');
    const envVars = {};
    envFile.split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && values.length > 0) {
        envVars[key.trim()] = values.join('=').trim();
      }
    });
    return envVars;
  } catch (error) {
    console.error('Could not read .env file:', error.message);
    return {};
  }
}

// Get credentials
const env = readEnvFile();
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const functionUrl = `${supabaseUrl}/functions/v1/analyze-entry`;

async function testDirectFetch() {
  console.log('=== Direct Fetch Test ===');
  console.log('URL:', functionUrl);
  console.log('Key:', supabaseAnonKey.substring(0, 10) + '...\n');

  const testBody = {
    content: 'i wrot this entrie with some erors and it need fixing',
    mode: 'grammar'
  };

  console.log('Request body:', JSON.stringify(testBody, null, 2));

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBody)
    });

    console.log('\n--- Response ---');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('Response Body:', responseText);

    if (response.ok) {
      console.log('\n✅ Success!');
    } else {
      console.log('\n❌ Failed');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testDirectFetch();
