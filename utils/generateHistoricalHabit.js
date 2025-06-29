// Utility to generate historical habit data for testing
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const generateExerciseHabit = async (userId) => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (42 * 7)); // 42 weeks ago
  
  const completionDates = [];
  let currentDate = new Date(startDate);
  
  // Generate realistic exercise patterns over 42 weeks
  while (currentDate < today) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Generate weekly patterns (averaging 3 times per week with variations)
    const patterns = [
      // Every 2 days pattern (3-4 times per week)
      [0, 2, 4, 6], // Sun, Tue, Thu, Sat
      [1, 3, 5], // Mon, Wed, Fri
      
      // 3 days in a row patterns
      [0, 1, 2], // Sun, Mon, Tue
      [1, 2, 3], // Mon, Tue, Wed
      [2, 3, 4], // Tue, Wed, Thu
      [3, 4, 5], // Wed, Thu, Fri
      [4, 5, 6], // Thu, Fri, Sat
      
      // 4 days in a row patterns
      [0, 1, 2, 3], // Sun-Wed
      [1, 2, 3, 4], // Mon-Thu
      [2, 3, 4, 5], // Tue-Fri
      [3, 4, 5, 6], // Wed-Sat
      
      // 7 days in a row (occasionally)
      [0, 1, 2, 3, 4, 5, 6],
      
      // Sometimes just 2 days
      [1, 4], // Mon, Thu
      [2, 6], // Tue, Sat
      
      // Sometimes 5 days
      [0, 1, 2, 4, 5], // Skip Wed
      [1, 2, 3, 5, 6], // Skip Thu
    ];
    
    // Pick a random pattern, ensuring EVERY week has at least 3 workouts to maintain 42-week streak
    let pattern;
    const rand = Math.random();
    if (rand < 0.05) {
      pattern = [0, 1, 2, 3, 4, 5, 6]; // 5% chance of 7 days
    } else if (rand < 0.15) {
      pattern = patterns[Math.floor(Math.random() * 4) + 7]; // 10% chance of 4-day streaks
    } else if (rand < 0.35) {
      pattern = patterns[Math.floor(Math.random() * 5) + 2]; // 20% chance of 3-day streaks
    } else if (rand < 0.70) {
      pattern = patterns[Math.floor(Math.random() * 2)]; // 35% chance of every-2-days (3-4 workouts)
    } else {
      pattern = patterns[Math.floor(Math.random() * 2) + 14]; // 30% chance of 5-day patterns
    }
    
    // Ensure every week has at least 3 workouts to maintain the 42-week streak
    if (pattern.length < 3) {
      pattern = [1, 3, 5]; // Default to Mon, Wed, Fri if somehow less than 3
    }
    
    // Add completion dates for this week
    pattern.forEach(dayOffset => {
      const workoutDate = new Date(weekStart);
      workoutDate.setDate(weekStart.getDate() + dayOffset);
      
      if (workoutDate < today) {
        completionDates.push(workoutDate.toISOString().split('T')[0]);
      }
    });
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  // Calculate stats
  const totalDays = completionDates.length;
  const totalWeeks = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24 * 7));
  const averagePerWeek = (totalDays / totalWeeks).toFixed(1);
  
  console.log(`Generated ${totalDays} workout days over ${totalWeeks} weeks (${averagePerWeek} per week average)`);
  
  // Create the habit in Firebase
  try {
    const habitData = {
      name: "💪 Exercise",
      category: "Health & Fitness",
      weeklyGoal: 3,
      icon: "💪",
      color: "emerald",
      userId: userId,
      completed: 0, // Will be calculated based on current week
      currentStreak: 0, // Will be calculated
      completionDates: completionDates,
      createdAt: {
        seconds: Math.floor(startDate.getTime() / 1000),
        nanoseconds: 0
      },
      updatedAt: serverTimestamp()
    };
    
    // Calculate current week's completions
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    
    const thisWeekCompletions = completionDates.filter(date => {
      const recordDate = new Date(date);
      return recordDate >= startOfWeek && recordDate <= endOfWeek;
    }).length;
    
    // Calculate week streak - consecutive weeks where weekly goal (3+) was met
    // Start from the most recent week that had any completions
    let weekStreak = 0;
    let currentWeekDate = new Date(today);
    
    // First, find the most recent week with completions
    let foundRecentActivity = false;
    let searchWeekDate = new Date(today);
    
    while (searchWeekDate >= startDate && !foundRecentActivity) {
      const weekStart = new Date(searchWeekDate);
      weekStart.setDate(searchWeekDate.getDate() - searchWeekDate.getDay()); // Sunday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Saturday
      
      const weekCompletions = completionDates.filter(date => {
        const recordDate = new Date(date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      }).length;
      
      if (weekCompletions > 0) {
        currentWeekDate = new Date(searchWeekDate);
        foundRecentActivity = true;
      } else {
        searchWeekDate.setDate(searchWeekDate.getDate() - 7);
      }
    }
    
    // Now calculate consecutive weeks with 3+ workouts going backwards
    while (currentWeekDate >= startDate) {
      const weekStart = new Date(currentWeekDate);
      weekStart.setDate(currentWeekDate.getDate() - currentWeekDate.getDay()); // Sunday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Saturday
      
      // Count completions in this week
      const weekCompletions = completionDates.filter(date => {
        const recordDate = new Date(date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      }).length;
      
      // Check if weekly goal was met (3+ workouts)
      if (weekCompletions >= 3) {
        weekStreak++;
      } else {
        break; // Streak broken
      }
      
      // Move to previous week
      currentWeekDate.setDate(currentWeekDate.getDate() - 7);
    }
    
    habitData.completed = thisWeekCompletions;
    habitData.currentStreak = weekStreak;
    
    const docRef = await addDoc(collection(db, 'habits'), habitData);
    
    console.log('Exercise habit created with ID:', docRef.id);
    console.log(`Current week completions: ${thisWeekCompletions}`);
    console.log(`Week streak: ${weekStreak} weeks`);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating exercise habit:', error);
    throw error;
  }
};

// Utility function to migrate existing challenges to new format
export const migrateChallengeData = (challenge) => {
  const updatedChallenge = { ...challenge };
  
  // Add completionDates if missing
  if (!updatedChallenge.completionDates) {
    updatedChallenge.completionDates = [];
    
    // If we have daysCompleted array, try to generate approximate dates
    if (updatedChallenge.daysCompleted && updatedChallenge.daysCompleted.length > 0) {
      const startDate = updatedChallenge.createdAt ? 
        new Date(updatedChallenge.createdAt.seconds * 1000) : 
        new Date(Date.now() - (updatedChallenge.daysCompleted.length * 24 * 60 * 60 * 1000));
      
      // Generate completion dates based on consecutive days from start
      updatedChallenge.completionDates = updatedChallenge.daysCompleted.map((dayNum, index) => {
        const completionDate = new Date(startDate);
        completionDate.setDate(startDate.getDate() + index);
        return completionDate.toISOString().split('T')[0];
      });
    }
  }
  
  // Add isArchived if missing
  if (updatedChallenge.isArchived === undefined) {
    updatedChallenge.isArchived = false;
  }
  
  // Add isCompleted if missing
  if (updatedChallenge.isCompleted === undefined) {
    updatedChallenge.isCompleted = updatedChallenge.currentDay > updatedChallenge.totalDays;
  }
  
  return updatedChallenge;
}; 