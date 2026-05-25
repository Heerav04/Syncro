'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    mode: 'create',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    companyId: '',
    companyName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.displayName || !formData.companyId) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.mode === 'create' && !formData.companyName.trim()) {
      setError('Company Name is required when creating the admin workspace');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Register user via API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          companyId: formData.companyId,
          mode: formData.mode,
          companyName: formData.companyName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      window.localStorage.setItem('collabwork.companyId', data.companyId || formData.companyId);
      setSuccess('Registration successful! Opening your dashboard...');

      try {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        router.push('/dashboard');
      } catch {
        setTimeout(() => {
          router.push('/auth/login');
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Syncro</h1>
          <p className="text-slate-600">Create your account</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Account Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${formData.mode === 'create' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-slate-300 text-slate-700'}`}>
                <input
                  type="radio"
                  name="mode"
                  value="create"
                  checked={formData.mode === 'create'}
                  onChange={handleChange}
                  className="sr-only"
                />
                Host/Admin
              </label>
              <label className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${formData.mode === 'join' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-slate-300 text-slate-700'}`}>
                <input
                  type="radio"
                  name="mode"
                  value="join"
                  checked={formData.mode === 'join'}
                  onChange={handleChange}
                  className="sr-only"
                />
                Employee
              </label>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Use Host/Admin once to create the workspace. Employees should join only after the admin adds their email.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
              required
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
              required
            />
          </div>

          {/* Company ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company ID *
            </label>
            <input
              type="text"
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              placeholder="company-slug"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Unique identifier for your company (lowercase, no spaces)
            </p>
          </div>

          {/* Company Name (for new companies) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company Name{formData.mode === 'create' ? ' *' : ''}
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Your Company Inc."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
              required={formData.mode === 'create'}
            />
            <p className="text-xs text-slate-500 mt-1">
              {formData.mode === 'create' ? 'Required for the host/admin workspace.' : 'Leave blank. Use the same Company ID after your admin adds this email.'}
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-neutral-950 focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Minimum 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-slate-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-neutral-950 underline-offset-4 hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
