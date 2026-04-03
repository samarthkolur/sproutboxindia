import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://izwcvdrgdavctqlyangc.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ATaeE_ch3-BRRpe7M1mC1A_ti-02vbq'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  console.log("Checking profiles table count...")
  const { count, error: pErr } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  console.log("Profiles count:", count, "Error:", pErr?.message)
}

test()
