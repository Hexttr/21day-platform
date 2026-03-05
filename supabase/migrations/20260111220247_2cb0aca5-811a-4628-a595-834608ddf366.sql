-- Add AI prompt field to lesson_content table
ALTER TABLE public.lesson_content 
ADD COLUMN ai_prompt text DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.lesson_content.ai_prompt IS 'Custom prompt for AI quiz tutor - defines what the AI should teach for this lesson';