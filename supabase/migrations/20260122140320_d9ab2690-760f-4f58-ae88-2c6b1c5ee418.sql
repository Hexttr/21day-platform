-- Create invitation codes table
CREATE TABLE public.invitation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  comment text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage codes
CREATE POLICY "Admins can do everything with invitation codes"
ON public.invitation_codes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can check if code exists (for registration)
CREATE POLICY "Anyone can check active codes"
ON public.invitation_codes
FOR SELECT
USING (is_active = true);

-- Add invitation_code_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN invitation_code_id uuid REFERENCES public.invitation_codes(id);

-- Trigger for updated_at
CREATE TRIGGER update_invitation_codes_updated_at
BEFORE UPDATE ON public.invitation_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();