'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  GiMoon, 
  GiSun, 
  GiLightningTrio, 
  GiBullseye, 
  GiFlame,
  GiTrophyCup 
} from 'react-icons/gi';
import AppWrapper from '../../components/AppWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../hooks/useDatabase';

import { useToast } from '../../contexts/ToastContext';
import { getHabitIcon, getCategoryIcon } from '../../utils/icons';

function ColdblitzPage() {
  const { user, logout } = useAuth();
  const { 
    challenges, 
    loading: dbLoading, 
    operationInProgress,
    addChallenge, 
    completeDay,
    addHabit,
    archiveChallenge,
    convertChallengeToHabit: dbConvertChallengeToHabit
  } = useDatabase();

  const { success, error: showError, warning } = useToast();

  const [showAddChallenge, setShowAddChallenge] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [completionMessage, setCompletionMessage] = useState(null);
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

  // Challenge templates for Coldblitz
  const challengeTemplates = useMemo(() => [
    { id: 1, name: "Morning Meditation", icon: "🧘‍♀️", description: "10 minutes of mindfulness", category: "Mindfulness" },
    { id: 2, name: "Cold Shower", icon: "🚿", description: "3-minute cold shower", category: "Wellness" },
    { id: 3, name: "Daily Exercise", icon: "💪", description: "30 minutes of physical activity", category: "Fitness" },
    { id: 4, name: "Read Daily", icon: "📚", description: "Read for 20 minutes", category: "Learning" },
    { id: 5, name: "No Social Media", icon: "📵", description: "Digital detox from social platforms", category: "Productivity" },
    { id: 6, name: "Drink Water", icon: "💧", description: "8 glasses of water", category: "Health" },
    { id: 7, name: "Early Wake Up", icon: "🌅", description: "Wake up at 6 AM", category: "Productivity" },
    { id: 8, name: "Gratitude Journal", icon: "🙏", description: "Write 3 things you're grateful for", category: "Mindfulness" },
    { id: 9, name: "No Junk Food", icon: "🥗", description: "Eat only healthy foods", category: "Health" },
    { id: 10, name: "Creative Time", icon: "🎨", description: "30 minutes of creative work", category: "Creativity" },
    { id: 11, name: "Walk Outside", icon: "🚶‍♂️", description: "20-minute outdoor walk", category: "Health" },
    { id: 12, name: "Practice Instrument", icon: "🎵", description: "30 minutes of music practice", category: "Learning" }
  ], []);

  // Add challenge modal states
  const [addChallengeStep, setAddChallengeStep] = useState(1);
  const [selectedChallengeTemplate, setSelectedChallengeTemplate] = useState(null);
  const [customChallenge, setCustomChallenge] = useState({
    name: '',
    icon: '🔥',
    description: '',
    reward: '',
    category: ''
  });

  const handleAddChallenge = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const challengeData = {
        name: `${customChallenge.icon} ${customChallenge.name}`,
        description: customChallenge.description,
        reward: customChallenge.reward,
        icon: customChallenge.icon,
        category: customChallenge.category
      };
      
      await addChallenge(challengeData);
      
      success(`🔥 ${customChallenge.name} challenge started! 21 days to go!`);
      
      setShowAddChallenge(false);
      setAddChallengeStep(1);
      setSelectedChallengeTemplate(null);
      setCustomChallenge({
        name: '',
        icon: '🔥',
        description: '',
        reward: '',
        category: ''
      });
    } catch (error) {
      showError(error.message || 'Error creating challenge');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, customChallenge, addChallenge, success, showError]);

  const selectChallengeTemplate = useCallback((template) => {
    setSelectedChallengeTemplate(template);
    setCustomChallenge({
      name: template.name,
      icon: template.icon,
      description: template.description,
      reward: '',
      category: template.category
    });
    setAddChallengeStep(2);
  }, []);

  // Convert completed challenge to habit
  const convertChallengeToHabit = useCallback(async (challenge) => {
    try {
      // Map challenge categories to habit categories and weekly goals
      const categoryMapping = {
        'Mindfulness': { category: 'Mindfulness', weeklyGoal: 5 },
        'Wellness': { category: 'Health & Fitness', weeklyGoal: 4 },
        'Fitness': { category: 'Health & Fitness', weeklyGoal: 3 },
        'Learning': { category: 'Learning', weeklyGoal: 5 },
        'Productivity': { category: 'Productivity', weeklyGoal: 5 },
        'Health': { category: 'Health & Fitness', weeklyGoal: 4 },
        'Creativity': { category: 'Creativity', weeklyGoal: 3 }
      };

      const mapping = categoryMapping[challenge.category] || { category: 'Health & Fitness', weeklyGoal: 3 };

      const habitData = {
        name: challenge.name, // Keep the full name with icon
        category: mapping.category,
        weeklyGoal: mapping.weeklyGoal,
        icon: challenge.icon
      };

      await addHabit(habitData);
      
      // Show success message
      setCompletionMessage({
        challengeName: challenge.name.substring(challenge.name.indexOf(' ') + 1),
        reward: challenge.reward,
        habitCategory: mapping.category,
        weeklyGoal: mapping.weeklyGoal
      });

      // Hide message after 10 seconds
      setTimeout(() => {
        setCompletionMessage(null);
      }, 10000);

    } catch (error) {
      console.error('Error converting challenge to habit:', error);
    }
  }, [addHabit]);

  const handleCompleteDay = useCallback(async (challengeId) => {
    // Prevent race conditions
    const operationKey = `complete-challenge-${challengeId}`;
    if (operationInProgress.has(operationKey) || loadingStates[`challenge_${challengeId}`]) return;
    
    setLoadingStates(prev => ({ ...prev, [`challenge_${challengeId}`]: true }));
    
    try {
      // Get the challenge before completing the day
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) throw new Error('Challenge not found');

      // Complete the day
      await completeDay(challengeId);

      // Show success message based on the new streak
      const currentStreak = (challenge.currentStreak || 0) + 1;
      const daysRemaining = 21 - currentStreak;
      
      if (currentStreak >= 21) {
        success(`🎉 Challenge completed! You did it for 21 days straight!`);
      } else {
        success(`💪 Day ${currentStreak} streak! ${daysRemaining} more days to go!`);
      }

      // Note: Auto-conversion to habit is now handled in the database hook
    } catch (error) {
      console.error('Error completing day:', error);
      
      // Handle specific error messages
      if (error.message && error.message.includes('already completed')) {
        showError('⚠️ You already completed this challenge today!');
      } else {
        showError(error.message || 'Error completing challenge day');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [`challenge_${challengeId}`]: false }));
    }
  }, [operationInProgress, loadingStates, challenges, completeDay, success, showError]);

  const handleArchiveChallenge = useCallback(async (challengeId) => {
    if (!confirm('Are you sure you want to archive this challenge? This will remove it from your active challenges.')) {
      return;
    }

    const archiveKey = `archive_${challengeId}`;
    if (loadingStates[archiveKey]) return;

    setLoadingStates(prev => ({ ...prev, [archiveKey]: true }));
    
    try {
      await archiveChallenge(challengeId);
      success('📦 Challenge archived successfully');
    } catch (error) {
      showError(error.message || 'Error archiving challenge');
    } finally {
      setLoadingStates(prev => ({ ...prev, [archiveKey]: false }));
    }
  }, [loadingStates, archiveChallenge, success, showError]);

  const handleConvertToHabit = useCallback(async (challengeId) => {
    const convertKey = `convert_${challengeId}`;
    if (loadingStates[convertKey]) return;

    setLoadingStates(prev => ({ ...prev, [convertKey]: true }));
    
    try {
      const habitId = await dbConvertChallengeToHabit(challengeId);
      if (habitId) {
        success('🎉 Challenge converted to weekly habit! Check your Habits page.');
      }
    } catch (error) {
      showError(error.message || 'Error converting challenge to habit');
    } finally {
      setLoadingStates(prev => ({ ...prev, [convertKey]: false }));
    }
  }, [loadingStates, dbConvertChallengeToHabit, success, showError]);

  // Day grid rendering based on current streak
  const renderDayGrid = useCallback((challenge) => {
    const days = Array.from({ length: 21 }, (_, i) => i + 1);
    const currentStreak = challenge.currentStreak || 0;
    
    return (
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {days.map(day => {
          // Day is completed if it's within the current streak
          const isCompleted = day <= currentStreak;
          // Current day is the next day to be completed
          const isCurrent = day === currentStreak + 1 && currentStreak < 21;
          const isUpcoming = day > currentStreak + 1;
          
          return (
            <div
              key={day}
              className={`day-grid-item ${
                isCompleted ? 'completed' : 
                isCurrent ? 'current' : 
                'upcoming'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    );
  }, []);

  // Progress calculation based on current streak
  const calculateAverageProgress = useCallback(() => {
    if (challenges.length === 0) return 0;
    
    const totalProgress = challenges.reduce((total, challenge) => {
      const currentStreak = challenge.currentStreak || 0;
      return total + (currentStreak / 21) * 100;
    }, 0);
    
    return Math.round(totalProgress / challenges.length);
  }, [challenges]);

  const calculateTotalDaysCompleted = useCallback(() => {
    return challenges.reduce((total, challenge) => {
      return total + (challenge.currentStreak || 0);
    }, 0);
  }, [challenges]);

  // Challenge completion check based on 21 consecutive days
  const isChallengeCompleted = useCallback((challenge) => {
    return challenge.isCompleted || (challenge.currentStreak >= 21);
  }, []);

  const resetChallengeForm = useCallback(() => {
    setCustomChallenge({
      name: '',
      icon: '🔥',
      description: '',
      reward: '',
      category: ''
    });
    setAddChallengeStep(1);
    setSelectedChallengeTemplate(null);
    setShowAddChallenge(false);
  }, []);

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
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                    Coldblitz
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
                <div className="text-xl font-bold text-orange-300">
                  {calculateAverageProgress()}%
                </div>
                <div className="text-xs text-slate-300">Progress</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-300">
                  {calculateTotalDaysCompleted()}
                </div>
                <div className="text-xs text-slate-300">Days Done</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-amber-300">{challenges.length}</div>
                <div className="text-xs text-slate-300">Active</div>
              </div>
            </div>
            
            {/* Mobile Welcome */}
            <div className="text-center">
              <p className="text-sm text-slate-200">
                21-day challenges
              </p>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/" className="relative">
                <Image
                  src="/forge-logo.png"
                  alt="Forge Logo"
                  width={64}
                  height={64}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain float-animation"
                />
              </Link>
              <div>
                <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  Coldblitz
                </h1>
                <p className="text-base sm:text-lg text-slate-300 font-medium">
                  21-day challenges
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="glass text-center px-4 py-2 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                  {calculateAverageProgress()}%
                </div>
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold">
                  Avg Progress
                </div>
              </div>
              
              {/* User Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowMobileProfile(!showMobileProfile)}
                  className="flex items-center gap-2 glass px-3 py-2 rounded-2xl"
                >
                  <Image
                    src={user?.photoURL || '/forge-logo.png'}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {user?.displayName?.split(' ')[0] || 'User'}
                  </span>
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
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/20 to-transparent rounded-full blur-2xl"></div>
      </header>

      {/* Mobile-Optimized Navigation */}
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 transition-all duration-300 shadow-lg">
        <div className="container mx-auto px-4">
          {/* Mobile Navigation */}
          <div className="sm:hidden flex items-center justify-center space-x-2 py-3">
            <Link href="/" className="group relative">
              <div className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-400 font-medium px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300">
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
              <div className="flex flex-col items-center gap-1 text-orange-600 font-bold px-2 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/30">
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
          <div className="hidden sm:flex items-center justify-center space-x-8 py-4">
            <Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium flex items-center gap-2">
              <GiLightningTrio className="w-5 h-5" />
              Home
            </Link>
            <Link href="/habits" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium flex items-center gap-2">
              <GiBullseye className="w-5 h-5" />
              Habits
            </Link>
            <Link href="/coldblitz" className="text-orange-600 font-bold border-b-2 border-orange-600 pb-1 flex items-center gap-2">
              <GiFlame className="w-5 h-5" />
              Coldblitz
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Coldblitz Section */}
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <GiFlame className="text-lg sm:text-xl text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Your Challenges</h2>
                <p className="text-xs sm:text-sm text-gray-400">Commit to 21 days of transformation</p>
              </div>
            </div>
            <button 
              className="btn-forge btn-primary-forge btn-sm-forge text-xs sm:text-sm px-3 sm:px-4 py-2"
              onClick={() => setShowAddChallenge(true)}
            >
              ✨ New Challenge
            </button>
          </div>

          {challenges.length === 0 ? (
            <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center shadow-premium">
              <div className="relative mb-4 sm:mb-6">
                <Image
                  src="/forge-logo.png"
                  alt="Forge Logo"
                  width={48}
                  height={48}
                  className="w-12 h-12 sm:w-15 sm:h-15 object-contain mx-auto opacity-20"
                />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No challenges yet</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">Start your first 21-day challenge and earn amazing rewards</p>
              <button 
                className="btn-forge btn-primary-forge text-sm sm:text-base"
                onClick={() => setShowAddChallenge(true)}
              >
                🚀 Start Your First Challenge
              </button>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {challenges.map(challenge => (
                <div key={challenge.id} className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-premium card-interactive">
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <span className="text-xl sm:text-2xl">
                          {challenge.icon || challenge.name.split(' ')[0]}
                        </span>
                        <h3 className="text-base sm:text-xl font-bold text-white">
                          {challenge.name.includes(' ') ? challenge.name.substring(challenge.name.indexOf(' ') + 1) : challenge.name}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">{challenge.description}</p>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-600 font-semibold">
                        <GiTrophyCup className="text-sm sm:text-base" />
                        <span>{challenge.reward}</span>
                      </div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 min-w-[70px] sm:min-w-[80px]">
                      <div className="text-lg sm:text-2xl font-bold text-orange-600">
                        {Math.round(((challenge.currentStreak || 0) / 21) * 100)}%
                      </div>
                      <div className="text-xs text-orange-500 font-semibold">
                        Complete
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-white">Progress</span>
                      <span className="text-sm text-gray-400">
                        {challenge.currentStreak || 0} consecutive days ({21 - (challenge.currentStreak || 0)} remaining)
                      </span>
                    </div>
                    <div className="w-full bg-gradient-to-r from-slate-200 to-slate-300 rounded-full h-3 progress-glow">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                        style={{ width: `${((challenge.currentStreak || 0) / 21) * 100}%` }}
                      >
                        <div className="absolute inset-0 shimmer"></div>
                      </div>
                    </div>
                  </div>

                  {renderDayGrid(challenge)}

                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-3">
                      <button 
                        className={`btn-forge btn-success-forge flex-1 ${
                          loadingStates[`challenge_${challenge.id}`] ? 'btn-loading-forge' : ''
                        } ${isChallengeCompleted(challenge) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleCompleteDay(challenge.id)}
                        disabled={loadingStates[`challenge_${challenge.id}`] || isChallengeCompleted(challenge)}
                      >
                        {isChallengeCompleted(challenge) ? (
                          <>🎉 Challenge Complete!</>
                        ) : (
                          <>✨ Complete Day {(challenge.currentStreak || 0) + 1}</>
                        )}
                      </button>
                      
                      {/* Archive Button */}
                      <button 
                        className={`btn-forge btn-outline-forge px-4 ${
                          loadingStates[`archive_${challenge.id}`] ? 'btn-loading-forge' : ''
                        }`}
                        onClick={() => handleArchiveChallenge(challenge.id)}
                        disabled={loadingStates[`archive_${challenge.id}`]}
                        title="Archive Challenge"
                      >
                        📦
                      </button>
                    </div>

                    {/* Convert to Habit Button (shows only for completed challenges) */}
                    {isChallengeCompleted(challenge) && !challenge.isConverted && (
                      <button 
                        className={`btn-forge btn-primary-forge btn-full-forge mt-3 ${
                          loadingStates[`convert_${challenge.id}`] ? 'btn-loading-forge' : ''
                        }`}
                        onClick={() => handleConvertToHabit(challenge.id)}
                        disabled={loadingStates[`convert_${challenge.id}`]}
                      >
                        🔄 Convert to Weekly Habit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Challenge Completion Success Message */}
      {completionMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-premium animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Challenge Complete!
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Congratulations! You've completed your <strong>{completionMessage.challengeName}</strong> challenge for 21 days straight.
              </p>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-4 mb-4">
                <div className="text-4xl mb-2">🎁</div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <strong>Your Reward:</strong> {completionMessage.reward}
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-purple-50 dark:from-green-900/20 dark:to-purple-900/20 rounded-2xl p-4 mb-6">
                <div className="text-3xl mb-2">✨</div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                  <strong>Bonus:</strong> This challenge has been converted to a weekly habit!
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Goal: {completionMessage.weeklyGoal} times per week in <strong>{completionMessage.habitCategory}</strong>
                </p>
              </div>

              <button 
                className="btn-forge btn-primary-forge btn-full-forge"
                onClick={() => setCompletionMessage(null)}
              >
                🚀 Continue Your Journey
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        className="btn-forge btn-fab-forge btn-primary-forge"
        onClick={() => setShowAddChallenge(true)}
      >
        <span className="text-2xl">+</span>
      </button>

      {/* Add Challenge Modal - Full Screen */}
      {showAddChallenge && (
        <div className="modal-fullscreen">
          <div className="modal-fullscreen-container">
            {/* Sticky Header */}
            <div className="modal-fullscreen-header px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button 
                    className="btn-forge btn-ghost-forge btn-icon-forge"
                    onClick={resetChallengeForm}
                  >
                    ✕
                  </button>
                  <Image 
                    src="/forge-logo.png" 
                    alt="Forge Logo" 
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {addChallengeStep === 1 ? 'Choose Challenge' : addChallengeStep === 2 ? 'Customize Challenge' : 'Set Your Reward'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {addChallengeStep === 1 ? 'Pick a 21-day challenge template' : addChallengeStep === 2 ? 'Personalize your challenge details' : 'What will you reward yourself with?'}
                    </p>
                  </div>
                </div>

                {/* Step indicators */}
                <div className="flex items-center space-x-3">
                  {[1, 2, 3].map(step => (
                    <div
                      key={step}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        step < addChallengeStep 
                          ? 'bg-green-500 text-white' 
                          : step === addChallengeStep 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {step < addChallengeStep ? '✓' : step}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="modal-fullscreen-content">
              
              {/* Step 1: Template Selection */}
              {addChallengeStep === 1 && (
                <div className="step-transition max-w-6xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🔥</div>
                    <h4 className="text-2xl font-bold text-white mb-2">Choose Your 21-Day Challenge</h4>
                    <p className="text-gray-400">Select a challenge template or create a custom one</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {challengeTemplates.map((template) => (
                      <button
                        key={template.id}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-6 text-left border-2 border-slate-200 dark:border-slate-700 hover:border-orange-400 hover:shadow-xl transition-all duration-300 hover:scale-105 group shadow-lg"
                        onClick={() => selectChallengeTemplate(template)}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                            <span className="text-2xl filter drop-shadow-sm">{template.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-lg text-white mb-1">{template.name}</h5>
                            <p className="text-sm text-gray-400">{template.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-400 bg-slate-800 rounded-full px-3 py-1 font-semibold">
                            {template.category}
                          </div>
                          <div className="text-xs text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                            21 Days
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="text-center pt-8 mt-8 border-t border-gray-200">
                    <button
                      className="btn-forge btn-outline-forge btn-lg-forge"
                      onClick={() => setAddChallengeStep(2)}
                    >
                      <span className="text-xl">✨</span>
                      Create Custom Challenge
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Customization */}
              {addChallengeStep === 2 && (
                <div className="step-transition max-w-4xl mx-auto space-y-8">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">{customChallenge.icon}</span>
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-2">Customize Your Challenge</h4>
                    <p className="text-gray-400">Make it personal and specific to your goals</p>
                  </div>

                  {/* Challenge Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-lg text-white">Challenge Name</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g., Morning Meditation, Cold Shower, Daily Reading" 
                      className="input input-bordered w-full text-base focus-ring text-white placeholder-gray-400"
                      value={customChallenge.name}
                      onChange={(e) => setCustomChallenge({ ...customChallenge, name: e.target.value })}
                    />
                  </div>

                  {/* Description */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-lg text-white">Description</span>
                    </label>
                    <textarea 
                      placeholder="Describe what you'll do each day (e.g., 10 minutes of mindfulness meditation)"
                      className="textarea textarea-bordered w-full text-base focus-ring text-white placeholder-gray-400"
                      rows="3"
                      value={customChallenge.description}
                      onChange={(e) => setCustomChallenge({ ...customChallenge, description: e.target.value })}
                    />
                  </div>

                  {/* Icon Selection */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-lg text-white">Choose Icon</span>
                    </label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-12 gap-3">
                      {['🔥', '🧘‍♀️', '🚿', '💪', '📚', '📵', '💧', '🌅', '🙏', '🥗', '🎨', '🚶‍♂️', '🎵', '✍️', '🧠', '⚡', '🎯', '🌟', '💎', '🚀', '⭐', '💯', '🏆', '✨'].map(icon => (
                        <button
                          key={icon}
                          className={`p-4 rounded-xl text-2xl hover:scale-110 transition-all duration-200 ${
                            customChallenge.icon === icon 
                              ? 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500 shadow-lg' 
                              : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 hover:shadow-md'
                          }`}
                          onClick={() => setCustomChallenge({ ...customChallenge, icon })}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-gray-200">
                    <button 
                      className="btn-forge btn-ghost-forge btn-lg-forge"
                      onClick={() => setAddChallengeStep(1)}
                    >
                      ← Back
                    </button>
                    <button 
                      className="btn-forge btn-primary-forge btn-full-forge btn-lg-forge"
                      onClick={() => setAddChallengeStep(3)}
                      disabled={!customChallenge.name.trim() || !customChallenge.description.trim()}
                    >
                      Set Reward →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Reward */}
              {addChallengeStep === 3 && (
                <div className="step-transition max-w-3xl mx-auto space-y-8">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎁</div>
                    <h4 className="text-2xl font-bold text-white mb-2">Set Your Reward</h4>
                    <p className="text-gray-400">What will you treat yourself to after completing this 21-day challenge?</p>
                  </div>

                  {/* Challenge Preview */}
                  <div className="glass rounded-3xl p-6 shadow-xl mb-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center">
                        <span className="text-2xl">{customChallenge.icon}</span>
                      </div>
                      <div>
                        <h5 className="text-xl font-bold text-white">{customChallenge.name}</h5>
                        <p className="text-gray-400">{customChallenge.description}</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-4 text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-1">21</div>
                      <div className="text-sm text-orange-500 font-semibold">Consecutive Days</div>
                    </div>
                  </div>

                  {/* Reward Input */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold text-lg text-white">Your Reward</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g., New book, Spa day, Gaming setup, Weekend getaway" 
                      className="input input-bordered w-full text-base focus-ring text-white placeholder-gray-400"
                      value={customChallenge.reward}
                      onChange={(e) => setCustomChallenge({ ...customChallenge, reward: e.target.value })}
                    />
                    <div className="label">
                      <span className="label-text-alt text-slate-500 dark:text-slate-400">Make it something you really want - it will motivate you!</span>
                    </div>
                  </div>

                  {/* Reward Suggestions */}
                  <div className="space-y-4">
                                          <h6 className="font-semibold text-white">Popular Reward Ideas:</h6>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        '🛍️ Shopping spree',
                        '🍕 Favorite meal',
                        '📚 New book',
                        '🎮 New game',
                        '🧘‍♀️ Spa day',
                        '✈️ Weekend trip',
                        '🎬 Movie night',
                        '🏋️‍♀️ Gym equipment',
                        '🎵 Concert tickets'
                      ].map((suggestion, index) => (
                        <button
                          key={index}
                          className="text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-sm text-slate-700 dark:text-slate-300"
                          onClick={() => setCustomChallenge({ ...customChallenge, reward: suggestion.substring(2) })}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-gray-200">
                    <button 
                      className="btn-forge btn-ghost-forge btn-lg-forge"
                      onClick={() => setAddChallengeStep(2)}
                    >
                      ← Back
                    </button>
                    <button 
                      className={`btn-forge btn-success-forge btn-full-forge btn-lg-forge ${isLoading ? 'btn-loading-forge' : ''}`}
                      onClick={handleAddChallenge}
                      disabled={!customChallenge.reward.trim() || isLoading}
                    >
                      <span className="text-xl">🚀</span>
                      {isLoading ? 'Creating Challenge...' : 'Start Challenge'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Coldblitz() {
  return (
    <AppWrapper>
      <ColdblitzPage />
    </AppWrapper>
  );
} 