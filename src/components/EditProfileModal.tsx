import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/theme';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import Icon from 'react-native-vector-icons/Feather';
import { CalendarPicker } from './ui/CalendarPicker';
import { supabase } from '../lib/supabaseClient';
import { useAlert } from '../context/AlertContext';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  initialName: string;
  initialDob: string;
  onUpdate: () => void;
}

export const EditProfileModal = ({
  visible,
  onClose,
  initialName,
  initialDob,
  onUpdate,
}: EditProfileModalProps) => {
  const { colors, spacing, borderRadius } = useTheme();
  const { showAlert } = useAlert();
  
  const [name, setName] = useState(initialName);
  const [dob, setDob] = useState(initialDob);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setDob(initialDob);
      setPassword('');
      setShowPasswordInput(false);
    }
  }, [visible, initialName, initialDob]);

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Missing Name', 'Please enter your name.');
      return;
    }

    if (showPasswordInput && password.length < 6) {
      showAlert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const updates: any = {
        data: {
          name: name.trim(),
          date_of_birth: dob,
        },
      };

      if (showPasswordInput && password) {
        updates.password = password;
      }

      const { error } = await supabase.auth.updateUser(updates);

      if (error) throw error;

      onUpdate();
      onClose();
      showAlert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        
        <View style={styles.centeredView}>
          <Card
            style={[styles.modalView, { backgroundColor: colors.surface }]}
            padding="large"
          >
            <View style={styles.header}>
              <Typography variant="heading" style={styles.title}>
                Edit Profile
              </Typography>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="x" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              <View style={styles.inputGroup}>
                <Typography variant="label" style={styles.label}>
                  Name
                </Typography>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceHighlight,
                      color: colors.textPrimary,
                      borderColor: 'transparent',
                    },
                  ]}
                  placeholder="Your name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Typography variant="label" style={styles.label}>
                  Date of Birth
                </Typography>
                <TouchableOpacity
                  onPress={() => setShowCalendar(true)}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surfaceHighlight,
                      borderColor: 'transparent',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    },
                  ]}
                >
                  <Typography
                    color={dob ? colors.textPrimary : colors.textMuted}
                    style={{ fontSize: 16 }}
                  >
                    {dob || 'Select your birthday'}
                  </Typography>
                  <Icon name="calendar" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {!showPasswordInput ? (
                <Button
                  title="Change Password"
                  variant="ghost"
                  onPress={() => setShowPasswordInput(true)}
                  size="small"
                />
              ) : (
                <View style={styles.inputGroup}>
                  <View style={styles.passwordHeader}>
                    <Typography variant="label" style={styles.label}>
                      New Password
                    </Typography>
                    <TouchableOpacity onPress={() => {
                      setShowPasswordInput(false);
                      setPassword('');
                    }}>
                      <Typography variant="caption" color={colors.error}>Cancel</Typography>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceHighlight,
                        color: colors.textPrimary,
                        borderColor: 'transparent',
                      },
                    ]}
                    placeholder="New password (min 6 chars)"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={onClose}
                style={styles.button}
              />
              <Button
                title="Save Changes"
                onPress={handleSave}
                loading={loading}
                style={styles.button}
              />
            </View>
          </Card>
        </View>

        <CalendarPicker
          visible={showCalendar}
          onClose={() => setShowCalendar(false)}
          onSelectDate={(date) => {
            const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            setDob(utcDate.toISOString().split('T')[0]);
          }}
          initialDate={dob ? new Date(dob) : new Date()}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  centeredView: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalView: {
    width: '100%',
    borderRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
    gap: 8,
  },
  label: {
    marginLeft: 4,
  },
  input: {
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    minWidth: 100,
  },
});