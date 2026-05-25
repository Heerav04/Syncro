'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/lib/firebase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (companyId.trim()) {
        window.localStorage.setItem('collabwork.companyId', companyId.trim().toLowerCase());
      }
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(authErrorMessage(err.code));
      } else {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Syncro</h1>
          <p className="text-slate-600">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

          <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company ID
            </label>
            <input
              type="text"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="company-slug"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              Use this if your account was created before Admin SDK claims were configured.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-neutral-950 text-white font-medium rounded-lg hover:bg-neutral-800 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-center">
          <p className="text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-neutral-950 underline-offset-4 hover:underline font-medium">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Forgot Password Link */}
        <div className="mt-4 text-center">
          <Link href="/auth/forgot-password" className="text-sm text-slate-500 hover:text-slate-700">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
}

function authErrorMessage(code: string) {
  switch (code) {
    case 'auth/invalid-credential':
      return 'Email or password is incorrect, or this account has not been created yet. Try Sign Up first.';
    case 'auth/user-not-found':
      return 'No account exists for this email. Please sign up first.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/operation-not-allowed':
      return 'Email/password login is disabled in Firebase Authentication. Enable it in Firebase Console.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Wait a moment, then try again.';
    default:
      return `Login failed (${code}).`;
  }
}
