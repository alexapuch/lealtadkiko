import { createClient } from '@supabase/supabase-js'

// This endpoint lets you verify the database is properly set up
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Check if profiles table is accessible
  const { error: profilesError } = await supabase
    .from('profiles')
    .select('id')
    .limit(0)

  if (profilesError) {
    return res.status(500).json({
      status: 'error',
      message: 'profiles table not accessible',
      detail: profilesError.message,
    })
  }

  return res.status(200).json({
    status: 'ok',
    message: 'Database is properly configured',
  })
}
