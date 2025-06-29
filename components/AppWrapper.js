'use client';

import { useAuth } from '../contexts/AuthContext';
import LoginPage from './LoginPage';

export default function AppWrapper({ children }) {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <LoginPage />;
  }

  return children;
} 