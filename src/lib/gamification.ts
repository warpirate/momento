export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: { totalEntries: number; currentStreak: number; totalWords: number }) => boolean;
};

export const BADGES: Badge[] = [
  {
    id: 'first_entry',
    name: 'First Step',
    description: 'Created your first journal entry',
    icon: 'edit-2',
    condition: (stats) => stats.totalEntries >= 1,
  },
  {
    id: 'streak_3',
    name: 'Momentum',
    description: 'Reached a 3-day streak',
    icon: 'zap',
    condition: (stats) => stats.currentStreak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Reached a 7-day streak',
    icon: 'calendar',
    condition: (stats) => stats.currentStreak >= 7,
  },
  {
    id: 'entries_10',
    name: 'Journalist',
    description: 'Created 10 entries',
    icon: 'book',
    condition: (stats) => stats.totalEntries >= 10,
  },
  {
    id: 'entries_50',
    name: 'Author',
    description: 'Created 50 entries',
    icon: 'feather',
    condition: (stats) => stats.totalEntries >= 50,
  },
  {
    id: 'words_1000',
    name: 'Storyteller',
    description: 'Wrote 1000 words total',
    icon: 'type',
    condition: (stats) => stats.totalWords >= 1000,
  },
];

export function getUnlockedBadges(stats: { totalEntries: number; currentStreak: number; totalWords: number }) {
  return BADGES.filter(badge => badge.condition(stats));
}