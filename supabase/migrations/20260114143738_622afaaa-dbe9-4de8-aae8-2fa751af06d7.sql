-- Create table for practical materials (one video per material)
CREATE TABLE public.practical_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.practical_materials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can do everything with practical materials"
ON public.practical_materials
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone authenticated can read published materials"
ON public.practical_materials
FOR SELECT
USING (is_published = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_practical_materials_updated_at
BEFORE UPDATE ON public.practical_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();