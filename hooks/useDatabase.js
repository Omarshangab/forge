'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

// Constants
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;
const CHALLENGE_RELATION_THRESHOLD_DAYS = 30;

// Utility functions for date handling (fixes timezone issues)
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

// Validation functions
const validateHabitData = (habitData) => {
  const errors = [];
  
  if (!habitData.name || typeof habitData.name !== 'string' || !habitData.name.trim()) {
    errors.push('Habit name is required');
  }
  
  if (!habitData.category || typeof habitData.category !== 'string') {
    errors.push('Category is required');
  }
  
  if (!habitData.weeklyGoal || typeof habitData.weeklyGoal !== 'number' || habitData.weeklyGoal < 1 || habitData.weeklyGoal > 7) {
    errors.push('Weekly goal must be between 1 and 7');
  }
  
  return errors;
};

const validateChallengeData = (challengeData) => {
  const errors = [];
  
  if (!challengeData.name || typeof challengeData.name !== 'string' || !challengeData.name.trim()) {
    errors.push('Challenge name is required');
  }
  
  if (!challengeData.totalDays || typeof challengeData.totalDays !== 'number' || challengeData.totalDays < 1) {
    errors.push('Total days must be a positive number');
  }
  
  return errors;
};

export const useDatabase = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operationInProgress, setOperationInProgress] = useState(new Set());
  
  // Refs to track cleanup and prevent race conditions
  const cleanupRef = useRef(null);
  const mountedRef = useRef(true);

  // Real-time listeners for habits and challenges
  useEffect(() => {
    mountedRef.current = true;
    
    if (!user) {
      setHabits([]);
      setChallenges([]);
      setLoading(false);
      return;
    }

    try {
      // Habits listener
      const habitsQuery = query(
        collection(db, 'habits'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
        if (mountedRef.current) {
          const habitsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setHabits(habitsData);
        }
      }, (error) => {
        console.error('Error in habits listener:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
      });

      // Challenges listener (exclude archived challenges)
      const challengesQuery = query(
        collection(db, 'challenges'),
        where('userId', '==', user.uid),
        where('isArchived', '!=', true),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeChallenges = onSnapshot(challengesQuery, (snapshot) => {
        if (mountedRef.current) {
          const challengesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setChallenges(challengesData);
          setLoading(false);
        }
      }, (error) => {
        console.error('Error in challenges listener:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
      });

      // Store cleanup function
      cleanupRef.current = () => {
        unsubscribeHabits();
        unsubscribeChallenges();
      };

      return () => {
        mountedRef.current = false;
        if (cleanupRef.current) {
          cleanupRef.current();
        }
      };
    } catch (error) {
      console.error('Error setting up listeners:', error);
      setLoading(false);
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Habit operations
  const addHabit = async (habitData) => {
    if (!user) throw new Error('User not authenticated');
    
    // Validate habit data
    const validationErrors = validateHabitData(habitData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    try {
      const docRef = await addDoc(collection(db, 'habits'), {
        ...habitData,
        userId: user.uid,
        completed: 0,
        currentStreak: 0,
        completionDates: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding habit:', error);
      throw new Error(`Failed to create habit: ${error.message}`);
    }
  };

  const updateHabit = async (habitId, updates) => {
    if (!user) throw new Error('User not authenticated');
    if (!habitId) throw new Error('Habit ID is required');
    
    try {
      const habitRef = doc(db, 'habits', habitId);
      await updateDoc(habitRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      throw new Error(`Failed to update habit: ${error.message}`);
    }
  };

  const completeHabit = async (habitId) => {
    if (!user) throw new Error('User not authenticated');
    if (!habitId) throw new Error('Habit ID is required');
    
    // Prevent race conditions by checking if operation is already in progress
    const operationKey = `complete-${habitId}`;
    if (operationInProgress.has(operationKey)) {
      throw new Error('Operation already in progress');
    }
    
    setOperationInProgress(prev => new Set(prev).add(operationKey));
    
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) throw new Error('Habit not found');

      const today = new Date();
      const todayString = getLocalDateString(today);
      
      // Check if already completed today using standardized date parsing
      const existingCompletions = habit.completionDates || [];
      const alreadyCompletedToday = existingCompletions.some(dateRecord => {
        const completionDate = parseCompletionDate(dateRecord);
        return completionDate && getLocalDateString(completionDate) === todayString;
      });

      if (alreadyCompletedToday) {
        throw new Error('You already completed this habit today!');
      }

      // Calculate weekly completed count
      const { start: weekStart, end: weekEnd } = getWeekBounds(today);
      
      const thisWeekCompletions = existingCompletions.filter(dateRecord => {
        const completionDate = parseCompletionDate(dateRecord);
        return completionDate && completionDate >= weekStart && completionDate <= weekEnd;
      }).length;

      // Allow extra credit - don't cap at weekly goal
      const newCompleted = thisWeekCompletions + 1;
      
      // Calculate week streak - simplified and more reliable
      const weekStreak = calculateWeekStreak(habit, [...existingCompletions, todayString]);
      
      // Add today's completion date
      const updatedCompletionDates = [...existingCompletions, todayString];

      await updateHabit(habitId, {
        completed: newCompleted,
        currentStreak: weekStreak,
        completionDates: updatedCompletionDates,
        lastCompletedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    } finally {
      setOperationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  };

  // Simplified and more reliable week streak calculation
  const calculateWeekStreak = (habit, allCompletions) => {
    if (!habit.weeklyGoal || habit.weeklyGoal < 1) return 0;
    
    const today = new Date();
    const habitStartDate = habit.createdAt 
      ? parseCompletionDate(habit.createdAt) 
      : new Date(Date.now() - 365 * MILLISECONDS_PER_DAY);
    
    let streak = 0;
    let currentWeekDate = new Date(today);
    
    // Start from current week and go backwards
    const MAX_WEEKS_TO_CHECK = 104; // 2 years max
    let weeksChecked = 0;
    
    while (currentWeekDate >= habitStartDate && weeksChecked < MAX_WEEKS_TO_CHECK) {
      const { start: weekStart, end: weekEnd } = getWeekBounds(currentWeekDate);
      
      // Count completions in this week
      const weekCompletions = allCompletions.filter(dateRecord => {
        const completionDate = parseCompletionDate(dateRecord);
        return completionDate && completionDate >= weekStart && completionDate <= weekEnd;
      }).length;
      
      // Check if this week meets the goal
      if (weekCompletions >= habit.weeklyGoal) {
        streak++;
      } else {
        // Only break if this is not the current incomplete week
        const isCurrentWeek = weekStart <= today && today <= weekEnd;
        if (!isCurrentWeek) {
          break;
        }
        // For current week, don't count it in streak yet but don't break either
      }
      
      // Move to previous week
      currentWeekDate.setDate(currentWeekDate.getDate() - DAYS_PER_WEEK);
      weeksChecked++;
    }
    
    return streak;
  };

  const deleteHabit = async (habitId) => {
    if (!user) throw new Error('User not authenticated');
    if (!habitId) throw new Error('Habit ID is required');
    
    try {
      await deleteDoc(doc(db, 'habits', habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw new Error(`Failed to delete habit: ${error.message}`);
    }
  };

  // Challenge operations
  const addChallenge = async (challengeData) => {
    if (!user) throw new Error('User not authenticated');
    
    // Validate challenge data
    const validationErrors = validateChallengeData(challengeData);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }
    
    try {
      const docRef = await addDoc(collection(db, 'challenges'), {
        ...challengeData,
        userId: user.uid,
        currentDay: 1,
        totalDays: challengeData.totalDays || 21,
        daysCompleted: [],
        completionDates: [],
        isActive: true,
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding challenge:', error);
      throw new Error(`Failed to create challenge: ${error.message}`);
    }
  };

  const updateChallenge = async (challengeId, updates) => {
    if (!user) throw new Error('User not authenticated');
    if (!challengeId) throw new Error('Challenge ID is required');
    
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      await updateDoc(challengeRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw new Error(`Failed to update challenge: ${error.message}`);
    }
  };

  // Helper function to check if we have N consecutive days completed
  const checkConsecutiveDays = (completionDates, requiredDays) => {
    if (completionDates.length < requiredDays) return false;
    
    const today = new Date();
    const sortedDates = completionDates.map(dateStr => {
      const parsed = parseCompletionDate(dateStr);
      return parsed ? parsed : new Date(dateStr + 'T00:00:00');
    }).sort((a, b) => b - a); // Most recent first
    
    // Check last N days for consecutive completions
    for (let i = 0; i < requiredDays; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const checkDateString = getLocalDateString(checkDate);
      
      const hasCompletion = sortedDates.some(date => 
        getLocalDateString(date) === checkDateString
      );
      
      if (!hasCompletion) {
        return false; // Gap found, not consecutive
      }
    }
    
    return true; // All consecutive days completed
  };

  // Helper function to calculate current streak
  const calculateCurrentStreak = (completionDates) => {
    if (!completionDates.length) return 0;
    
    const today = new Date();
    let streak = 0;
    
    // Check backwards from today
    for (let i = 0; i < 365; i++) { // Max check 1 year
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const checkDateString = getLocalDateString(checkDate);
      
      const hasCompletion = completionDates.some(dateStr => {
        const parsed = parseCompletionDate(dateStr);
        const date = parsed ? parsed : new Date(dateStr + 'T00:00:00');
        return getLocalDateString(date) === checkDateString;
      });
      
      if (hasCompletion) {
        streak++;
      } else {
        break; // Streak broken
      }
    }
    
    return streak;
  };

  const completeDay = async (challengeId) => {
    if (!user) throw new Error('User not authenticated');
    if (!challengeId) throw new Error('Challenge ID is required');
    
    // Prevent race conditions
    const operationKey = `complete-challenge-${challengeId}`;
    if (operationInProgress.has(operationKey)) {
      throw new Error('Operation already in progress');
    }
    
    setOperationInProgress(prev => new Set(prev).add(operationKey));
    
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) throw new Error('Challenge not found');

      const today = new Date();
      const todayString = getLocalDateString(today);
      
      // Check if already completed today
      const existingCompletions = challenge.completionDates || [];
      const alreadyCompletedToday = existingCompletions.some(dateRecord => {
        const completionDate = parseCompletionDate(dateRecord);
        return completionDate && getLocalDateString(completionDate) === todayString;
      });

      if (alreadyCompletedToday) {
        throw new Error('You already completed this challenge today!');
      }
      
      // Add today's completion date
      const newCompletionDates = [...existingCompletions, todayString];
      
      // Check for 21 consecutive days (not just 21 total days)
      const isCompleted = checkConsecutiveDays(newCompletionDates, 21);
      
      // Calculate current streak (consecutive days from today backwards)
      const currentStreak = calculateCurrentStreak(newCompletionDates);
      
      await updateChallenge(challengeId, {
        completionDates: newCompletionDates,
        currentStreak: currentStreak,
        lastCompletedAt: serverTimestamp(),
        isActive: !isCompleted,
        isCompleted: isCompleted
      });

      // Auto-convert to habit if challenge is completed
      if (isCompleted) {
        setTimeout(async () => {
          try {
            await convertChallengeToHabit(challengeId);
          } catch (error) {
            console.error('Error auto-converting challenge to habit:', error);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error completing challenge day:', error);
      throw error;
    } finally {
      setOperationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationKey);
        return newSet;
      });
    }
  };

  const deleteChallenge = async (challengeId) => {
    if (!user) throw new Error('User not authenticated');
    if (!challengeId) throw new Error('Challenge ID is required');
    
    try {
      await deleteDoc(doc(db, 'challenges', challengeId));
    } catch (error) {
      console.error('Error deleting challenge:', error);
      throw new Error(`Failed to delete challenge: ${error.message}`);
    }
  };

  const archiveChallenge = async (challengeId) => {
    if (!user) throw new Error('User not authenticated');
    if (!challengeId) throw new Error('Challenge ID is required');
    
    try {
      await updateChallenge(challengeId, {
        isArchived: true,
        archivedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error archiving challenge:', error);
      throw new Error(`Failed to archive challenge: ${error.message}`);
    }
  };

  const convertChallengeToHabit = async (challengeId) => {
    if (!user) throw new Error('User not authenticated');
    if (!challengeId) throw new Error('Challenge ID is required');
    
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) throw new Error('Challenge not found');

      // Create habit from challenge
      const habitData = {
        name: challenge.name,
        category: challenge.category || "Health & Fitness",
        weeklyGoal: 7, // Daily habit = 7 times per week
        icon: challenge.icon,
        color: challenge.color || "purple",
        userId: user.uid,
        completed: 0,
        currentStreak: 0,
        completionDates: challenge.completionDates || [],
        createdAt: challenge.createdAt,
        convertedFromChallenge: true,
        originalChallengeId: challengeId
      };

      // Add the new habit
      const habitRef = await addDoc(collection(db, 'habits'), habitData);
      
      // Archive the challenge
      await archiveChallenge(challengeId);
      
      return habitRef.id;
    } catch (error) {
      console.error('Error converting challenge to habit:', error);
      throw new Error(`Failed to convert challenge to habit: ${error.message}`);
    }
  };

  // Weekly reset function (to be called on new week)
  const resetWeeklyHabits = async () => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const updates = habits.map(habit => 
        updateHabit(habit.id, { 
          completed: 0,
          weekResetAt: serverTimestamp()
        })
      );
      
      await Promise.all(updates);
    } catch (error) {
      console.error('Error resetting weekly habits:', error);
      throw new Error(`Failed to reset weekly habits: ${error.message}`);
    }
  };

  return {
    habits,
    challenges,
    loading,
    operationInProgress,
    // Habit operations
    addHabit,
    updateHabit,
    completeHabit,
    deleteHabit,
    // Challenge operations
    addChallenge,
    updateChallenge,
    completeDay,
    deleteChallenge,
    archiveChallenge,
    convertChallengeToHabit,
    // Utility
    resetWeeklyHabits
  };
}; 