export type BadgeCategory = 'streak' | 'entries' | 'words';

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  threshold: number;
  condition: (stats: { totalEntries: number; currentStreak: number; totalWords: number }) => boolean;
};

export const BADGES: Badge[] = [
  // Entries Family
  {
    id: 'first_entry',
    name: 'First Step',
    description: 'Created your first journal entry',
    icon: 'edit-2',
    category: 'entries',
    threshold: 1,
    condition: (stats) => stats.totalEntries >= 1,
  },
  {
    id: 'entries_10',
    name: 'Journalist',
    description: 'Created 10 entries',
    icon: 'book',
    category: 'entries',
    threshold: 10,
    condition: (stats) => stats.totalEntries >= 10,
  },
  {
    id: 'entries_50',
    name: 'Author',
    description: 'Created 50 entries',
    icon: 'feather',
    category: 'entries',
    threshold: 50,
    condition: (stats) => stats.totalEntries >= 50,
  },
  {
    id: 'entries_100',
    name: 'Biographer',
    description: 'Created 100 entries',
    icon: 'book-open',
    category: 'entries',
    threshold: 100,
    condition: (stats) => stats.totalEntries >= 100,
  },

  // Streak Family
  {
    id: 'streak_3',
    name: 'Momentum',
    description: 'Reached a 3-day streak',
    icon: 'zap',
    category: 'streak',
    threshold: 3,
    condition: (stats) => stats.currentStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Reached a 7-day streak',
    icon: 'calendar',
    category: 'streak',
    threshold: 7,
    condition: (stats) => stats.currentStreak >= 7,
  },
  {
    id: 'streak_14',
    name: 'Committed',
    description: 'Reached a 14-day streak',
    icon: 'check-circle',
    category: 'streak',
    threshold: 14,
    condition: (stats) => stats.currentStreak >= 14,
  },
  {
    id: 'streak_30',
    name: 'Unstoppable',
    description: 'Reached a 30-day streak',
    icon: 'trending-up',
    category: 'streak',
    threshold: 30,
    condition: (stats) => stats.currentStreak >= 30,
  },

  // Words Family
  {
    id: 'words_1000',
    name: 'Storyteller',
    description: 'Wrote 1000 words total',
    icon: 'type',
    category: 'words',
    threshold: 1000,
    condition: (stats) => stats.totalWords >= 1000,
  },
  {
    id: 'words_5000',
    name: 'Novelist',
    description: 'Wrote 5000 words total',
    icon: 'pen-tool',
    category: 'words',
    threshold: 5000,
    condition: (stats) => stats.totalWords >= 5000,
  },
  {
    id: 'words_10000',
    name: 'Wordsmith',
    description: 'Wrote 10,000 words total',
    icon: 'layers',
    category: 'words',
    threshold: 10000,
    condition: (stats) => stats.totalWords >= 10000,
  },
];

export function getUnlockedBadges(stats: { totalEntries: number; currentStreak: number; totalWords: number }) {
  return BADGES.filter(badge => badge.condition(stats));
}

export function getBadgesByCategory(category: BadgeCategory) {
  return BADGES.filter(badge => badge.category === category).sort((a, b) => a.threshold - b.threshold);
}

export function getNextBadge(currentBadge: Badge): Badge | null {
  const family = getBadgesByCategory(currentBadge.category);
  const currentIndex = family.findIndex(b => b.id === currentBadge.id);
  if (currentIndex !== -1 && currentIndex < family.length - 1) {
    return family[currentIndex + 1];
  }
  return null;
}

export function getDisplayBadgeForCategory(category: BadgeCategory, stats: { totalEntries: number; currentStreak: number; totalWords: number }): Badge {
  const family = getBadgesByCategory(category);
  const unlocked = family.filter(b => b.condition(stats));
  
  if (unlocked.length > 0) {
    // Return the highest unlocked badge
    return unlocked[unlocked.length - 1];
  }
  
  // If none unlocked, return the first one (locked state)
  return family[0];
}

export const WEEKLY_BADGES = [
  { id: 'week_1', name: 'Week Warrior', icon: 'calendar', description: '7 Day Streak' },
  { id: 'week_2', name: 'Two Weeks', icon: 'zap', description: '14 Day Streak' },
  { id: 'week_3', name: 'Habit Former', icon: 'anchor', description: '21 Day Streak' },
  { id: 'week_4', name: 'Monthly Master', icon: 'star', description: '28 Day Streak' },
  { id: 'week_5', name: 'Unstoppable', icon: 'trending-up', description: '35 Day Streak' },
  { id: 'week_6', name: 'Marathoner', icon: 'award', description: '42 Day Streak' },
  { id: 'week_7', name: 'Legend', icon: 'crown', description: '49 Day Streak' },
  { id: 'week_8', name: 'Titan', icon: 'sun', description: '56 Day Streak' },
];

export function getNextWeeklyBadge(currentStreak: number) {
  const badgeIndex = Math.floor(currentStreak / 7);
  if (badgeIndex >= WEEKLY_BADGES.length) {
    return WEEKLY_BADGES[WEEKLY_BADGES.length - 1];
  }
  return WEEKLY_BADGES[badgeIndex];
}