'use client';

import { useState, useEffect } from 'react';
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

export const useDatabase = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listeners for habits and challenges
  useEffect(() => {
    if (!user) {
      setHabits([]);
      setChallenges([]);
      setLoading(false);
      return;
    }

    // Habits listener
    const habitsQuery = query(
      collection(db, 'habits'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      const habitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHabits(habitsData);
    });

    // Challenges listener (exclude archived challenges)
    const challengesQuery = query(
      collection(db, 'challenges'),
      where('userId', '==', user.uid),
      where('isArchived', '!=', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeChallenges = onSnapshot(challengesQuery, (snapshot) => {
      const challengesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChallenges(challengesData);
      setLoading(false);
    });

    return () => {
      unsubscribeHabits();
      unsubscribeChallenges();
    };
  }, [user]);

  // Habit operations
  const addHabit = async (habitData) => {
    if (!user) return;
    
    try {
      const docRef = await addDoc(collection(db, 'habits'), {
        ...habitData,
        userId: user.uid,
        completed: 0,
        currentStreak: 0,
        completionDates: [], // Initialize empty array for tracking daily completions
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding habit:', error);
      throw error;
    }
  };

  const updateHabit = async (habitId, updates) => {
    if (!user) return;
    
    try {
      const habitRef = doc(db, 'habits', habitId);
      await updateDoc(habitRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  };

  const completeHabit = async (habitId) => {
    if (!user) return;
    
    try {
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Check if already completed today
      const existingCompletions = habit.completionDates || [];
      const alreadyCompletedToday = existingCompletions.some(date => {
        if (date && typeof date === 'object' && date.seconds) {
          const recordDate = new Date(date.seconds * 1000);
          return recordDate.toISOString().split('T')[0] === todayString;
        }
        return date === todayString;
      });

      if (alreadyCompletedToday) {
        throw new Error('You already completed this habit today!');
      }

      // Calculate weekly completed count (reset every Monday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

      const thisWeekCompletions = existingCompletions.filter(date => {
        let recordDate;
        if (date && typeof date === 'object' && date.seconds) {
          recordDate = new Date(date.seconds * 1000);
        } else {
          recordDate = new Date(date);
        }
        return recordDate >= startOfWeek && recordDate <= endOfWeek;
      }).length;

      const newCompleted = Math.min(thisWeekCompletions + 1, habit.weeklyGoal);
      
      // Calculate week streak - consecutive weeks where weekly goal was met
      let weekStreak = 0;
      let currentWeekDate = new Date(today);
      const habitStartDate = habit.createdAt ? new Date(habit.createdAt.seconds * 1000) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      
      // Include today's completion in the calculation
      const allCompletions = [...existingCompletions, todayString];
      
      // Go backwards week by week, counting consecutive weeks that meet the goal
      while (currentWeekDate >= habitStartDate) {
        const weekStart = new Date(currentWeekDate);
        weekStart.setDate(currentWeekDate.getDate() - currentWeekDate.getDay()); // Sunday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Saturday
        
        // Count completions in this week
        const weekCompletions = allCompletions.filter(date => {
          let recordDate;
          if (date && typeof date === 'object' && date.seconds) {
            recordDate = new Date(date.seconds * 1000);
          } else {
            recordDate = new Date(date);
          }
          return recordDate >= weekStart && recordDate <= weekEnd;
        }).length;
        
        // Check if this week meets the weekly goal
        if (weekCompletions >= habit.weeklyGoal) {
          weekStreak++;
        } else {
          break; // Streak broken
        }
        
        // Move to previous week
        currentWeekDate.setDate(currentWeekDate.getDate() - 7);
      }
      
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
    }
  };

  const deleteHabit = async (habitId) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'habits', habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  };

  // Challenge operations
  const addChallenge = async (challengeData) => {
    if (!user) return;
    
    try {
      const docRef = await addDoc(collection(db, 'challenges'), {
        ...challengeData,
        userId: user.uid,
        currentDay: 1,
        totalDays: 21,
        daysCompleted: [],
        completionDates: [], // Track daily completions like habits
        isActive: true,
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding challenge:', error);
      throw error;
    }
  };

  const updateChallenge = async (challengeId, updates) => {
    if (!user) return;
    
    try {
      const challengeRef = doc(db, 'challenges', challengeId);
      await updateDoc(challengeRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  };

  const completeDay = async (challengeId) => {
    if (!user) return;
    
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Check if already completed today
      const existingCompletions = challenge.completionDates || [];
      const alreadyCompletedToday = existingCompletions.includes(todayString);

      if (alreadyCompletedToday) {
        throw new Error('You already completed this challenge today!');
      }
      
      const newCurrentDay = Math.min(challenge.currentDay + 1, challenge.totalDays);
      const newDaysCompleted = [...challenge.daysCompleted, challenge.currentDay];
      const newCompletionDates = [...existingCompletions, todayString];
      const isCompleted = newCurrentDay > challenge.totalDays;
      
      await updateChallenge(challengeId, {
        currentDay: newCurrentDay,
        daysCompleted: newDaysCompleted,
        completionDates: newCompletionDates,
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
        }, 1000); // Delay to let the UI update first
      }
    } catch (error) {
      console.error('Error completing day:', error);
      throw error;
    }
  };

  const deleteChallenge = async (challengeId) => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, 'challenges', challengeId));
    } catch (error) {
      console.error('Error deleting challenge:', error);
      throw error;
    }
  };

  const archiveChallenge = async (challengeId) => {
    if (!user) return;
    
    try {
      await updateChallenge(challengeId, {
        isArchived: true,
        archivedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error archiving challenge:', error);
      throw error;
    }
  };

  const convertChallengeToHabit = async (challengeId) => {
    if (!user) return;
    
    try {
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return;

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
        completionDates: challenge.completionDates || [], // Transfer completion history
        createdAt: challenge.createdAt, // Keep original start date
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
      throw error;
    }
  };

  // Weekly reset function (to be called on new week)
  const resetWeeklyHabits = async () => {
    if (!user) return;
    
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
      throw error;
    }
  };

  return {
    habits,
    challenges,
    loading,
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