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
  // Stop at complete weeks only - don't create partial weeks that would break streak
  const todayWeekStart = new Date(today);
  todayWeekStart.setDate(today.getDate() - today.getDay()); // Sunday of current week
  
  while (currentDate < todayWeekStart) { // Stop before current week to avoid partial weeks
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // Generate weekly patterns (averaging 3 times per week with variations)
    // ONLY patterns with 3+ days to GUARANTEE 42-week streak
    const patterns = [
      // 3-day patterns (minimum for streak)
      [1, 3, 5], // Mon, Wed, Fri (classic)
      [0, 2, 4], // Sun, Tue, Thu
      [2, 4, 6], // Tue, Thu, Sat
      [0, 1, 2], // Sun, Mon, Tue
      [1, 2, 3], // Mon, Tue, Wed
      [2, 3, 4], // Tue, Wed, Thu
      [3, 4, 5], // Wed, Thu, Fri
      [4, 5, 6], // Thu, Fri, Sat
      
      // 4-day patterns (good consistency)
      [0, 2, 4, 6], // Sun, Tue, Thu, Sat
      [1, 3, 4, 6], // Mon, Wed, Thu, Sat
      [0, 1, 2, 3], // Sun-Wed
      [1, 2, 3, 4], // Mon-Thu
      [2, 3, 4, 5], // Tue-Fri
      [3, 4, 5, 6], // Wed-Sat
      
      // 5-day patterns (strong commitment)
      [0, 1, 2, 4, 5], // Skip Wed
      [1, 2, 3, 5, 6], // Skip Thu
      [0, 2, 3, 4, 6], // Skip Mon
      [1, 2, 4, 5, 6], // Skip Wed
      
      // 6-day patterns (very strong)
      [0, 1, 2, 3, 4, 5], // Skip Sat
      [1, 2, 3, 4, 5, 6], // Skip Sun
      [0, 1, 3, 4, 5, 6], // Skip Tue
      
      // 7-day pattern (beast mode)
      [0, 1, 2, 3, 4, 5, 6]
    ];
    
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
    
    console.log(`Week ${weekStart.toLocaleDateString()}: Using ${numWorkouts}-day pattern:`, pattern);
    
    // Add completion dates for this week
    const weekCompletions = [];
    pattern.forEach(dayOffset => {
      const workoutDate = new Date(weekStart);
      workoutDate.setDate(weekStart.getDate() + dayOffset);
      
      const dateString = workoutDate.toISOString().split('T')[0];
      completionDates.push(dateString);
      weekCompletions.push(dateString);
    });
    
    console.log(`Added ${weekCompletions.length} completions for week: ${weekCompletions.join(', ')}`);
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  // Calculate stats
  const totalDays = completionDates.length;
  const totalWeeks = Math.ceil((todayWeekStart - startDate) / (1000 * 60 * 60 * 24 * 7));
  const averagePerWeek = (totalDays / totalWeeks).toFixed(1);
  
  console.log(`Generated ${totalDays} workout days over ${totalWeeks} complete weeks (${averagePerWeek} per week average)`);
  
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
    // Start from the most recent COMPLETED week (not current partial week)
    let weekStreak = 0;
    
    // Start from the previous week (not current week) since current week might be incomplete
    let currentWeekDate = new Date(today);
    currentWeekDate.setDate(currentWeekDate.getDate() - 7); // Go back one week
    
    console.log('🔍 Streak calculation for generated habit:');
    console.log('Start date:', startDate.toLocaleDateString());
    console.log('Today:', today.toLocaleDateString());
    console.log('Total completion dates:', completionDates.length);
    console.log('Starting streak calculation from:', currentWeekDate.toLocaleDateString());
    
    // Go backwards week by week, counting consecutive weeks that meet the goal
    let weekCount = 0;
    while (currentWeekDate >= startDate && weekCount < 45) {  // Safety limit
      const weekStart = new Date(currentWeekDate);
      weekStart.setDate(currentWeekDate.getDate() - currentWeekDate.getDay()); // Sunday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Saturday
      
      // Count completions in this week
      const weekCompletions = completionDates.filter(date => {
        const recordDate = new Date(date);
        return recordDate >= weekStart && recordDate <= weekEnd;
      }).length;
      
      console.log(`Week ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}: ${weekCompletions} completions (goal: 3)`);
      
      // Check if weekly goal was met (3+ workouts)
      if (weekCompletions >= 3) {
        weekStreak++;
        console.log(`✅ Week goal met! Streak: ${weekStreak}`);
      } else {
        console.log(`❌ Week goal not met (${weekCompletions}/3). Breaking streak at ${weekStreak}`);
        break; // Streak broken
      }
      
      // Move to previous week
      currentWeekDate.setDate(currentWeekDate.getDate() - 7);
      weekCount++;
    }
    
    console.log(`🔥 Final calculated streak: ${weekStreak} weeks`);
    
    // If we didn't get the expected 42 weeks, there's still a bug
    if (weekStreak < 42) {
      console.warn(`⚠️ Expected 42 week streak but got ${weekStreak}. Check pattern generation.`);
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