-- Create storage bucket for lesson PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('lesson-pdfs', 'lesson-pdfs', true);

-- Allow authenticated users to read PDFs
CREATE POLICY "Anyone can view lesson PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-pdfs');

-- Allow admins to upload PDFs
CREATE POLICY "Admins can upload lesson PDFs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-pdfs' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to update PDFs
CREATE POLICY "Admins can update lesson PDFs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-pdfs' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete PDFs
CREATE POLICY "Admins can delete lesson PDFs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-pdfs' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Add pdf_urls column to lesson_content
ALTER TABLE public.lesson_content 
ADD COLUMN pdf_urls text[] DEFAULT '{}'::text[];