-- Add is_blocked column to profiles
ALTER TABLE public.profiles 
ADD COLUMN is_blocked boolean NOT NULL DEFAULT false;

-- Add blocked_at column to track when user was blocked
ALTER TABLE public.profiles 
ADD COLUMN blocked_at timestamp with time zone;