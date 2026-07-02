import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface AuthViewProps {
  onBypassDemo: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onBypassDemo }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        setIsLoading(false);
        return;
      }
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMsg = err.message;
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        friendlyMsg = "Invalid email or password combination.";
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMsg = "This email is already associated with an account.";
      } else if (err.code === 'auth/invalid-email') {
        friendlyMsg = "Please enter a valid email address.";
      } else if (err.code === 'auth/missing-password') {
        friendlyMsg = "Please enter your password.";
      }
      setErrorMsg(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (signUpMode: boolean) => {
    setIsSignUp(signUpMode);
    setErrorMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%), var(--bg-app)',
      padding: '24px'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '40px 32px', 
        backgroundColor: 'var(--glass-bg)', 
        borderColor: 'var(--glass-border)',
        backdropFilter: 'blur(var(--glass-blur))',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        
        {/* Logo/Branding header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
            borderRadius: '12px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white', 
            fontWeight: 900, 
            fontSize: '1.6rem',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
            marginBottom: '16px'
          }}>
            C
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.025em', marginBottom: '6px' }}>
            Creonex Invoices
          </h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            {isSignUp ? 'Establish your corporate billing vault' : 'Sign in to access your business statements'}
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: 'var(--bg-card-hover)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button 
            type="button"
            className="btn"
            style={{ 
              padding: '8px', 
              fontSize: '0.85rem', 
              borderRadius: 'var(--radius-sm)',
              background: !isSignUp ? 'var(--bg-card)' : 'transparent',
              color: !isSignUp ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              boxShadow: !isSignUp ? 'var(--shadow-sm)' : 'none'
            }}
            onClick={() => handleTabChange(false)}
          >
            Sign In
          </button>
          <button 
            type="button"
            className="btn"
            style={{ 
              padding: '8px', 
              fontSize: '0.85rem', 
              borderRadius: 'var(--radius-sm)',
              background: isSignUp ? 'var(--bg-card)' : 'transparent',
              color: isSignUp ? 'var(--text-main)' : 'var(--text-muted)',
              border: 'none',
              boxShadow: isSignUp ? 'var(--shadow-sm)' : 'none'
            }}
            onClick={() => handleTabChange(true)}
          >
            Register
          </button>
        </div>

        {/* Error notification alert */}
        {errorMsg && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px', 
            padding: '12px 16px', 
            backgroundColor: 'var(--danger-light)', 
            color: 'var(--danger-text)', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.85rem',
            lineHeight: '1.4',
            fontWeight: 500
          }}>
            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Corporate Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                required
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="form-input" 
                placeholder="you@creonex.com"
                style={{ width: '100%', paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="form-input" 
                placeholder="••••••••"
                style={{ width: '100%', paddingLeft: '38px' }}
              />
            </div>
          </div>

          {isSignUp && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  required
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="form-input" 
                  placeholder="••••••••"
                  style={{ width: '100%', paddingLeft: '38px' }}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading}
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
          >
            {isLoading 
              ? 'Authorizing Vault...' 
              : (isSignUp ? 'Create Corporate Account' : 'Authenticate & Unlock')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span className="form-label" style={{ fontSize: '0.7rem' }}>OR EXPLORE</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        {/* Demo Mode trigger */}
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onBypassDemo}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' }}
        >
          <Sparkles size={16} style={{ stroke: 'var(--warning)' }} /> 
          <span>Enter Sandbox Demo Mode</span>
        </button>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', justifyContent: 'center' }}>
          <ShieldAlert size={12} />
          <span>Encrypted security credentials handled by Google Firebase</span>
        </div>

      </div>
    </div>
  );
};
