import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Hardcoded user ID for Tatiana (doc-tata68@mail.ru)
    const userId = '4d026a08-0ba8-429e-8955-38aba9276bc9'

    // Update user to invalidate all sessions by updating app_metadata
    // This forces re-authentication
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { 
        force_logout: Date.now() 
      }
    })

    if (updateError) {
      console.error('Error updating user:', updateError)
      return new Response(JSON.stringify({ 
        error: updateError.message,
        userId 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Successfully updated user metadata to force logout:', userId, data)

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Tatiana metadata updated - she will need to re-login',
      userId,
      email: data?.user?.email
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
