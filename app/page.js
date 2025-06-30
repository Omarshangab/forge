'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  GiMoon, 
  GiSun, 
  GiLightningTrio, 
  GiBullseye, 
  GiFlame,
  GiTrophyCup,
  GiSparkles,
  GiRocket,
  GiStrongMan,
  GiHeartWings 
} from 'react-icons/gi';
import AppWrapper from '../components/AppWrapper';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../hooks/useDatabase';

import { getHabitIcon, getCategoryIcon } from '../utils/icons';

function HomePage() {
  const { user, logout } = useAuth();
  const { habits, challenges, loading } = useDatabase();

  const [showMobileProfile, setShowMobileProfile] = useState(false);

  // Close mobile profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileProfile && !event.target.closest('.mobile-profile-container')) {
        setShowMobileProfile(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMobileProfile]);

  // Dashboard calculations
  const totalHabitStreaks = habits.reduce((total, habit) => total + habit.currentStreak, 0);
  const totalChallengeProgress = challenges.length > 0 ? 
    challenges.reduce((total, challenge) => 
      total + (challenge.daysCompleted.length / challenge.totalDays) * 100, 0
    ) / challenges.length : 0;
  const weeklyHabitsCompleted = habits.reduce((total, habit) => total + habit.completed, 0);
  const weeklyHabitsTotal = habits.reduce((total, habit) => total + habit.weeklyGoal, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-500">
      {/* Mobile-Optimized Header */}
      <header className="gradient-primary text-white relative overflow-hidden">
        <div className="container mx-auto px-4 py-6 sm:py-16">
          {/* Mobile Layout */}
          <div className="sm:hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
        <Image
                  src="/forge-logo.png"
                  alt="Forge Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain float-animation"
                />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                    Forge
                  </h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Mobile User Profile */}
                <div className="relative mobile-profile-container">
                  <button
                    onClick={() => setShowMobileProfile(!showMobileProfile)}
                    className="flex items-center gap-2 glass px-2 py-1 rounded-xl"
                  >
                    <Image
                      src={user?.photoURL || '/forge-logo.png'}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-white">
                      {user?.displayName?.split(' ')[0] || 'User'}
                    </span>
                  </button>
                  
                  {/* Mobile Dropdown */}
                  {showMobileProfile && (
                    <div className="absolute right-0 top-full mt-2 z-[60] bg-slate-800 rounded-xl p-2 shadow-xl border border-slate-700 min-w-[100px]">
                      <button
                        onClick={() => {
                          logout();
                          setShowMobileProfile(false);
                        }}
                        className="w-full text-left px-3 py-2 text-red-300 hover:bg-red-50/10 rounded-lg text-sm font-medium transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Mobile Stats Bar */}
            <div className="flex items-center justify-between glass rounded-xl p-3 mb-2">
              <div className="text-center">
                <div className="text-xl font-bold text-purple-300">{totalHabitStreaks}</div>
                <div className="text-xs text-slate-300">Days</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-300">{weeklyHabitsCompleted}/{weeklyHabitsTotal}</div>
                <div className="text-xs text-slate-300">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-orange-300">{Math.round(totalChallengeProgress)}%</div>
                <div className="text-xs text-slate-300">Challenges</div>
              </div>
            </div>
            
            {/* Mobile Welcome */}
            <div className="text-center">
              <p className="text-sm text-slate-200">
                <GiHeartWings className="inline w-4 h-4 mr-1 text-purple-300" />
                Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
              </p>
            </div>
        </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            {/* Logo and Title Section */}
            <div className="flex items-center gap-6 sm:gap-10">
              <div className="relative group cursor-pointer">
                <div className="relative">
          <Image
                    src="/forge-logo.png"
                    alt="Forge Logo"
                    width={96}
                    height={96}
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain float-animation group-hover:scale-110 transition-all duration-500"
                  />
                  {/* Subtle glow effect on hover */}
                  <div className="absolute inset-0 bg-purple-400/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent leading-tight tracking-tight">
                  Forge
                </h1>
                <p className="text-xl sm:text-2xl text-slate-200 font-semibold flex items-center gap-3">
                  <GiHeartWings className="text-purple-300 text-2xl" />
                  Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
                </p>
              </div>
            </div>
            
            {/* Right Side Controls */}
            <div className="flex items-center gap-5">
              {/* Enhanced Stats Card */}
              <div className="glass rounded-3xl p-6 min-w-[140px] backdrop-blur-lg border border-white/30 shadow-2xl">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-purple-200 via-purple-300 to-purple-400 bg-clip-text text-transparent mb-2">
                    {totalHabitStreaks}
                  </div>
                  <div className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Total Days
                  </div>
                </div>
                {/* Accent line with animation */}
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent mt-3 rounded-full opacity-70"></div>
              </div>
              
              {/* Enhanced User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowMobileProfile(!showMobileProfile)}
                  className="flex items-center gap-4 glass px-5 py-4 rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/20 shadow-xl"
                >
                  <div className="relative">
                    <Image
                      src={user?.photoURL || '/forge-logo.png'}
                      alt="Profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover ring-3 ring-white/40 hover:ring-purple-300/60 transition-all duration-300"
                    />
                    {/* Online indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white/80 shadow-lg"></div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-base font-bold text-white flex items-center gap-2">
                      <GiLightningTrio className="w-5 h-5 text-purple-300" />
                      {user?.displayName?.split(' ')[0] || 'User'}
                    </div>
                    <div className="text-sm text-gray-400 font-medium">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                  </div>
                </button>
                
                {/* Dropdown */}
                {showMobileProfile && (
                  <div className="absolute right-0 top-full mt-2 z-[60] bg-slate-800 rounded-xl p-2 shadow-xl border border-slate-700 min-w-[120px]">
                    <button
                      onClick={() => {
                        logout();
                        setShowMobileProfile(false);
                      }}
                      className="w-full text-left px-3 py-2 text-red-300 hover:bg-red-50/10 rounded-lg text-sm font-medium transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-purple-400/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-blue-400/25 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-gradient-to-r from-pink-400/20 to-transparent rounded-full blur-xl opacity-60"></div>
        <div className="absolute bottom-1/4 right-1/3 w-16 h-16 bg-gradient-to-l from-cyan-400/15 to-transparent rounded-full blur-lg opacity-80"></div>
        
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/5 to-transparent opacity-50"></div>
      </header>

      {/* Mobile-Optimized Navigation */}
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 transition-all duration-300 shadow-lg">
        <div className="container mx-auto px-4">
          {/* Mobile Navigation */}
          <div className="sm:hidden flex items-center justify-center space-x-2 py-3">
            <Link href="/" className="group relative">
              <div className="flex flex-col items-center gap-1 text-purple-600 font-bold px-2 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
                <GiLightningTrio className="w-5 h-5" />
                <span className="text-xs">Home</span>
              </div>
            </Link>
            <Link href="/habits" className="group relative">
              <div className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-400 font-medium px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300">
                <GiBullseye className="w-5 h-5" />
                <span className="text-xs">Habits</span>
              </div>
            </Link>
            <Link href="/coldblitz" className="group relative">
              <div className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-400 font-medium px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300">
                <GiFlame className="w-5 h-5" />
                <span className="text-xs">Coldblitz</span>
              </div>
            </Link>
            <button onClick={logout} className="group relative">
              <div className="flex flex-col items-center gap-1 text-red-600 dark:text-red-400 font-medium px-2 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all duration-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-xs">Sign Out</span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center justify-center space-x-12 py-6">
            <Link href="/" className="group relative">
              <div className="flex items-center gap-3 text-purple-600 font-bold px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 shadow-md">
                <GiLightningTrio className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-lg">Home</span>
              </div>
              {/* Active indicator */}
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-purple-600 rounded-full"></div>
            </Link>
            <Link href="/habits" className="group relative">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300">
                <GiBullseye className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-lg">Habits</span>
              </div>
            </Link>
            <Link href="/coldblitz" className="group relative">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300">
                <GiFlame className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-lg">Coldblitz</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 sm:py-12 space-y-8 sm:space-y-16">
        
        {/* Mobile-Optimized Welcome Section */}
        <section className="text-center">
          <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl sm:text-5xl font-bold text-white mb-3 sm:mb-6 flex items-center justify-center gap-2 sm:gap-4">
          Ready to build? <GiHeartWings className="text-purple-600 text-2xl sm:text-5xl" />
        </h2>
        <p className="text-base sm:text-2xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
              Continue building your habits and completing your challenges. Every day counts towards your transformation!
            </p>
          </div>
        </section>

        {/* Stats Overview */}
        <section>
                  <h3 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-8 flex items-center justify-center gap-2 sm:gap-3">
          <GiSparkles className="text-purple-600 text-xl sm:text-3xl" />
          Your Progress
        </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            
            {/* Total Habit Streaks */}
            <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-premium text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <GiFlame className="text-lg sm:text-2xl text-purple-600" />
              </div>
              <div className="text-xl sm:text-3xl font-bold text-purple-600 mb-1">{totalHabitStreaks}</div>
              <div className="text-xs sm:text-sm text-gray-400 font-semibold">Week Streaks</div>
            </div>

            {/* Weekly Progress */}
            <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-premium text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <GiBullseye className="text-lg sm:text-2xl text-blue-600" />
              </div>
              <div className="text-xl sm:text-3xl font-bold text-blue-600 mb-1">
                {weeklyHabitsCompleted}/{weeklyHabitsTotal}
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-semibold">This Week</div>
            </div>

            {/* Challenge Progress */}
            <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-premium text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <GiTrophyCup className="text-lg sm:text-2xl text-orange-600" />
              </div>
              <div className="text-xl sm:text-3xl font-bold text-orange-600 mb-1">
                {Math.round(totalChallengeProgress)}%
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-semibold">Challenges</div>
            </div>

            {/* Active Items */}
            <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-premium text-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <GiRocket className="text-lg sm:text-2xl text-green-600" />
              </div>
              <div className="text-xl sm:text-3xl font-bold text-green-600 mb-1">
                {habits.length + challenges.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-semibold">Active</div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-8 flex items-center justify-center gap-2 sm:gap-3">
            <GiLightningTrio className="text-purple-600 text-xl sm:text-3xl" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Habits Card */}
            <Link href="/habits" className="group">
              <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-premium card-interactive group-hover:shadow-custom-hover">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GiBullseye className="text-2xl sm:text-3xl text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-1">Weekly Habits</h4>
                    <p className="text-sm sm:text-base text-gray-400">Track your weekly progress</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {habits.slice(0, 2).map(habit => {
                    const HabitIcon = getHabitIcon(habit.name);
                    return (
                      <div key={habit.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HabitIcon className="text-lg text-purple-600" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {habit.name}
                          </span>
                        </div>
                        <div className="text-sm text-purple-600 font-bold">
                          {habit.completed}/{habit.weeklyGoal}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">View all habits</span>
                    <span className="text-purple-600 font-semibold group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Coldblitz Card */}
            <Link href="/coldblitz" className="group">
              <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-premium card-interactive group-hover:shadow-custom-hover">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GiFlame className="text-2xl sm:text-3xl text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-white mb-1">Coldblitz</h4>
                    <p className="text-sm sm:text-base text-gray-400">21-day challenges</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {challenges.slice(0, 2).map(challenge => {
                    const ChallengeIcon = getHabitIcon(challenge.name);
                    return (
                      <div key={challenge.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ChallengeIcon className="text-lg text-orange-600" />
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                            {challenge.name}
                          </span>
                        </div>
                        <div className="text-sm text-orange-600 font-bold">
                          Day {challenge.currentDay}/21
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">View all challenges</span>
                    <span className="text-orange-600 font-semibold group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Today's Focus */}
        <section>
          <h3 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4 sm:mb-8 flex items-center justify-center gap-2 sm:gap-3">
            <GiBullseye className="text-purple-600 text-xl sm:text-3xl" />
            Today's Focus
          </h3>
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-premium">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              
              {/* Habits to Complete */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 flex items-center gap-2">
                  <GiBullseye className="text-purple-600" />
                  Habits for This Week
                </h4>
                <div className="space-y-3">
                  {habits.map(habit => {
                    const HabitIcon = getHabitIcon(habit.name);
                    return (
                      <div key={habit.id} className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg sm:rounded-xl">
                        <div className="flex items-center gap-2">
                          <HabitIcon className="text-purple-600 text-sm sm:text-base" />
                          <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                            {habit.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-12 sm:w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 sm:h-2">
                            <div 
                              className="h-1.5 sm:h-2 bg-purple-500 rounded-full transition-all duration-300"
                              style={{ width: `${(habit.completed / habit.weeklyGoal) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {habit.completed}/{habit.weeklyGoal}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Challenges to Complete */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 sm:mb-4 flex items-center gap-2">
                  <GiFlame className="text-orange-600" />
                  Active Challenges
                </h4>
                <div className="space-y-3">
                  {challenges.map(challenge => {
                    const ChallengeIcon = getHabitIcon(challenge.name);
                    return (
                      <div key={challenge.id} className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg sm:rounded-xl">
                        <div className="flex items-center gap-2">
                          <ChallengeIcon className="text-orange-600 text-sm sm:text-base" />
                          <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                            {challenge.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="w-12 sm:w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 sm:h-2">
                            <div 
                              className="h-1.5 sm:h-2 bg-orange-500 rounded-full transition-all duration-300"
                              style={{ width: `${(challenge.daysCompleted.length / challenge.totalDays) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {challenge.daysCompleted.length}/21
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Motivational Quote */}
        <section className="text-center">
          <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-premium max-w-2xl mx-auto">
            <GiStrongMan className="text-2xl sm:text-4xl text-purple-600 mx-auto mb-3 sm:mb-4" />
            <blockquote className="text-base sm:text-lg text-slate-700 dark:text-slate-300 italic mb-3 sm:mb-4">
              "Success is the sum of small efforts repeated day in and day out."
            </blockquote>
            <cite className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold">— Robert Collier</cite>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppWrapper>
      <HomePage />
    </AppWrapper>
  );
}
