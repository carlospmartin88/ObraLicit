import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Comprobar la sesión actual al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cambios en la autenticación (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div>
        <h1 style={{ textAlign: 'center', marginTop: '20px' }}>Bienvenido a ObraLicit</h1>
        <Auth />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>Panel de ObraLicit</h1>
        <button 
          onClick={() => supabase.auth.signOut()}
          style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Cerrar Sesión
        </button>
      </header>

      <main>
        <h2>Licitaciones Disponibles</h2>
        <p>¡Hola! Tu sesión está iniciada de forma segura.</p>
        {/* Aquí integraremos la lógica de las pujas más adelante */}
      </main>
    </div>
  );
}

export default App;