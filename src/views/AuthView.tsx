import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
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

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      let friendlyMsg = err.message;
      if (err.code === 'auth/popup-closed-by-user') {
        friendlyMsg = "Sign-in popup was closed before completion.";
      } else if (err.code === 'auth/cancelled-popup-request') {
        friendlyMsg = "Sign-in request was cancelled.";
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', opacity: 0.5 }}></div>
          <span className="form-label" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)', opacity: 0.5 }}></div>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary" 
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: 'block' }}>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>{isSignUp ? 'Sign up with Google' : 'Sign in with Google'}</span>
        </button>

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
