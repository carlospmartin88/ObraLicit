import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Lógica para Iniciar Sesión
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        alert('¡Inicio de sesión exitoso!');
      } else {
        // Lógica para Registrarse
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // Si el registro es exitoso, guardamos el nombre de la empresa
        if (data.user) {
          const { error: profileError } = await supabase
            .from('companies')
            .insert([{ id: data.user.id, name: companyName }]);
          
          if (profileError) throw profileError;
          alert('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.');
        }
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: '400px', margin: '40px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>{isLogin ? 'Iniciar Sesión' : 'Registrar Empresa'}</h2>
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {!isLogin && (
          <div>
            <label>Nombre de la Empresa:</label>
            <input 
              type="text" 
              required 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        )}

        <div>
          <label>Email:</label>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div>
          <label>Contraseña:</label>
          <input 
            type="password" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button type="submit" disabled={isLoading} style={{ padding: '10px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px' }}>
          {isLoading ? 'Cargando...' : isLogin ? 'Entrar' : 'Registrarse'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '15px' }}>
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          style={{ background: 'none', border: 'none', color: '#0056b3', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </p>
    </div>
  );
}