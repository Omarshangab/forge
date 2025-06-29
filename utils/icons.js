import { 
  GiWeightLiftingUp,
  GiBookshelf,
  GiMeditation,
  GiWaterDrop,
  GiSunrise,
  GiQuillInk,
  GiWalk,
  GiSmartphone,
  GiPaintBrush,
  GiHealthNormal,
  GiPhone,
  GiMusicalNotes,
  GiLightningTrio,
  GiFlame,
  GiBullseye,
  GiLightBulb,
  GiRocket,
  GiStarStruck,
  GiPartyPopper,
  GiTrophyCup,
  GiSparkles,
  GiHeartWings,
  GiBrain,
  GiColdHeart,
  GiShower,
  GiStrongMan,
  GiOpenBook,
  GiSilence,
  GiBottleVapors,
  GiAlarmClock,
  GiScrollQuill,
  GiCarrot,
  GiArtificialIntelligence,
  GiFootsteps,
  GiMusicalScore,
  GiGameConsole,
  GiShoppingBag,
  GiPizzaSlice,
  GiTheater,
  GiAirplane,
  GiFilmStrip,
  GiWeight,
  GiMicrophone
} from 'react-icons/gi';

// Icon mapping for habits and challenges
export const HABIT_ICONS = {
  // Exercise & Fitness
  'Exercise': GiWeightLiftingUp,
  'Workout': GiStrongMan,
  'Run': GiFootsteps,
  'Walk': GiWalk,
  'Gym': GiWeight,
  
  // Learning & Reading
  'Read': GiBookshelf,
  'Study': GiOpenBook,
  'Learn': GiBrain,
  'Music': GiMusicalNotes,
  'Practice': GiMusicalScore,
  
  // Health & Wellness
  'Water': GiWaterDrop,
  'Drink': GiBottleVapors,
  'Health': GiHealthNormal,
  'Healthy': GiCarrot,
  'Meditate': GiMeditation,
  'Meditation': GiMeditation,
  
  // Productivity
  'Wake': GiSunrise,
  'Early': GiAlarmClock,
  'Journal': GiQuillInk,
  'Write': GiScrollQuill,
  'Digital': GiSilence,
  'Phone': GiSmartphone,
  
  // Creative
  'Creative': GiPaintBrush,
  'Art': GiArtificialIntelligence,
  'Paint': GiPaintBrush,
  
  // Social
  'Call': GiPhone,
  'Family': GiHeartWings,
  
  // Challenges
  'Cold': GiColdHeart,
  'Shower': GiShower,
  'No Social Media': GiSilence,
  'No Junk Food': GiCarrot,
  'Gratitude': GiHeartWings,
  
  // Default/Generic
  'Default': GiLightningTrio,
  'Energy': GiLightningTrio,
  'Fire': GiFlame,
  'Target': GiBullseye,
  'Idea': GiLightBulb,
  'Rocket': GiRocket,
  'Star': GiStarStruck,
  'Party': GiPartyPopper,
  'Trophy': GiTrophyCup,
  'Sparkle': GiSparkles
};

// Reward icons
export const REWARD_ICONS = {
  'Shopping': GiShoppingBag,
  'Food': GiPizzaSlice,
  'Book': GiBookshelf,
  'Game': GiGameConsole,
  'Spa': GiHeartWings,
  'Trip': GiAirplane,
  'Movie': GiFilmStrip,
  'Concert': GiMicrophone,
  'Equipment': GiWeight,
  'Theater': GiTheater
};

// Function to get icon based on habit/challenge name
export const getHabitIcon = (name) => {
  if (!name) return HABIT_ICONS.Default;
  
  const searchName = name.toLowerCase();
  
  // Check for exact matches first
  for (const [key, icon] of Object.entries(HABIT_ICONS)) {
    if (searchName.includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  // Return default if no match found
  return HABIT_ICONS.Default;
};

// Function to get reward icon
export const getRewardIcon = (reward) => {
  if (!reward) return HABIT_ICONS.Default;
  
  const searchReward = reward.toLowerCase();
  
  for (const [key, icon] of Object.entries(REWARD_ICONS)) {
    if (searchReward.includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  return HABIT_ICONS.Default;
};

// Category icons
export const CATEGORY_ICONS = {
  'Health & Fitness': GiStrongMan,
  'Learning': GiBookshelf,
  'Mindfulness': GiMeditation,
  'Productivity': GiBullseye,
  'Creativity': GiPaintBrush,
  'Social': GiHeartWings,
  'Wellness': GiHealthNormal
};

export const getCategoryIcon = (category) => {
  return CATEGORY_ICONS[category] || HABIT_ICONS.Default;
}; 