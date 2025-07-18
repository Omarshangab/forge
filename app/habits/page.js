'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  GiMoon, 
  GiSun, 
  GiLightningTrio, 
  GiBullseye, 
  GiFlame 
} from 'react-icons/gi';
import AppWrapper from '../../components/AppWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../hooks/useDatabase';

import { useToast } from '../../contexts/ToastContext';
import { getHabitIcon, getCategoryIcon, HABIT_ICONS } from '../../utils/icons';
import { generateExerciseHabit } from '../../utils/generateHistoricalHabit';

// Constants
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;
const CHALLENGE_RELATION_THRESHOLD_DAYS = 30;
const WEEKS_IN_YEAR = 52;
const MAX_WEEKS_FOR_CONTRIBUTIONS = 104; // 2 years

// Utility functions
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseCompletionDate = (dateRecord) => {
  if (!dateRecord) return null;
  
  if (typeof dateRecord === 'object' && dateRecord.seconds) {
    return new Date(dateRecord.seconds * 1000);
  }
  
  if (typeof dateRecord === 'string') {
    return new Date(dateRecord + 'T00:00:00');
  }
  
  return new Date(dateRecord);
};

const getWeekBounds = (date) => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay()); // Sunday
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

function HabitsPage() {
  const { user, logout } = useAuth();
  const { 
    habits, 
    challenges,
    loading: dbLoading, 
    operationInProgress,
    addHabit, 
    completeHabit,
    deleteHabit 
  } = useDatabase();

  const { success, error: showError, warning } = useToast();
  const [showMobileProfile, setShowMobileProfile] = useState(false);

  const [showAddHabit, setShowAddHabit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});

  // Enhanced habit templates with beautiful emojis
  const habitTemplates = useMemo(() => [
    // Health & Fitness
    { id: 1, name: "Exercise", icon: "💪", category: "Health & Fitness", weeklyGoal: 3, color: "emerald" },
    { id: 2, name: "Drink Water", icon: "💧", category: "Health & Fitness", weeklyGoal: 7, color: "blue" },
    { id: 3, name: "Walk 10k Steps", icon: "🚶‍♂️", category: "Health & Fitness", weeklyGoal: 5, color: "green" },
    { id: 4, name: "Eat Healthy", icon: "🥗", category: "Health & Fitness", weeklyGoal: 7, color: "lime" },
    
    // Learning & Growth
    { id: 5, name: "Read", icon: "📚", category: "Learning", weeklyGoal: 5, color: "indigo" },
    { id: 6, name: "Practice Music", icon: "🎵", category: "Learning", weeklyGoal: 4, color: "purple" },
    { id: 7, name: "Learn Language", icon: "🗣️", category: "Learning", weeklyGoal: 5, color: "rose" },
    
    // Mindfulness & Wellness
    { id: 8, name: "Meditate", icon: "🧘‍♀️", category: "Mindfulness", weeklyGoal: 7, color: "violet" },
    { id: 9, name: "Journal", icon: "✍️", category: "Mindfulness", weeklyGoal: 7, color: "amber" },
    { id: 10, name: "Gratitude Practice", icon: "🙏", category: "Mindfulness", weeklyGoal: 7, color: "pink" },
    
    // Productivity
    { id: 11, name: "Wake Early", icon: "🌅", category: "Productivity", weeklyGoal: 7, color: "orange" },
    { id: 12, name: "Digital Detox", icon: "📵", category: "Productivity", weeklyGoal: 3, color: "gray" }
  ], []);

  const colors = useMemo(() => ({
    emerald: "from-emerald-500 to-emerald-600",
    blue: "from-blue-500 to-blue-600", 
    green: "from-green-500 to-green-600",
    lime: "from-lime-500 to-lime-600",
    indigo: "from-indigo-500 to-indigo-600",
    purple: "from-purple-500 to-purple-600",
    rose: "from-rose-500 to-rose-600",
    violet: "from-violet-500 to-violet-600",
    amber: "from-amber-500 to-amber-600",
    pink: "from-pink-500 to-pink-600",
    orange: "from-orange-500 to-orange-600",
    slate: "from-slate-500 to-slate-600"
  }), []);

  // Add habit modal states
  const [addHabitStep, setAddHabitStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customHabit, setCustomHabit] = useState({
    name: '',
    icon: '✨',
    category: '',
    weeklyGoal: 3,
    color: 'purple'
  });

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

  const handleAddHabit = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const habitData = {
        name: `${customHabit.icon} ${customHabit.name}`,
        category: customHabit.category,
        weeklyGoal: customHabit.weeklyGoal,
        icon: customHabit.icon,
        color: customHabit.color
      };
      
      await addHabit(habitData);
      
      success(`🎯 ${customHabit.name} habit created successfully!`);
      
      setShowAddHabit(false);
      setAddHabitStep(1);
      setSelectedTemplate(null);
      setCustomHabit({
        name: '',
        icon: '✨',
        category: '',
        weeklyGoal: 3,
        color: 'purple'
      });
    } catch (error) {
      showError(error.message || 'Error creating habit');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, customHabit, addHabit, success, showError]);

  const handleCompleteHabit = useCallback(async (habitId) => {
    if (operationInProgress.has(`complete-${habitId}`) || loadingStates[habitId]) return;
    
    setLoadingStates(prev => ({ ...prev, [habitId]: true }));
    
    try {
      await completeHabit(habitId);
      
      // Find habit from current state (might be stale, but for toast message it's fine)
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        const habitName = habit.name.replace(/^[^\s]*\s/, ''); // Remove emoji prefix
        success(`✅ ${habitName} completed!`);
      } else {
        success('✅ Habit completed!');
      }
    } catch (error) {
      showError(error.message || 'Error completing habit');
    } finally {
      setLoadingStates(prev => ({ ...prev, [habitId]: false }));
    }
  }, [operationInProgress, loadingStates, completeHabit, habits, success, showError]);

  const handleDeleteHabit = useCallback(async (habitId, habitName) => {
    if (!window.confirm(`Are you sure you want to delete "${habitName}"? This cannot be undone.`)) {
      return;
    }

    const deleteKey = `delete-${habitId}`;
    if (operationInProgress.has(deleteKey) || loadingStates[deleteKey]) return;

    setLoadingStates(prev => ({ ...prev, [deleteKey]: true }));
    
    try {
      await deleteHabit(habitId);
      success(`🗑️ "${habitName}" habit deleted successfully`);
    } catch (error) {
      showError(error.message || 'Error deleting habit');
    } finally {
      setLoadingStates(prev => ({ ...prev, [deleteKey]: false }));
    }
  }, [operationInProgress, loadingStates, deleteHabit, success, showError]);

  // Generate historical exercise habit (temporary dev function)
  const handleGenerateExerciseHabit = useCallback(async () => {
    if (!user || isLoading) return;
    
    // Show confirmation dialog since this creates a lot of data
    const confirmed = window.confirm(
      "This will create an Exercise habit with 42 weeks of historical workout data.\n\n" +
      "⚠️ If you already have an Exercise habit, this will fail.\n" +
      "📊 This will add ~126-210 workout completions.\n\n" +
      "Continue?"
    );
    
    if (!confirmed) return;
    
    try {
      setIsLoading(true);
      const result = await generateExerciseHabit(user.uid);
      
      success(
        `🏋️‍♀️ Exercise habit created! ` +
        `${result.totalCompletions} workouts across ${result.weeksGenerated} weeks. ` +
        `Current streak: ${result.weekStreak} weeks!`
      );
    } catch (error) {
      showError(error.message || 'Error creating exercise habit');
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading, success, showError]);

  const calculateProgress = useCallback((completed, goal) => {
    if (!goal || goal <= 0) return 0; // Fix division by zero
    return Math.min((completed / goal) * 100, 100);
  }, []);

  // Generate contributions graph data from habit start date to 1 year in advance
  const generateContributionsData = useCallback((habit) => {
    const today = new Date();
    const habitStartDate = habit.createdAt 
      ? parseCompletionDate(habit.createdAt) 
      : new Date(Date.now() - 365 * MILLISECONDS_PER_DAY);
    
    // End date: 1 year from today
    const endDate = new Date(today);
    endDate.setFullYear(endDate.getFullYear() + 1);
    
    const contributions = [];
    let currentDate = new Date(habitStartDate);
    
    // Align to start of week (Sunday) for the habit start date
    const dayOfWeek = currentDate.getDay();
    currentDate.setDate(currentDate.getDate() - dayOfWeek);
    
    // Calculate total weeks from aligned start date to 1 year from today
    const totalDays = Math.ceil((endDate - currentDate) / MILLISECONDS_PER_DAY);
    const weeksNeeded = Math.min(Math.ceil(totalDays / DAYS_PER_WEEK), MAX_WEEKS_FOR_CONTRIBUTIONS);
    
    // Get completion data from both habits and challenges
    const habitCompletions = habit.completionDates || [];
    
    // Find related challenges (converted from this habit or with similar timeframe)
    const relatedChallenges = challenges.filter(challenge => 
      challenge.originalChallengeId === habit.id || 
      challenge.name.toLowerCase().includes(habit.name.toLowerCase().split(' ')[1] || habit.name.toLowerCase()) ||
      (challenge.createdAt && Math.abs(parseCompletionDate(challenge.createdAt) - habitStartDate) < CHALLENGE_RELATION_THRESHOLD_DAYS * MILLISECONDS_PER_DAY)
    );
    
    // Combine all completion dates
    let allCompletions = [...habitCompletions];
    relatedChallenges.forEach(challenge => {
      if (challenge.completionDates) {
        allCompletions = [...allCompletions, ...challenge.completionDates];
      }
    });
    
    // Remove duplicates
    allCompletions = [...new Set(allCompletions)];
    
    for (let week = 0; week < weeksNeeded; week++) {
      const weekData = [];
      for (let day = 0; day < DAYS_PER_WEEK; day++) {
        const dayDate = new Date(currentDate);
        dayDate.setDate(currentDate.getDate() + (week * DAYS_PER_WEEK) + day);
        
        // Check if this day exists in combined completion records
        const dayString = getLocalDateString(dayDate);
        const isCompleted = allCompletions.includes(dayString) || 
                           allCompletions.some(record => {
                             const parsedDate = parseCompletionDate(record);
                             return parsedDate && getLocalDateString(parsedDate) === dayString;
                           });
        
        // Calculate intensity based on activity type and frequency
        let intensity = 0;
        if (isCompleted && dayDate >= habitStartDate) {
          // Check if this completion is from a challenge (21-day streak pattern)
          const isChallengeDay = relatedChallenges.some(challenge => 
            challenge.completionDates && challenge.completionDates.some(compDate => {
              const parsedDate = parseCompletionDate(compDate);
              return parsedDate && getLocalDateString(parsedDate) === dayString;
            })
          );
          
          if (isChallengeDay) {
            intensity = 4; // Max intensity for challenge days
          } else {
            // Calculate intensity based on weekly goal achievement for habits
            const { start: weekStart, end: weekEnd } = getWeekBounds(dayDate);
            
            // Count completions in this week
            const weekCompletions = allCompletions.filter(record => {
              const parsedDate = parseCompletionDate(record);
              return parsedDate && parsedDate >= weekStart && parsedDate <= weekEnd;
            }).length;
            
            // Calculate intensity based on weekly goal progress
            const weeklyGoal = habit.weeklyGoal || 3;
            const progressRatio = Math.min(weekCompletions / weeklyGoal, 1);
            intensity = Math.max(1, Math.ceil(progressRatio * 4)); // 1-4 intensity levels
          }
        }
        
        weekData.push({
          date: new Date(dayDate),
          completed: isCompleted && dayDate >= habitStartDate,
          intensity: intensity,
          isToday: dayDate.toDateString() === today.toDateString(),
          isFuture: dayDate > today,
          isBeforeHabitStart: dayDate < habitStartDate,
          isChallengeDay: isCompleted && relatedChallenges.some(challenge => 
            challenge.completionDates && challenge.completionDates.some(compDate => {
              const parsedDate = parseCompletionDate(compDate);
              return parsedDate && getLocalDateString(parsedDate) === dayString;
            })
          )
        });
      }
      contributions.push(weekData);
    }
    
    return contributions;
  }, [challenges]);

  // Calculate contribution statistics
  const calculateContributionStats = useCallback((contributions, habit) => {
    const allDays = contributions.flat().filter(day => !day.isFuture && !day.isBeforeHabitStart);
    const completedDays = allDays.filter(day => day.completed);
    
    return { 
      totalCompleted: completedDays.length
    };
  }, []);

  // Scroll to today function
  const scrollToToday = useCallback((habitId) => {
    const container = document.getElementById(`contributions-${habitId}`);
    if (container) {
      const todayElement = container.querySelector('[data-is-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'center' 
        });
      }
    }
  }, []);

  // Render contributions graph
  const renderContributionsGraph = (habit) => {
    const contributions = generateContributionsData(habit);
    const stats = calculateContributionStats(contributions, habit);
    
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Consistency Graph</span>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`w-3 h-3 rounded-sm ${
                    level === 0 
                      ? 'bg-slate-200 dark:bg-slate-700' 
                      : level === 1
                      ? 'bg-green-200 dark:bg-green-800'
                      : level === 2
                      ? 'bg-green-300 dark:bg-green-700'
                      : level === 3
                      ? 'bg-green-400 dark:bg-green-600'
                      : 'bg-green-500 dark:bg-green-500'
                  }`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
        
        {/* Contributions Grid */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-2 sm:p-4 overflow-x-auto scroll-smooth" id={`contributions-${habit.id}`}>
          {/* Timeline Progress Bar */}
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-[10px]">Timeline</span>
              <div className="w-12 sm:w-16 h-1 bg-slate-300 dark:bg-slate-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        ((new Date() - (habit.createdAt ? parseCompletionDate(habit.createdAt) : new Date(Date.now() - 365 * MILLISECONDS_PER_DAY))) / 
                        (365 * MILLISECONDS_PER_DAY * 2)) * 100, 0
                      ), 100
                    )}%`
                  }}
                />
              </div>
            </div>
            <button 
              onClick={() => scrollToToday(habit.id)}
              className="text-[10px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-2 py-1 rounded-md transition-colors"
            >
              Today
            </button>
          </div>
          
          <div className="flex gap-0.5 sm:gap-1 min-w-fit">
            {contributions.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5 sm:gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-sm transition-all duration-200 hover:scale-125 cursor-pointer ${
                      day.isBeforeHabitStart
                        ? 'bg-transparent border border-slate-300 dark:border-slate-600 opacity-30'
                        : day.isFuture
                        ? 'bg-slate-100 dark:bg-slate-700 opacity-40'
                        : day.intensity === 0
                        ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                        : day.intensity === 1
                        ? 'bg-green-200 dark:bg-green-800 hover:bg-green-300'
                        : day.intensity === 2
                        ? 'bg-green-300 dark:bg-green-700 hover:bg-green-400'
                        : day.intensity === 3
                        ? 'bg-green-400 dark:bg-green-600 hover:bg-green-500'
                        : 'bg-green-500 dark:bg-green-500 hover:bg-green-600'
                    } ${
                      day.isToday ? 'ring-1 sm:ring-2 ring-purple-400 ring-offset-1' : ''
                    }`}
                    data-is-today={day.isToday}
                    title={`${day.date.toLocaleDateString()} - ${
                      day.isBeforeHabitStart ? 'Before habit started' :
                      day.isFuture ? 'Future' : 
                      day.completed ? 'Completed' : 'Missed'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          
          {/* Dynamic date labels */}
                          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span className="text-[10px] sm:text-xs">
              {contributions.length > 0 && contributions[0][0] ? 
                contributions[0][0].date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : 
                'Start'
              }
            </span>
            <span className="text-[10px] sm:text-xs">Today</span>
            <span className="text-[10px] sm:text-xs">
              {contributions.length > 0 && contributions[contributions.length - 1][6] ? 
                contributions[contributions.length - 1][6].date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : 
                '+1 Year'
              }
            </span>
          </div>
        </div>

        {/* Contribution Statistics */}
        <div className="flex justify-center mt-6">
          <div className="group relative">
            {/* Background glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            
            {/* Main card */}
            <div className="relative bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 sm:p-8 text-center border border-orange-200 dark:border-slate-600 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 min-w-[160px]">
              {/* Icon */}
              <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-xl font-bold">📊</span>
              </div>
              
              {/* Number */}
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                {stats.totalCompleted}
              </div>
              
              {/* Label */}
              <div className="text-sm sm:text-base text-gray-600 dark:text-slate-300 font-semibold tracking-wide">
                Total Days Completed
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-orange-400 rounded-full opacity-60"></div>
              <div className="absolute bottom-2 left-2 w-1 h-1 bg-amber-400 rounded-full opacity-40"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base-200 transition-colors duration-500">
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
                    Weekly Habits
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
                <div className="text-xl font-bold text-purple-300">
                  {habits.reduce((total, habit) => total + (habit.currentStreak || 0), 0)}
                </div>
                <div className="text-xs text-slate-300">Streaks</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-300">
                  {habits.reduce((total, habit) => total + (habit.completed || 0), 0)}
                </div>
                <div className="text-xs text-slate-300">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-300">{habits.length}</div>
                <div className="text-xs text-slate-300">Active</div>
              </div>
            </div>
            
            {/* Mobile Welcome */}
            <div className="text-center">
              <p className="text-sm text-slate-200">
                Track your weekly progress
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
                  Weekly Habits
                </h1>
                <p className="text-base sm:text-lg text-slate-300 font-medium">
                  Track your weekly progress
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="glass text-center px-4 py-2 rounded-2xl">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {habits.reduce((total, habit) => total + (habit.currentStreak || 0), 0)}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 font-semibold">
                  Total Streaks
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
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full blur-2xl"></div>
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
              <div className="flex flex-col items-center gap-1 text-purple-600 font-bold px-2 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/30">
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
          <div className="hidden sm:flex items-center justify-center space-x-8 py-4">
            <Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium flex items-center gap-2">
              <GiLightningTrio className="w-5 h-5" />
              Home
            </Link>
            <Link href="/habits" className="text-purple-600 font-bold border-b-2 border-purple-600 pb-1 flex items-center gap-2">
              <GiBullseye className="w-5 h-5" />
              Habits
            </Link>
            <Link href="/coldblitz" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium flex items-center gap-2">
              <GiFlame className="w-5 h-5" />
              Coldblitz
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Habits Section */}
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <GiBullseye className="text-lg sm:text-xl text-white" />
              </div>
              <div>
                          <h2 className="text-lg sm:text-2xl font-bold text-white">Your Habits</h2>
          <p className="text-xs sm:text-sm text-gray-400">Build consistency week by week</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                className="btn-forge btn-primary-forge btn-sm-forge text-xs sm:text-sm px-3 sm:px-4 py-2"
                onClick={() => setShowAddHabit(true)}
              >
                ✨ Add Habit
              </button>
              
              {/* Demo data generator button */}
              <button
                className={`btn-forge btn-success-forge btn-sm-forge text-xs px-2 py-2 ${
                  isLoading ? 'btn-loading-forge opacity-50' : ''
                }`}
                onClick={handleGenerateExerciseHabit}
                disabled={isLoading}
                title="Generate demo Exercise habit with 42 weeks of historical data"
              >
                {isLoading ? '⏳' : '💪'} Demo
              </button>
            </div>
          </div>

          {habits.length === 0 ? (
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
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No habits yet</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">Start building your first habit to begin your journey</p>
              <button 
                className="btn-forge btn-primary-forge text-sm sm:text-base"
                onClick={() => setShowAddHabit(true)}
              >
                🚀 Create Your First Habit
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {habits.map(habit => (
                <div key={habit.id} className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-premium card-interactive">
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                        <span className="text-xl sm:text-2xl">
                          {habit.icon || habit.name.split(' ')[0]}
                        </span>
                        <h3 className="text-base sm:text-xl font-bold text-white">
                          {habit.name.includes(' ') ? habit.name.substring(habit.name.indexOf(' ') + 1) : habit.name}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">{habit.category}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400">
                          {habit.completed || 0}/{habit.weeklyGoal || 0} this week
                        </span>
                        <span className="flex items-center gap-1 text-orange-600 font-semibold">
                          <GiFlame className="text-base" />
                          <span>{habit.currentStreak || 0} week streak</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl px-4 py-2 min-w-[80px]">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(calculateProgress(habit.completed || 0, habit.weeklyGoal || 1))}%
                      </div>
                      <div className="text-xs text-slate-500 font-semibold">
                        Week
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-white">Weekly Progress</span>
                      <span className={`text-sm font-semibold ${
                        (habit.completed || 0) > (habit.weeklyGoal || 0) 
                          ? 'text-purple-400' 
                          : (habit.completed || 0) >= (habit.weeklyGoal || 0)
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }`}>
                        {(habit.completed || 0) > (habit.weeklyGoal || 0) 
                          ? `${habit.completed || 0} completed (+${(habit.completed || 0) - (habit.weeklyGoal || 0)} extra!)`
                          : (habit.completed || 0) >= (habit.weeklyGoal || 0)
                          ? `${habit.completed || 0} of ${habit.weeklyGoal || 0} completed - Goal Achieved! 🎯`
                          : `${habit.completed || 0} of ${habit.weeklyGoal || 0} completed`
                        }
                      </span>
                    </div>
                    <div className="w-full bg-gradient-to-r from-slate-200 to-slate-300 rounded-full h-3 progress-glow">
                      <div 
                        className={`bg-gradient-to-r ${
                          (habit.completed || 0) > (habit.weeklyGoal || 0)
                            ? 'from-purple-500 to-indigo-500'
                            : colors[habit.color?.replace('bg-', '').replace('-500', '') || 'purple']
                        } h-3 rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                        style={{ 
                          width: `${
                            (habit.completed || 0) > (habit.weeklyGoal || 0) 
                              ? Math.min(100 + ((habit.completed - habit.weeklyGoal) * 10), 120)
                              : calculateProgress(habit.completed || 0, habit.weeklyGoal || 1)
                          }%` 
                        }}
                      >
                        <div className="absolute inset-0 shimmer"></div>
                        {(habit.completed || 0) > (habit.weeklyGoal || 0) && (
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-indigo-400/30 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* GitHub-style Contributions Graph */}
                  {renderContributionsGraph(habit)}

                  <button 
                    className={`btn-full-forge ${
                      loadingStates[habit.id] ? 'btn-loading-forge' : ''
                    } ${
                      (habit.completed || 0) > (habit.weeklyGoal || 0) 
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105'
                        : (habit.completed || 0) >= (habit.weeklyGoal || 0)
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl'
                        : 'btn-forge btn-dark-forge'
                    }`}
                    onClick={() => handleCompleteHabit(habit.id)}
                    disabled={loadingStates[habit.id]}
                  >
                    {(habit.completed || 0) > (habit.weeklyGoal || 0) ? (
                      <>⭐ Extra Credit</>
                    ) : (habit.completed || 0) >= (habit.weeklyGoal || 0) ? (
                      <>🎯 Continue Streak</>
                    ) : (
                      <>✓ Mark Complete</>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteHabit(habit.id, habit.name)}
                    disabled={loadingStates[`delete-${habit.id}`]}
                    className={`btn-forge btn-danger-forge btn-full-forge mt-2 text-sm ${
                      loadingStates[`delete-${habit.id}`] ? 'btn-loading-forge' : ''
                    }`}
                  >
                    {loadingStates[`delete-${habit.id}`] ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Floating Action Button */}
      <button 
        className="btn-forge btn-fab-forge btn-primary-forge"
        onClick={() => setShowAddHabit(true)}
      >
        <span className="text-2xl">+</span>
      </button>

      {/* Add Habit Modal - Full Screen */}
      {showAddHabit && (
        <div className="modal-fullscreen">
          <div className="modal-fullscreen-container">
            {/* Sticky Header */}
            <div className="modal-fullscreen-header px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button 
                    className="btn-forge btn-ghost-forge btn-icon-forge"
                    onClick={() => {
                      setShowAddHabit(false);
                      setAddHabitStep(1);
                      setSelectedTemplate(null);
                      setCustomHabit({
                        name: '',
                        icon: '✨',
                        category: '',
                        weeklyGoal: 3,
                        color: 'purple'
                      });
                    }}
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
                      {addHabitStep === 1 ? 'Choose Habit Template' : addHabitStep === 2 ? 'Customize Habit' : 'Review & Create'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {addHabitStep === 1 ? 'Pick a habit template or create custom' : addHabitStep === 2 ? 'Personalize your habit details' : 'Almost ready to start!'}
                    </p>
                  </div>
                </div>

                {/* Step indicators */}
                <div className="flex items-center space-x-3">
                  {[1, 2, 3].map(step => (
                    <div
                      key={step}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        step < addHabitStep 
                          ? 'bg-green-500 text-white' 
                          : step === addHabitStep 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {step < addHabitStep ? '✓' : step}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="modal-fullscreen-content">
              
              {/* Step 1: Template Selection */}
              {addHabitStep === 1 && (
                <div className="step-transition max-w-6xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎯</div>
                    <h4 className="text-2xl font-bold text-white mb-2">Choose Your Habit</h4>
                    <p className="text-gray-400">Select a habit template or create a custom one</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {habitTemplates.map((template) => (
                      <button
                        key={template.id}
                        className="bg-white dark:bg-slate-800 rounded-3xl p-6 text-left border-2 border-slate-200 dark:border-slate-700 hover:border-purple-400 hover:shadow-xl transition-all duration-300 hover:scale-105 group shadow-lg"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setCustomHabit({
                            name: template.name,
                            icon: template.icon,
                            category: template.category,
                            weeklyGoal: template.weeklyGoal,
                            color: template.color
                          });
                          setAddHabitStep(2);
                        }}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                            <span className="text-2xl filter drop-shadow-sm">{template.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-lg text-white mb-1">{template.name}</h5>
                            <p className="text-sm text-gray-400">{template.weeklyGoal}x per week</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-400 bg-slate-800 rounded-full px-3 py-1 font-semibold">
                            {template.category}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                            Weekly Goal
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="text-center pt-8 mt-8 border-t border-gray-200">
                    <button
                      className="btn-forge btn-outline-forge btn-lg-forge"
                      onClick={() => setAddHabitStep(2)}
                    >
                      <span className="text-xl">✨</span>
                      Create Custom Habit
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Customization */}
              {addHabitStep === 2 && (
                <div className="step-transition max-w-4xl mx-auto space-y-8">
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-4xl">{customHabit.icon}</span>
                    </div>
                    <h4 className="text-2xl font-bold text-white mb-2">Customize Your Habit</h4>
                    <p className="text-gray-400">Make it personal and specific to your goals</p>
                  </div>

                  {/* Habit Name */}
                  <div className="form-control">
                    <label className="label">
                                              <span className="label-text font-semibold text-lg text-white">Habit Name</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g., Exercise, Read, Meditate, Drink Water" 
                                              className="input input-bordered w-full text-base focus-ring text-white placeholder-gray-400"
                      value={customHabit.name}
                      onChange={(e) => setCustomHabit({ ...customHabit, name: e.target.value })}
                    />
                  </div>

                  {/* Icon Selection */}
                  <div className="form-control">
                    <label className="label">
                                              <span className="label-text font-semibold text-lg text-white">Choose Icon</span>
                    </label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-12 gap-3">
                      {['💪', '📚', '🧘‍♀️', '💧', '🌅', '✍️', '🚶‍♂️', '📱', '🎨', '🥗', '📞', '🎵', '⚡', '🔥', '🎯', '💡', '🚀', '🌟', '🎉', '💯', '🏆', '✨', '❤️', '🧠'].map(icon => (
                        <button
                          key={icon}
                          className={`p-4 rounded-xl text-2xl hover:scale-110 transition-all duration-200 ${
                            customHabit.icon === icon 
                              ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 shadow-lg' 
                              : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 hover:shadow-md'
                          }`}
                          onClick={() => setCustomHabit({ ...customHabit, icon })}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="form-control">
                    <label className="label">
                                              <span className="label-text font-semibold text-lg text-white">Category</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {['Health & Fitness', 'Learning', 'Mindfulness', 'Productivity', 'Creativity', 'Social'].map(category => (
                        <button
                          key={category}
                          className={`p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 ${
                            customHabit.category === category
                              ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 shadow-lg'
                              : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 hover:shadow-md'
                          }`}
                          onClick={() => setCustomHabit({ ...customHabit, category })}
                        >
                                                      <span className="text-sm font-semibold text-white">{category}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Goal */}
                  <div className="form-control">
                    <label className="label">
                                              <span className="label-text font-semibold text-lg text-white">Weekly Goal</span>
                    </label>
                    <div className="grid grid-cols-7 gap-3">
                      {[1, 2, 3, 4, 5, 6, 7].map(goal => (
                        <button
                          key={goal}
                          className={`p-4 rounded-xl text-center font-bold text-lg transition-all duration-200 hover:scale-105 ${
                            customHabit.weeklyGoal === goal
                              ? 'bg-purple-500 text-white shadow-lg'
                              : 'bg-slate-800 hover:bg-slate-700 text-gray-400 hover:shadow-md'
                          }`}
                          onClick={() => setCustomHabit({ ...customHabit, weeklyGoal: goal })}
                        >
                          {goal}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400 mt-3 text-center">
                      {customHabit.weeklyGoal === 7 ? 'Every day' : `${customHabit.weeklyGoal} times per week`}
                    </p>
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-gray-200">
                    <button 
                      className="btn-forge btn-ghost-forge btn-lg-forge"
                      onClick={() => setAddHabitStep(1)}
                    >
                      ← Back
                    </button>
                    <button 
                      className="btn-forge btn-primary-forge btn-full-forge btn-lg-forge"
                      onClick={() => setAddHabitStep(3)}
                      disabled={!customHabit.name.trim() || !customHabit.category}
                    >
                      Review →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Confirm */}
              {addHabitStep === 3 && (
                <div className="step-transition max-w-3xl mx-auto space-y-8">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h4 className="text-2xl font-bold text-white mb-2">Ready to Start!</h4>
                    <p className="text-gray-400">Review your habit details and begin your journey</p>
                  </div>

                  {/* Habit Preview */}
                  <div className="glass rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center">
                        <span className="text-4xl">{customHabit.icon}</span>
                      </div>
                    </div>

                    <div className="text-center mb-6">
                                              <h5 className="text-2xl font-bold text-white mb-2">{customHabit.name}</h5>
                        <p className="text-gray-400 bg-slate-800 rounded-full px-4 py-2 inline-block font-semibold">
                          {customHabit.category}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center">
                        <div className="text-3xl font-bold text-purple-600">{customHabit.weeklyGoal}</div>
                        <div className="text-sm text-purple-500 font-semibold">per week</div>
                      </div>
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 text-center">
                                                  <div className="text-3xl font-bold text-white">0</div>
                        <div className="text-sm text-slate-500 font-semibold">week streak</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-400 text-center">Weekly Progress Preview</p>
                      <div className="flex gap-2">
                        {Array.from({ length: customHabit.weeklyGoal }, (_, i) => (
                          <div key={i} className="flex-1 h-4 bg-purple-300 opacity-50 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8 border-t border-gray-200">
                    <button 
                      className="btn-forge btn-ghost-forge btn-lg-forge"
                      onClick={() => setAddHabitStep(2)}
                    >
                      ← Edit
                    </button>
                    <button 
                      className={`btn-forge btn-success-forge btn-full-forge btn-lg-forge ${isLoading ? 'btn-loading-forge' : ''}`}
                      onClick={handleAddHabit}
                      disabled={isLoading}
                    >
                      <span className="text-xl">🚀</span>
                      {isLoading ? 'Creating...' : 'Create Habit'}
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

export default function Habits() {
  return (
    <AppWrapper>
      <HabitsPage />
    </AppWrapper>
  );
} 