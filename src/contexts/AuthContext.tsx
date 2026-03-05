import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSessionReady: boolean; // Flag to indicate session is fully stabilized for RLS queries
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string, invitationCode: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  validateInvitationCode: (code: string) => Promise<{ valid: boolean; codeId?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false); // Session stabilization flag
  
  // Ref to track if we're in the middle of a signIn (checking blocked status)
  const isCheckingBlockedRef = useRef(false);

  const clearSession = () => {
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setIsSessionReady(false);
    setIsLoading(false);
  };

  // Helper to check admin role
  const checkAdminRole = async (userId: string) => {
    console.log('[Auth] Checking admin role for user:', userId);
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .limit(1);
    
    console.log('[Auth] Admin role check result:', { data, error, isAdmin: data && data.length > 0 });
    setIsAdmin(!!data && data.length > 0);
  };

  useEffect(() => {
    console.log('[Auth] Setting up auth listener...');
    let isMounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] onAuthStateChange:', event, 'session:', !!session, 'userId:', session?.user?.id, 'isCheckingBlocked:', isCheckingBlockedRef.current);
        
        if (!isMounted) return;
        
        // If we're checking blocked status, ignore SIGNED_IN events
        // We'll update the session manually after the check completes
        if (isCheckingBlockedRef.current && event === 'SIGNED_IN') {
          console.log('[Auth] Ignoring SIGNED_IN during blocked check');
          return;
        }
        
        // Only clear session on explicit SIGNED_OUT
        if (event === 'SIGNED_OUT') {
          console.log('[Auth] SIGNED_OUT event received, clearing session');
          clearSession();
          return;
        }

        // For all other events, update session if we have one
        // DO NOT set isSessionReady here - let initSession() handle it
        if (session) {
          console.log('[Auth] Updating session from event:', event);
          setSession(session);
          setUser(session.user);
          setIsLoading(false);
          // Check admin role asynchronously (non-blocking)
          setTimeout(() => checkAdminRole(session.user.id), 0);
        } else if (event === 'INITIAL_SESSION') {
          // No session on initial load is normal for unauthenticated users
          // CRITICAL: Still set isSessionReady so data can load!
          console.log('[Auth] No session on INITIAL_SESSION - user not logged in, marking ready');
          setIsSessionReady(true);
          setIsLoading(false);
        }
        // For other events without session (like TOKEN_REFRESHED failure), don't clear
        // Let the app continue with potentially stale data until explicit sign out
      }
    );

    // THEN check for existing session with retry logic for AbortError
    const initSession = async (retryCount = 0) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 200;
      
      try {
        console.log('[Auth] Initializing Supabase auth... (attempt', retryCount + 1, ')');
        
        // Wait for Supabase Auth to fully initialize (including Web Locks)
        // This prevents AbortError by ensuring locks are acquired before any queries
        const { error: initError } = await supabase.auth.initialize();
        
        if (initError) {
          console.error('[Auth] Initialize error:', initError.message);
        }
        
        console.log('[Auth] Auth initialized, getting session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('[Auth] getSession result:', 'session:', !!session, 'userId:', session?.user?.id, 'error:', error?.message);
        
        if (!isMounted) return;
        
        // If there's an error getting session, log but don't immediately clear
        if (error) {
          console.error('[Auth] Session error:', error.message);
          // Only clear if it's a fatal error
          if (error.message.includes('invalid') || error.message.includes('expired')) {
            clearSession();
          } else {
            setIsLoading(false);
            setIsSessionReady(true); // Still mark ready so app can proceed
          }
          return;
        }

        if (session) {
          console.log('[Auth] Found existing session for:', session.user.email);
          setSession(session);
          setUser(session.user);
          // Check admin role in background
          setTimeout(() => checkAdminRole(session.user.id), 0);
        } else {
          console.log('[Auth] No existing session found');
        }
        
        // Mark session as ready AFTER full initialization
        console.log('[Auth] Session ready after initialize()');
        setIsSessionReady(true);
        setIsLoading(false);
      } catch (error: any) {
        // AbortError happens when Web Locks API is interrupted
        // This can happen during page refresh - retry after a short delay
        if (error?.name === 'AbortError' && retryCount < MAX_RETRIES) {
          console.log('[Auth] Session init aborted, retrying in', RETRY_DELAY, 'ms... (attempt', retryCount + 1, 'of', MAX_RETRIES, ')');
          setTimeout(() => {
            if (isMounted) {
              initSession(retryCount + 1);
            }
          }, RETRY_DELAY);
          return;
        }
        
        if (error?.name === 'AbortError') {
          console.log('[Auth] Session init aborted after max retries, will rely on auth listener');
          // Still mark as ready so RLS queries can proceed
          // The auth listener will handle session updates
          setIsSessionReady(true);
          setIsLoading(false);
          return;
        }
        
        console.error('[Auth] Unexpected session error:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] signIn called for:', email);
    
    // Set flag to prevent onAuthStateChange from updating session during blocked check
    isCheckingBlockedRef.current = true;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log('[Auth] signIn error:', error.message);
      isCheckingBlockedRef.current = false;
      return { error: error.message };
    }

    // Check if user is blocked using edge function (bypasses RLS)
    if (data.user) {
      console.log('[Auth] Checking blocked status for user:', data.user.id);
      try {
        // Use fetch with timeout for reliability
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Construct URL from project ID
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'uyymukgccsqzagpusswm';
        const supabaseUrl = `https://${projectId}.supabase.co`;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        console.log('[Auth] Calling check-blocked at:', `${supabaseUrl}/functions/v1/check-blocked`);
        
        const response = await fetch(`${supabaseUrl}/functions/v1/check-blocked`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ user_id: data.user.id }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log('[Auth] check-blocked response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('[Auth] check-blocked result:', result);
          if (result?.is_blocked) {
            console.log('[Auth] User is blocked, signing out');
            isCheckingBlockedRef.current = false;
            await supabase.auth.signOut();
            return { error: 'Ваш аккаунт заблокирован. Обратитесь к администратору.' };
          }
        }
      } catch (e) {
        console.error('[Auth] Error checking blocked status:', e);
        // If timeout or error, allow login (fail-open for admin recovery)
      }
    }
    
    // Block check passed, now update session
    isCheckingBlockedRef.current = false;
    console.log('[Auth] signIn successful, updating session');
    
    // Manually set the session since we blocked onAuthStateChange
    if (data.session) {
      setSession(data.session);
      setUser(data.user);
      setIsLoading(false);
      // Mark session as ready for RLS queries
      console.log('[Auth] Session ready from signIn');
      setIsSessionReady(true);
      if (data.user) {
        setTimeout(() => checkAdminRole(data.user.id), 0);
      }
    }
    
    return { error: null };
  };

  const validateInvitationCode = async (code: string): Promise<{ valid: boolean; codeId?: string; error?: string }> => {
    const { data, error } = await (supabase
      .from('invitation_codes' as any)
      .select('id')
      .eq('code', code.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle() as any);
    
    if (error) {
      return { valid: false, error: 'Ошибка проверки кода' };
    }
    
    if (!data) {
      return { valid: false, error: 'Недействительный пригласительный код' };
    }
    
    return { valid: true, codeId: data.id };
  };

  const signUp = async (email: string, password: string, name: string, invitationCode: string) => {
    // First validate the invitation code
    const codeValidation = await validateInvitationCode(invitationCode);
    if (!codeValidation.valid) {
      return { error: codeValidation.error || 'Недействительный пригласительный код' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name, invitation_code_id: codeValidation.codeId }
      }
    });
    
    if (error) {
      return { error: error.message };
    }

    // Update profile with invitation_code_id after signup
    if (data.user) {
      await supabase
        .from('profiles')
        .update({ invitation_code_id: codeValidation.codeId } as any)
        .eq('user_id', data.user.id);
    }
    
    return { error: null };
  };

  const signOut = async () => {
    console.log('[Auth] signOut called');
    // Clear local state immediately
    setIsAdmin(false);
    setSession(null);
    setUser(null);
    
    try {
      // Sign out globally to invalidate all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      console.log('[Auth] signOut completed, error:', error?.message);
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      isLoading, 
      isAdmin,
      isSessionReady,
      signIn,
      signUp,
      signOut, 
      isAuthenticated: !!user,
      validateInvitationCode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return safe loading state during HMR/Fast Refresh
    // This prevents crashes when context is temporarily unavailable
    return {
      user: null,
      session: null,
      isLoading: true,
      isAdmin: false,
      isSessionReady: false,
      signIn: async () => ({ error: 'Auth not ready' }),
      signUp: async () => ({ error: 'Auth not ready' }),
      signOut: async () => {},
      isAuthenticated: false,
      validateInvitationCode: async () => ({ valid: false, error: 'Auth not ready' }),
    } as AuthContextType;
  }
  return context;
}
