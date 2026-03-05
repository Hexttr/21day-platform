/**
 * Supabase client and types.
 * Re-exports from integrations for consistent import path.
 */
export { supabase } from '@/integrations/supabase/client';
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  Json,
  Constants,
} from '@/integrations/supabase/types';
