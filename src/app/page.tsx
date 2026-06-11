import Link from "next/link";

export default function Home() {
  return (
    <main className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      
      <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', maxWidth: '800px', width: '100%' }}>
        <h1 style={{ marginBottom: '1rem' }}>
          <span className="text-solid">World Cup</span> Predictions
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>
          Experience the thrill of the tournament. Create a room, invite your friends, and see who has the best football intuition.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
            Create a Room
          </Link>
          
          <Link href="/dashboard" className="btn btn-purple" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
            Join a Room
          </Link>
        </div>
      </div>
      
      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
        <p>A classic predictions experience powered by football-data.org</p>
      </footer>
    </main>
  );
}
