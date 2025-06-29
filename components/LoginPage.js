'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { loginWithGoogle, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
      // You could add toast notification here
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="glass rounded-3xl p-8 shadow-premium">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto"></div>
          <p className="text-center text-slate-600 mt-4 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl"></div>
      
      <div className="glass rounded-3xl p-8 sm:p-12 shadow-premium max-w-md w-full relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>
        
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/forge-logo.png"
              alt="Forge Logo"
              width={80}
              height={80}
              className="w-20 h-20 object-contain mx-auto mb-4 float-animation"
            />
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
              Welcome to Forge
            </h1>
            <p className="text-slate-600 text-lg">
              Build lasting habits and complete challenges
            </p>
          </div>

          {/* Features showcase */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900">Weekly Habits</h3>
                <p className="text-sm text-slate-600">Track your progress week by week</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                <span className="text-lg">🔥</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900">21-Day Challenges</h3>
                <p className="text-sm text-slate-600">Complete Coldblitz challenges with rewards</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <span className="text-lg">🏆</span>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-slate-900">Visual Progress</h3>
                <p className="text-sm text-slate-600">See your streaks and achievements</p>
              </div>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className={`btn-forge btn-primary-forge btn-full-forge btn-lg-forge ${
              isLoggingIn ? 'btn-loading-forge' : ''
            }`}
          >
            {isLoggingIn ? (
              <>Signing in...</>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-slate-500">
              By signing in, you agree to our{' '}
              <span className="text-purple-600 font-semibold">Terms of Service</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 