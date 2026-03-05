-- Создаём таблицу для записи в следующий поток
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('telegram', 'phone')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Политика для вставки (любой может записаться)
CREATE POLICY "Anyone can insert into waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (true);

-- Политика для чтения (только админы)
CREATE POLICY "Only admins can view waitlist" 
ON public.waitlist 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);