import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { database } from '../db';
import Entry from '../db/model/Entry';
import { calculateStreak } from '../lib/streaks';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { Typography } from '../components/ui/Typography';
import { Card } from '../components/ui/Card';
import { useTheme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BADGES, getUnlockedBadges } from '../lib/gamification';

type ProfileStats = {
  totalEntries: number;
  currentStreak: number;
  totalWords: number;
  firstEntryDate: Date | null;
};

export default function ProfileScreen() {
  console.log('Render ProfileScreen');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { colors, spacing, borderRadius } = useTheme();

  const [stats, setStats] = useState<ProfileStats>({
    totalEntries: 0,
    currentStreak: 0,
    totalWords: 0,
    firstEntryDate: null,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [stealthMode, setStealthMode] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const entries = await database.get<Entry>('entries').query().fetch();

      const totalEntries = entries.length;
      const currentStreak = calculateStreak(entries.map(e => e.createdAt));
      const totalWords = entries.reduce(
        (acc, entry) => acc + entry.content.split(/\s+/).length,
        0,
      );

      let firstEntryDate: Date | null = null;
      if (entries.length > 0) {
        const sorted = entries.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
        );
        firstEntryDate = sorted[0].createdAt;
      }

      setStats({
        totalEntries,
        currentStreak,
        totalWords,
        firstEntryDate,
      });
    };

    fetchStats();
  }, []);

  const email = session?.user?.email ?? 'Unknown email';
  const userName = session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || email.split('@')[0] || 'User';

  const accountCreatedAt = useMemo(() => {
    const created = session?.user?.created_at;
    if (!created) return null;
    const d = new Date(created);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }, [session]);

  const initials = useMemo(() => {
    const nameToUse = userName !== 'User' ? userName : email;
    if (!nameToUse) return '?';
    const parts = nameToUse.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    } else {
      return nameToUse.slice(0, 2).toUpperCase();
    }
  }, [userName, email]);

  const obfuscateEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) return `${localPart[0]}*@${domain}`;
    return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
  };

  const StatCard = ({
    label,
    value,
    subtext,
  }: {
    label: string;
    value: string | number;
    subtext?: string;
  }) => (
    <Card style={styles.statCard}>
      <Typography style={styles.statValue} color={colors.primaryLight}>{value}</Typography>
      <Typography variant="caption" style={styles.statLabel}>{label}</Typography>
      {subtext && <Typography variant="caption" style={styles.statSubtext}>{subtext}</Typography>}
    </Card>
  );

  const unlockedBadges = getUnlockedBadges(stats);

  return (
    <ScreenLayout>
      <View style={[styles.header, { padding: spacing.m }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Typography variant="heading">Account</Typography>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.m }]}>
        <Card style={[styles.profileCard, { borderColor: colors.surfaceHighlight }]} padding="medium">
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.surfaceHighlight }]}>
              <Typography style={styles.avatarInitials}>{initials}</Typography>
            </View>

            <View style={[styles.streakBadge, { backgroundColor: colors.background, borderColor: colors.secondary }]}>
              <MaterialCommunityIcon
                name="fire"
                size={14}
                color={colors.error}
                style={styles.streakIcon}
              />
              <Typography style={styles.streakCount} color={colors.secondary}>
                {stats.currentStreak}
              </Typography>
            </View>
          </View>

          <View style={styles.profileTextBlock}>
            <Typography variant="subheading">{userName}</Typography>
            <View style={styles.emailRow}>
              <Typography variant="caption" style={styles.emailText}>
                {stealthMode ? obfuscateEmail(email) : email}
              </Typography>
              <TouchableOpacity 
                onPress={() => setStealthMode(!stealthMode)} 
                style={styles.stealthButton}
              >
                <Icon 
                  name={stealthMode ? "eye-off" : "eye"} 
                  size={16} 
                  color={colors.textMuted} 
                />
              </TouchableOpacity>
            </View>
            <Typography variant="caption">
              {accountCreatedAt
                ? `Member since ${accountCreatedAt.toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}`
                : 'Member since —'}
            </Typography>
          </View>
        </Card>

        <View style={styles.sectionHeaderRow}>
          <Typography variant="subheading">Your Journey</Typography>
        </View>

        <Card style={[styles.heroCard, { borderColor: colors.primary }]} padding="medium">
          <Typography style={styles.heroValue} color={colors.primary}>{stats.currentStreak}</Typography>
          <Typography variant="subheading" style={styles.heroLabel}>Day Streak</Typography>
          <Typography variant="body" color={colors.textMuted}>Keep the momentum going!</Typography>
        </Card>

        <View style={[styles.grid, { gap: spacing.m }]}>
          <StatCard label="Total Entries" value={stats.totalEntries} />
          <StatCard
            label="Words Written"
            value={stats.totalWords.toLocaleString()}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Typography variant="subheading">Badges</Typography>
        </View>

        <View style={styles.badgesGrid}>
          {BADGES.map(badge => {
            const isUnlocked = unlockedBadges.some(b => b.id === badge.id);
            return (
              <View key={badge.id} style={[styles.badgeItem, { opacity: isUnlocked ? 1 : 0.4 }]}>
                <View style={[styles.badgeIcon, { backgroundColor: isUnlocked ? colors.primary + '20' : colors.surfaceHighlight }]}>
                  <Icon name={badge.icon} size={24} color={isUnlocked ? colors.primary : colors.textMuted} />
                </View>
                <Typography variant="caption" style={{ textAlign: 'center', marginTop: 4 }}>{badge.name}</Typography>
              </View>
            );
          })}
        </View>

        <Card style={styles.milestoneCard}>
          <Typography variant="label" color={colors.textMuted} style={styles.milestoneTitle}>JOURNALING SINCE</Typography>
          <Typography variant="subheading">
            {stats.firstEntryDate
              ? stats.firstEntryDate.toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Just started'}
          </Typography>
        </Card>

        <View style={styles.quoteCard}>
          <Typography style={styles.quoteText} color={colors.textSecondary}>
            "Journaling is like whispering to one's self and listening at the same time."
          </Typography>
          <Typography style={styles.quoteAuthor} color={colors.textMuted}>— Mina Murray</Typography>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  backButton: {
    padding: 8,
  },
  content: {
    gap: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
  },
  avatarWrapper: {
    marginRight: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
  },
  streakBadge: {
    position: 'absolute',
    right: -6,
    bottom: -4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  streakIcon: {
    marginRight: 2,
  },
  streakCount: {
    fontWeight: '700',
    fontSize: 13,
  },
  profileTextBlock: {
    flex: 1,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  emailText: {
    flex: 1,
    marginRight: 8,
  },
  stealthButton: {
    padding: 4,
    borderRadius: 12,
  },
  sectionHeaderRow: {
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCard: {
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
  },
  heroValue: {
    fontSize: 64,
    fontWeight: '800',
    lineHeight: 70,
  },
  heroLabel: {
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  badgeItem: {
    alignItems: 'center',
    width: '30%',
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  milestoneCard: {
    padding: 20,
    alignItems: 'center',
  },
  milestoneTitle: {
    marginBottom: 8,
    letterSpacing: 1,
  },
  quoteCard: {
    marginTop: 20,
    padding: 20,
    opacity: 0.7,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  quoteAuthor: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
});