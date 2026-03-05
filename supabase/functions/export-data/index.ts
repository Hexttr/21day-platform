import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await anonClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if user is admin
    const { data: roleData } = await anonClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use service role client to get all data
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get all auth users
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()
    if (authError) {
      console.error('Error fetching auth users:', authError)
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
    }

    // Get all user roles
    const { data: userRoles, error: rolesError } = await adminClient
      .from('user_roles')
      .select('*')
    if (rolesError) {
      console.error('Error fetching user_roles:', rolesError)
    }

    // Get all student progress
    const { data: studentProgress, error: progressError } = await adminClient
      .from('student_progress')
      .select('*')
    if (progressError) {
      console.error('Error fetching student_progress:', progressError)
    }

    // Get all lesson content
    const { data: lessonContent, error: lessonError } = await adminClient
      .from('lesson_content')
      .select('*')
    if (lessonError) {
      console.error('Error fetching lesson_content:', lessonError)
    }

    // Get all practical materials
    const { data: practicalMaterials, error: materialsError } = await adminClient
      .from('practical_materials')
      .select('*')
    if (materialsError) {
      console.error('Error fetching practical_materials:', materialsError)
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      authUsers: authUsers?.users?.map(u => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        user_metadata: u.user_metadata,
        app_metadata: u.app_metadata
      })) || [],
      profiles: profiles || [],
      userRoles: userRoles || [],
      studentProgress: studentProgress || [],
      lessonContent: lessonContent || [],
      practicalMaterials: practicalMaterials || [],
      summary: {
        totalUsers: authUsers?.users?.length || 0,
        totalProfiles: profiles?.length || 0,
        totalRoles: userRoles?.length || 0,
        totalProgress: studentProgress?.length || 0,
        totalLessons: lessonContent?.length || 0,
        totalMaterials: practicalMaterials?.length || 0
      }
    }

    console.log('Export completed:', exportData.summary)

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="export-data.json"'
      }
    })

  } catch (error: unknown) {
    console.error('Export error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
