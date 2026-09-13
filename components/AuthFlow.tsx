import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import useAuthStore from '../store/authStore';

type AuthView = 'landing' | 'login' | 'register' | 'forgot-password' | 'reset-password';

export const AuthFlow: React.FC = () => {
  const [view, setView] = useState<AuthView>('landing');
  const [toastMessage, setToastMessage] = useState<{msg: string, tone: string} | null>(null);

  const toast = (msg: string, tone: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ msg, tone });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const renderView = () => {
    switch (view) {
      case 'landing':
        return <LandingView setView={setView} />;
      case 'login':
        return <LoginView setView={setView} toast={toast} />;
      case 'register':
        return <RegisterView setView={setView} toast={toast} />;
      case 'forgot-password':
        return <ForgotPasswordView setView={setView} toast={toast} />;
      case 'reset-password':
        return <ResetPasswordView setView={setView} toast={toast} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      {toastMessage && (
        <div className="toast toast-top toast-end z-50 mt-3 mr-3">
          <div className={`alert ${toastMessage.tone === 'error' ? 'alert-error' : toastMessage.tone === 'info' ? 'alert-info' : 'alert-success'} shadow-lg`}>
            {toastMessage.tone === 'success' && <Check size={16} />}
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-md bg-base-100 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter">Shraddha<span className="text-primary">.</span></h1>
          <p className="text-xs text-base-content/50 uppercase tracking-widest mt-1">Optical Studio</p>
        </div>

        {renderView()}
      </div>
    </div>
  );
};

const LandingView: React.FC<{ setView: (v: AuthView) => void }> = ({ setView }) => (
  <div className="text-center">
    <div className="bg-primary/10 rounded-2xl p-8 mb-8">
      <h2 className="text-3xl font-black text-primary leading-tight mb-3">Find Your Perfect Frame.</h2>
      <p className="text-sm font-semibold text-base-content/70">See clearly. Look confidently.</p>
    </div>
    
    <div className="space-y-3">
      <button className="btn btn-primary w-full" onClick={() => setView('login')}>Login</button>
      <button className="btn btn-outline w-full" onClick={() => setView('register')}>Create Account</button>
    </div>
  </div>
);

const LoginView: React.FC<{ setView: (v: AuthView) => void; toast: (msg: string, tone?: 'success' | 'error' | 'info') => void; }> = ({ setView, toast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email.trim(),
        password,
      });
      login(response.data.user, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-black text-center mb-2">Welcome Back</h2>
      {error && <div className="alert alert-error mt-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="form-control">
          <span className="label-text font-semibold">Email</span>
          <input type="email" required className="input input-bordered w-full mt-1" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="form-control relative">
          <span className="label-text font-semibold">Password</span>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} required className="input input-bordered w-full mt-1 pr-10" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <div className="flex justify-between items-center mt-2">
          <label className="label cursor-pointer justify-start gap-2">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
            <span className="label-text">Remember me</span>
          </label>
          <button type="button" className="link link-hover text-sm font-semibold" onClick={() => setView('forgot-password')}>Forgot Password?</button>
        </div>
        <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <div className="text-center mt-6">
        <p className="text-sm">Don't have an account? <button className="link link-primary font-bold" onClick={() => setView('register')}>Sign up</button></p>
      </div>
      <button className="btn btn-circle btn-sm btn-ghost absolute top-4 right-4 text-base-content/40" onClick={() => setView('landing')}><X size={16} /></button>
    </div>
  );
};

const RegisterView: React.FC<{ setView: (v: AuthView) => void; toast: (msg: string, tone?: 'success' | 'error' | 'info') => void; }> = ({ setView, toast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (!terms) {
      return setError('You must accept the Terms & Conditions.');
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email: email.trim(),
        mobileNumber,
        password,
      });
      // Auto login on success
      login(response.data.user, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length === 0) return { label: '', color: 'bg-base-300' };
    if (score < 3) return { label: 'Weak', color: 'bg-error' };
    if (score < 5) return { label: 'Medium', color: 'bg-warning' };
    return { label: 'Strong', color: 'bg-success' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-black text-center mb-2">Create Account</h2>
      {error && <div className="alert alert-error mt-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="form-control">
          <span className="label-text font-semibold text-xs">Full Name</span>
          <input type="text" required className="input input-bordered input-sm w-full mt-1" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="form-control">
            <span className="label-text font-semibold text-xs">Email</span>
            <input type="email" required className="input input-bordered input-sm w-full mt-1" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text font-semibold text-xs">Mobile</span>
            <input type="tel" required className="input input-bordered input-sm w-full mt-1" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
          </label>
        </div>
        <label className="form-control relative">
          <span className="label-text font-semibold text-xs">Password</span>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} required className="input input-bordered input-sm w-full mt-1 pr-10" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {password && (
            <div className="mt-2 text-[10px] flex justify-between items-center leading-tight">
              <span className="text-base-content/60">Min 8 chars, 1 uppercase, 1 number, 1 special</span>
              <span className={`badge badge-xs font-bold ${strength.color} text-white`}>{strength.label}</span>
            </div>
          )}
        </label>
        <label className="form-control relative">
          <span className="label-text font-semibold text-xs">Confirm Password</span>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} required className="input input-bordered input-sm w-full mt-1" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
        </label>
        <label className="label cursor-pointer justify-start gap-2 mt-2">
          <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={terms} onChange={e => setTerms(e.target.checked)} />
          <span className="label-text text-xs">I agree to the Terms & Conditions</span>
        </label>
        <button type="submit" className="btn btn-primary w-full mt-3" disabled={isLoading}>
          {isLoading ? 'Creating your account...' : 'Create Account'}
        </button>
      </form>
      <div className="text-center mt-4">
        <p className="text-xs">Already have an account? <button className="link link-primary font-bold" onClick={() => setView('login')}>Log in</button></p>
      </div>
      <button className="btn btn-circle btn-sm btn-ghost absolute top-4 right-4 text-base-content/40" onClick={() => setView('landing')}><X size={16} /></button>
    </div>
  );
};

const ForgotPasswordView: React.FC<{ setView: (v: AuthView) => void; toast: (msg: string, tone?: 'success' | 'info') => void; }> = ({ setView, toast }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email: email.trim() });
      setSuccessMsg(response.data.message);
      if (response.data.devResetToken) {
        toast(`[DEV] Token: ${response.data.devResetToken}`, 'info');
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-black text-center mb-2">Reset Password</h2>
      <p className="text-center text-sm text-base-content/60">Enter your email and we'll send you instructions.</p>
      {error && <div className="alert alert-error mt-4 text-sm">{error}</div>}
      {successMsg && <div className="alert alert-success mt-4 text-sm">{successMsg}</div>}
      {!successMsg ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="form-control">
            <span className="label-text font-semibold">Email</span>
            <input type="email" required className="input input-bordered w-full mt-1" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
            {isLoading ? 'Sending instructions...' : 'Request Reset'}
          </button>
        </form>
      ) : (
        <div className="mt-6">
          <button className="btn btn-primary w-full" onClick={() => setView('reset-password')}>
            [DEV] Enter Reset Token
          </button>
        </div>
      )}
      <div className="text-center mt-6">
        <button className="link link-primary font-bold text-sm" onClick={() => setView('login')}>Back to Login</button>
      </div>
      <button className="btn btn-circle btn-sm btn-ghost absolute top-4 right-4 text-base-content/40" onClick={() => setView('landing')}><X size={16} /></button>
    </div>
  );
};

const ResetPasswordView: React.FC<{ setView: (v: AuthView) => void; toast: (msg: string, tone?: 'success' | 'error') => void; }> = ({ setView, toast }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setIsLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        token,
        newPassword,
      });
      toast('Password updated successfully. You can now log in.', 'success');
      setView('login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-2xl font-black text-center mb-2">Create New Password</h2>
      {error && <div className="alert alert-error mt-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="form-control">
          <span className="label-text font-semibold text-sm">Reset Token</span>
          <input type="text" required className="input input-bordered w-full mt-1" value={token} onChange={e => setToken(e.target.value)} />
        </label>
        <label className="form-control relative">
          <span className="label-text font-semibold text-sm">New Password</span>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} required className="input input-bordered w-full mt-1 pr-10" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <label className="form-control relative">
          <span className="label-text font-semibold text-sm">Confirm New Password</span>
          <input type={showPassword ? 'text' : 'password'} required className="input input-bordered w-full mt-1" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
      <div className="text-center mt-6">
        <button className="link link-primary font-bold text-sm" onClick={() => setView('login')}>Back to Login</button>
      </div>
    </div>
  );
};
