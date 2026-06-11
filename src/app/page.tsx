import Link from "next/link";
import { createClient } from '@/utils/supabase/server';
import { signup } from '@/app/signup/actions';
import JoinRoomForm from '@/components/JoinRoomForm';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <h1 style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>
            <span className="text-solid">World Cup</span> Predictions
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Pick a username and password to start predicting matches with your friends!
          </p>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="username" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Username</label>
              <input 
                id="username" 
                name="username" 
                type="text" 
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
              <label htmlFor="password" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Password <span style={{fontSize: '0.8rem', opacity: 0.7}}>(At least 6 chars, e.g. 123456)</span>
              </label>
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
              <button formAction={signup} className="btn btn-primary" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>Start Playing</button>
            </div>
            
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              backgroundColor: 'rgba(79, 38, 131, 0.15)', 
              border: '1px solid var(--color-wimbledon-purple)', 
              borderRadius: 'var(--radius-md)', 
              textAlign: 'center' 
            }}>
              <p style={{ color: 'var(--color-text-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>
                Already have an account?
              </p>
              <Link href="/login" className="btn btn-purple" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                Log In Here
              </Link>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // Logged-in view
  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      
      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', maxWidth: '800px', width: '100%' }}>
        <h1 style={{ marginBottom: '1rem' }}>
          <span className="text-solid">World Cup</span> Predictions
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>
          Experience the thrill of the tournament. Create a room, invite your friends, and see who has the best football intuition.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-md)' }}>
            Go to Dashboard & Create Room
          </Link>
          
          <div style={{ width: '100%', maxWidth: '400px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Or quickly join an existing room:</p>
            <JoinRoomForm />
          </div>
        </div>
      </div>
      
      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
        <p>A classic predictions experience powered by football-data.org</p>
      </footer>
    </main>
  );
}
