import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from './ui/Typography';
import { useTheme } from '../theme/theme';
import Icon from 'react-native-vector-icons/Feather';
import { TrendAlert } from '../lib/trendAnalysis';

interface TrendAlertCardProps {
  alert: TrendAlert;
  onDismiss?: () => void;
}

export function TrendAlertCard({ alert, onDismiss }: TrendAlertCardProps) {
  const { colors, spacing, borderRadius } = useTheme();
  
  const getSeverityColors = () => {
    switch (alert.severity) {
      case 'celebration':
        return {
          bg: '#10b98115',
          border: '#10b98140',
          icon: '#10b981',
        };
      case 'warning':
        return {
          bg: '#f59e0b15',
          border: '#f59e0b40',
          icon: '#f59e0b',
        };
      case 'info':
      default:
        return {
          bg: colors.primaryLight + '15',
          border: colors.primaryLight + '40',
          icon: colors.primary,
        };
    }
  };
  
  const severityColors = getSeverityColors();
  
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: severityColors.bg,
          borderColor: severityColors.border,
          borderRadius: borderRadius.m,
          padding: spacing.m,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: severityColors.icon + '20' }]}>
          <Icon name={alert.icon} size={18} color={severityColors.icon} />
        </View>
        <View style={styles.textContainer}>
          <Typography variant="label" style={styles.title}>
            {alert.title}
          </Typography>
          <Typography variant="caption" color={colors.textSecondary} style={styles.message}>
            {alert.message}
          </Typography>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Icon name="x" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginTop: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
