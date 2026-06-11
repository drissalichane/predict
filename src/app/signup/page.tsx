import { signup } from './actions'
import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }} className="text-solid">Create Account</h2>
        
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="email" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit'
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="password" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: 'inherit'
              }} 
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <button formAction={signup} className="btn btn-primary">Sign Up</button>
          </div>
          
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            Already have an account? <Link href="/login" className="text-solid" style={{ textDecoration: 'underline' }}>Sign In</Link>
          </p>

          {resolvedSearchParams?.message && (
            <p style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255, 0, 0, 0.1)', color: '#ff6b6b', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.9rem' }}>
              {resolvedSearchParams.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
