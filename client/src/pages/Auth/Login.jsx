import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { User, Lock, ArrowRight, CheckSquare, Square } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      alert('Login failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--dark-bg)' }}>
      {/* Top Header */}
      <header style={{ 
        padding: '24px 40px', 
        background: 'var(--surface-bg)', 
        borderBottom: '1px solid var(--glass-border)',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        zIndex: 10
      }}>
        <h1 className="gold-gradient" style={{ margin: 0, fontSize: '2.2rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Mahalakshmi Jewellers
        </h1>
      </header>

      {/* Main Split Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Side: Beautiful Jewellery Image */}
        <div style={{ 
          flex: 1, 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
          background: 'var(--dark-bg)',
          position: 'relative'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            backgroundImage: 'url(/jewellery_login_bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid var(--glass-border)'
          }}></div>
        </div>

        {/* Right Side: Login Form */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '40px',
          background: 'var(--dark-bg)',
          position: 'relative'
        }}>
          {/* Subtle Decorative Glows */}
          <div style={{ position: 'absolute', top: '10%', right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-gold) 0%, transparent 70%)', opacity: '0.04', filter: 'blur(40px)' }}></div>
          
          <div className="glass-card fade-in" style={{ 
            padding: '50px 40px', 
            width: '100%', 
            maxWidth: '460px',
            background: 'var(--surface-bg)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
            zIndex: 1
          }}>
            <div style={{ textAlign: 'left', marginBottom: '35px' }}>
              <h2 style={{ fontSize: '2rem', marginBottom: '10px', color: 'var(--text-main)' }}>Welcome Back</h2>
              <div style={{ width: '60px', height: '4px', background: 'linear-gradient(90deg, var(--primary-gold), var(--secondary-gold))', borderRadius: '2px', marginBottom: '15px' }}></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Please enter your details to sign in.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group" style={{ position: 'relative', marginBottom: '20px' }}>
                <label style={{ marginLeft: '4px', fontWeight: 600 }}>Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                    placeholder="Enter username"
                    style={{ paddingLeft: '45px', fontSize: '1rem', height: '54px', borderRadius: '12px' }}
                  />
                </div>
              </div>
              
              <div className="input-group" style={{ position: 'relative', marginBottom: '20px' }}>
                <label style={{ marginLeft: '4px', fontWeight: 600 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    placeholder="••••••••"
                    style={{ paddingLeft: '45px', fontSize: '1rem', height: '54px', letterSpacing: '2px', borderRadius: '12px' }}
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '0 4px' }}>
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'var(--transition)' }}
                >
                  {rememberMe ? <CheckSquare size={18} color="var(--primary-gold)" /> : <Square size={18} color="var(--text-muted)" />}
                  <span style={{ fontSize: '0.9rem', color: rememberMe ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: 500 }}>Remember Me</span>
                </div>
                
                <a href="#" style={{ fontSize: '0.9rem', color: 'var(--primary-gold)', fontWeight: 600, transition: 'var(--transition)' }}>
                  Forgot Password?
                </a>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ 
                  width: '100%', 
                  height: '56px', 
                  fontSize: '1.05rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '12px',
                  borderRadius: '12px'
                }}
              >
                Login
                <ArrowRight size={20} style={{ 
                  transform: isHovered ? 'translateX(5px)' : 'translateX(0)',
                  transition: 'transform 0.3s ease'
                }} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
