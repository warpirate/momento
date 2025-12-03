import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase environment variables are missing. Create a .env file based on env.example.',
  );
}

// Use the Supabase URL directly without any protocol manipulation
const supabaseUrl = SUPABASE_URL.startsWith('http')
  ? SUPABASE_URL
  : `https://${SUPABASE_URL}`;

export const supabase = createClient(supabaseUrl, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function uploadFile(uri: string, bucket: string, path: string) {
  try {
    console.log('Starting file upload:', { uri, bucket, path });
    
    // Ensure URI is properly formatted for React Native
    const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
    
    // Create a proper array buffer from the file URI
    const response = await fetch(fileUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('File blob created, size:', blob.size);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        upsert: true,
        contentType: blob.type || 'image/jpeg',
      });

    if (error) {
      console.error('Supabase storage error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    console.log('File uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

