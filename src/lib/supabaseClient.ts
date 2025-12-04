import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@env';
import * as RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';

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
    
    // Strip file:// prefix for RNFS on Android as it expects an absolute path
    let fileUri = uri;
    if (Platform.OS === 'android' && fileUri.startsWith('file://')) {
      fileUri = fileUri.slice(7);
    }

    // Read file as base64
    const base64 = await RNFS.readFile(fileUri, 'base64');
    
    // Convert to ArrayBuffer
    const arrayBuffer = decode(base64);
    
    console.log('File read successfully, size:', arrayBuffer.byteLength);
    
    // Determine content type based on extension
    const extension = uri.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg';
    else if (extension === 'png') contentType = 'image/png';
    else if (extension === 'gif') contentType = 'image/gif';
    else if (extension === 'webp') contentType = 'image/webp';
    else if (extension === 'm4a') contentType = 'audio/m4a';
    else if (extension === 'mp4') contentType = 'audio/mp4'; // Treat mp4 as audio for voice notes
    else if (extension === 'mov') contentType = 'video/quicktime';
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        upsert: true,
        contentType: contentType,
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

