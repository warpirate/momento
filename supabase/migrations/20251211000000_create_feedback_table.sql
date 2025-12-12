-- Create feedback table to store user feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general', 'improvement')),
  title text NOT NULL,
  content text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  device_info jsonb,
  app_version text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON public.feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER handle_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.feedback IS 'Stores user feedback for the app';
COMMENT ON COLUMN public.feedback.feedback_type IS 'Type of feedback: bug, feature, general, or improvement';
COMMENT ON COLUMN public.feedback.rating IS 'Optional rating from 1-5 stars';
COMMENT ON COLUMN public.feedback.device_info IS 'JSON object containing device information';