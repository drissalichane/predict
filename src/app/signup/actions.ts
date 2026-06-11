'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const username = formData.get('username') as string
  const data = {
    email: `${username.toLowerCase()}@predict.local`,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/signup?message=Could not create user')
  }

  const redirectTo = formData.get('redirect_to') as string || '/dashboard'

  revalidatePath(redirectTo, 'layout')
  redirect(redirectTo)
}
