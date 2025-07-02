// Utility to generate historical habit data for testing
import { doc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Constants
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;
const WEEKS_TO_GENERATE = 42;

// Local date utility to avoid timezone issues
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

export const generateExerciseHabit = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Check if user already has an exercise habit to prevent duplicates
  try {
    const existingHabitsQuery = query(
      collection(db, 'habits'),
      where('userId', '==', userId),
      where('name', '==', '💪 Exercise')
    );
    
    const existingHabits = await getDocs(existingHabitsQuery);
    
    if (!existingHabits.empty) {
      throw new Error('You already have an Exercise habit! Delete the existing one first if you want to regenerate it.');
    }
  } catch (error) {
    if (error.message.includes('already have an Exercise habit')) {
      throw error;
    }
    console.warn('Could not check for existing habits:', error);
    // Continue anyway - the check is not critical
  }

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (WEEKS_TO_GENERATE * DAYS_PER_WEEK));
  
  const completionDates = [];
  let currentDate = new Date(startDate);
  
  // Generate exactly 42 complete weeks of data (no partial weeks)
  // This ensures a perfect 42-week streak
  const todayWeekStart = new Date(today);
  todayWeekStart.setDate(today.getDate() - today.getDay()); // Sunday of current week
  
  let weeksGenerated = 0;
  
  while (weeksGenerated < WEEKS_TO_GENERATE) {
    const { start: weekStart, end: weekEnd } = getWeekBounds(currentDate);
    
    // Stop if we've reached the current week to avoid partial weeks
    if (weekStart >= todayWeekStart) {
      break;
    }
    
    // SIMPLIFIED: Just pick 3, 4, or 5 workouts randomly but guarantee minimum 3
    const numWorkouts = Math.random() < 0.5 ? 3 : (Math.random() < 0.7 ? 4 : 5);
    
    // Create a simple pattern with the chosen number of workouts
    let pattern;
    if (numWorkouts === 3) {
      pattern = [1, 3, 5]; // Mon, Wed, Fri
    } else if (numWorkouts === 4) {
      pattern = [0, 2, 4, 6]; // Sun, Tue, Thu, Sat
    } else { // 5 workouts
      pattern = [1, 2, 3, 5, 6]; // Mon, Tue, Wed, Fri, Sat
    }
    
    // Add completion dates for this complete week
    pattern.forEach(dayOffset => {
      const workoutDate = new Date(weekStart);
      workoutDate.setDate(weekStart.getDate() + dayOffset);
      
      const dateString = getLocalDateString(workoutDate);
      completionDates.push(dateString);
    });
    
    weeksGenerated++;
    // Move to next week
    currentDate.setDate(currentDate.getDate() + DAYS_PER_WEEK);
  }
  
  // Create the habit in Firebase
  try {
    const habitData = {
      name: "💪 Exercise",
      category: "Health & Fitness",
      weeklyGoal: 3,
      icon: "💪",
      color: "emerald",
      userId: userId,
      completed: 0, // Current week starts fresh
      currentStreak: 0, // Will be calculated
      completionDates: completionDates,
      createdAt: {
        seconds: Math.floor(startDate.getTime() / 1000),
        nanoseconds: 0
      },
      updatedAt: serverTimestamp(),
      generatedData: true, // Mark as generated for easy identification
      generatedAt: serverTimestamp()
    };
    
    // Calculate current week's completions (should be 0 since we only generated complete past weeks)
    const { start: currentWeekStart, end: currentWeekEnd } = getWeekBounds(today);
    
    const thisWeekCompletions = completionDates.filter(dateString => {
      const recordDate = new Date(dateString + 'T00:00:00'); // Parse as local date
      return recordDate >= currentWeekStart && recordDate <= currentWeekEnd;
    }).length;
    
    // Calculate week streak - should be exactly the number of complete weeks we generated
    // Since each week has 3+ workouts and we generated complete weeks only
    let weekStreak = 0;
    
    // Start from the most recent complete week (before current week)
    let currentWeekDate = new Date(today);
    currentWeekDate.setDate(currentWeekDate.getDate() - DAYS_PER_WEEK); // Go to previous week
    
    // Count backwards through all the weeks we generated
    for (let i = 0; i < weeksGenerated; i++) {
      const { start: weekStart, end: weekEnd } = getWeekBounds(currentWeekDate);
      
      // Count completions in this week
      const weekCompletions = completionDates.filter(dateString => {
        const recordDate = new Date(dateString + 'T00:00:00');
        return recordDate >= weekStart && recordDate <= weekEnd;
      }).length;
      
      // Check if weekly goal was met (should always be true since we generated 3+ per week)
      if (weekCompletions >= 3) {
        weekStreak++;
      } else {
        // This should never happen with our generation logic, but break if it does
        console.warn(`Week ${weekStart.toLocaleDateString()} only has ${weekCompletions} completions, expected 3+`);
        break;
      }
      
      // Move to previous week
      currentWeekDate.setDate(currentWeekDate.getDate() - DAYS_PER_WEEK);
    }
    
    habitData.completed = thisWeekCompletions;
    habitData.currentStreak = weekStreak;
    
    const docRef = await addDoc(collection(db, 'habits'), habitData);
    
    // Return success info
    return {
      id: docRef.id,
      totalCompletions: completionDates.length,
      weeksGenerated: weeksGenerated,
      currentWeekCompletions: thisWeekCompletions,
      weekStreak: weekStreak
    };
  } catch (error) {
    console.error('Error creating exercise habit:', error);
    throw new Error(`Failed to create exercise habit: ${error.message}`);
  }
};

// Utility function to migrate existing challenges to new format
export const migrateChallengeData = (challenge) => {
  const updatedChallenge = { ...challenge };
  
  // Add completionDates if missing
  if (!updatedChallenge.completionDates) {
    updatedChallenge.completionDates = [];
  }
  
  // Convert old format to new format if needed
  if (updatedChallenge.daysCompleted && Array.isArray(updatedChallenge.daysCompleted)) {
    // Convert day numbers to date strings if needed
    const createdAt = challenge.createdAt ? new Date(challenge.createdAt.seconds * 1000) : new Date();
    updatedChallenge.daysCompleted.forEach((dayNumber, index) => {
      if (typeof dayNumber === 'number') {
        const completionDate = new Date(createdAt);
        completionDate.setDate(createdAt.getDate() + dayNumber - 1);
        const dateString = getLocalDateString(completionDate);
        
        if (!updatedChallenge.completionDates.includes(dateString)) {
          updatedChallenge.completionDates.push(dateString);
        }
      }
    });
  }
  
  return updatedChallenge;
}; 