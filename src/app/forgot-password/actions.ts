'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/admin'

export async function resetPassword(formData: FormData) {
  const supabaseAdmin = createAdminClient()

  const username = formData.get('username') as string
  const newPassword = formData.get('password') as string
  const email = `${username.toLowerCase()}@predict.local`

  let page = 1
  let userId = null

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 100,
    })

    if (error || !data || !data.users || data.users.length === 0) {
      break
    }

    const user = data.users.find((u) => u.email === email)
    if (user) {
      userId = user.id
      break
    }

    page++
  }

  if (!userId) {
    redirect('/forgot-password?message=User not found')
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  )

  if (updateError) {
    redirect(`/forgot-password?message=Could not reset password: ${updateError.message}`)
  }

  redirect('/login?message=Password reset successfully. You can now log in.')
}
