import React, {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {supabase} from '../lib/supabaseClient';
import {Logo} from '../components/ui/Logo';

// Use a single default export for the screen component to avoid any ambiguity
// when importing it into the navigation tree.
export default function AuthScreen() {
  console.log('Render AuthScreen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const {error} = await supabase.auth.signUp({
          email,
          password,
          options: {emailRedirectTo: 'momento://auth-callback'},
        });
        if (error) throw error;
        Alert.alert(
          'Verify email',
          'Check your inbox to confirm the sign-up. Use the same credentials to log in afterward.',
        );
      } else {
        const {error} = await supabase.auth.signInWithPassword({email, password});
        if (error) throw error;
      }
    } catch (error) {
      Alert.alert('Auth error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Logo size="large" />
        </View>
        <Text style={styles.heading}>Momento</Text>
        <Text style={styles.subtitle}>Sign {mode === 'signup' ? 'up' : 'in'} to continue</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Email"
          placeholderTextColor="#98A2B3"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#98A2B3"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.primaryLabel}>
            {loading ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setMode(prev => (prev === 'signup' ? 'signin' : 'signup'))}
          disabled={loading}>
          <Text style={styles.secondaryLabel}>
            {mode === 'signup'
              ? 'Already have an account? Sign in'
              : 'Need an account? Sign up'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#030712',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  heading: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: '#98A2B3',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    color: '#F8FAFC',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: '#94A3B8',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
});