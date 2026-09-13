import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { Modal } from '../types';

export const LoginModal: React.FC<{ setModal: (modal: Modal) => void; toast: (msg: string, tone?: 'success' | 'error' | 'info') => void; close: () => void; }> = ({ setModal, toast, close }) => {
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
      toast(`Welcome back, ${response.data.user.name.split(' ')[0]}`, 'success');
      close();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-black text-center">Welcome Back</h2>
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
          <button type="button" className="link link-hover text-sm font-semibold" onClick={() => setModal('forgot-password')}>Forgot Password?</button>
        </div>
        <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Login'}
        </button>
      </form>
      <div className="text-center mt-6">
        <p className="text-sm">Don't have an account? <button className="link link-primary font-bold" onClick={() => setModal('register')}>Sign up</button></p>
      </div>
    </div>
  );
};

export const RegisterModal: React.FC<{ setModal: (modal: Modal) => void; toast: (msg: string, tone?: 'success' | 'error' | 'info') => void; close: () => void; }> = ({ setModal, toast, close }) => {
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
      toast('Account created successfully!', 'success');
      close();
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
    <div className="mt-4">
      <h2 className="text-2xl font-black text-center">Create Your Account</h2>
      {error && <div className="alert alert-error mt-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <label className="form-control">
          <span className="label-text font-semibold">Full Name</span>
          <input type="text" required className="input input-bordered input-sm w-full mt-1" value={name} onChange={e => setName(e.target.value)} />
        </label>
        <label className="form-control">
          <span className="label-text font-semibold">Email</span>
          <input type="email" required className="input input-bordered input-sm w-full mt-1" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="form-control">
          <span className="label-text font-semibold">Mobile Number</span>
          <input type="tel" required className="input input-bordered input-sm w-full mt-1" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
        </label>
        <label className="form-control relative">
          <span className="label-text font-semibold">Password</span>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} required className="input input-bordered input-sm w-full mt-1 pr-10" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {password && (
            <div className="mt-2 text-xs flex justify-between items-center">
              <span className="text-base-content/60">Minimum 8 chars, 1 uppercase, 1 number, 1 special char</span>
              <span className={`badge badge-xs font-bold ${strength.color} text-white`}>{strength.label}</span>
            </div>
          )}
        </label>
        <label className="form-control relative">
          <span className="label-text font-semibold">Confirm Password</span>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} required className="input input-bordered input-sm w-full mt-1 pr-10" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
        </label>
        <label className="label cursor-pointer justify-start gap-2 mt-2">
          <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={terms} onChange={e => setTerms(e.target.checked)} />
          <span className="label-text text-sm">I agree to the Terms & Conditions</span>
        </label>
        <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
          {isLoading ? 'Creating your account...' : 'Create Account'}
        </button>
      </form>
      <div className="text-center mt-6">
        <p className="text-sm">Already have an account? <button className="link link-primary font-bold" onClick={() => setModal('login')}>Log in</button></p>
      </div>
    </div>
  );
};

export const ForgotPasswordModal: React.FC<{ setModal: (modal: Modal) => void; toast: (msg: string, tone?: 'success' | 'info') => void; }> = ({ setModal, toast }) => {
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
      
      // For local testing convenience without real email:
      if (response.data.devResetToken) {
        toast(`[DEV MODE] Token: ${response.data.devResetToken}`, 'info');
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-black text-center">Reset Password</h2>
      <p className="text-center text-sm text-base-content/60 mt-2">Enter your email and we'll send you instructions.</p>
      
      {error && <div className="alert alert-error mt-4 text-sm">{error}</div>}
      {successMsg && <div className="alert alert-success mt-4 text-sm">{successMsg}</div>}
      
      {!successMsg ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="form-control">
            <span className="label-text font-semibold">Email</span>
            <input type="email" required className="input input-bordered w-full mt-1" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
            {isLoading ? 'Sending reset instructions...' : 'Request Reset'}
          </button>
        </form>
      ) : (
        <div className="mt-6">
          <button className="btn btn-primary w-full" onClick={() => setModal('reset-password')}>
            [DEV] Enter Reset Token
          </button>
        </div>
      )}
      <div className="text-center mt-6">
        <button className="link link-primary font-bold text-sm" onClick={() => setModal('login')}>Back to Login</button>
      </div>
    </div>
  );
};

export const ResetPasswordModal: React.FC<{ setModal: (modal: Modal) => void; toast: (msg: string, tone?: 'success' | 'error') => void; }> = ({ setModal, toast }) => {
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
      setModal('login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="text-2xl font-black text-center">Create New Password</h2>
      {error && <div className="alert alert-error mt-4 text-sm">{error}</div>}
      
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="form-control">
          <span className="label-text font-semibold">Reset Token (from email)</span>
          <input type="text" required className="input input-bordered w-full mt-1" value={token} onChange={e => setToken(e.target.value)} />
        </label>
        <label className="form-control relative">
          <span className="label-text font-semibold">New Password</span>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} required className="input input-bordered w-full mt-1 pr-10" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <label className="form-control relative">
          <span className="label-text font-semibold">Confirm New Password</span>
          <input type={showPassword ? 'text' : 'password'} required className="input input-bordered w-full mt-1" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary w-full mt-4" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
      <div className="text-center mt-6">
        <button className="link link-primary font-bold text-sm" onClick={() => setModal('login')}>Back to Login</button>
      </div>
    </div>
  );
};
