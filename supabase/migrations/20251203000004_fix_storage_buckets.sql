-- Migration: Fix Storage Buckets and Policies
-- This migration ensures storage buckets exist and have proper policies

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================

-- Create images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('images', 'images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Create voice-notes bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('voice-notes', 'voice-notes', true, 52428800, ARRAY['audio/mpeg', 'audio/mp4', 'audio/quicktime', 'audio/wav', 'audio/m4a'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['audio/mpeg', 'audio/mp4', 'audio/quicktime', 'audio/wav', 'audio/m4a'];

-- ============================================================================
-- 2. STORAGE POLICIES
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;

-- Images bucket policies
CREATE POLICY "Users can view images" ON storage.objects FOR SELECT
USING (bucket_id = 'images' AND (auth.role() = 'anon' OR auth.role() = 'authenticated'));

CREATE POLICY "Users can upload images" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their images" ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their images" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Voice notes bucket policies
CREATE POLICY "Users can view voice notes" ON storage.objects FOR SELECT
USING (bucket_id = 'voice-notes' AND (auth.role() = 'anon' OR auth.role() = 'authenticated'));

CREATE POLICY "Users can upload voice notes" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voice-notes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their voice notes" ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'voice-notes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their voice notes" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'voice-notes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- 3. GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on storage schema
GRANT USAGE ON SCHEMA storage TO authenticated, anon;

-- Grant all permissions on buckets
GRANT ALL ON storage.buckets TO authenticated, anon;

-- Grant all permissions on objects
GRANT ALL ON storage.objects TO authenticated, anon;
