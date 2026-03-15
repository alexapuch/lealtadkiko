import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { user_id, email, full_name } = req.body
  if (!user_id || !email) {
    return res.status(400).json({ error: 'Missing user_id or email' })
  }

  // Use service_role key (server-side only, bypasses RLS)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user_id,
      email,
      full_name: full_name || '',
    }, { onConflict: 'id' })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}
