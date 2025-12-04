import React, {useEffect, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

import {supabase} from '../lib/supabaseClient';
import {Logo} from '../components/ui/Logo';
import {useAlert} from '../context/AlertContext';
import {useTheme} from '../theme/theme';
import {Button} from '../components/ui/Button';
import {Typography} from '../components/ui/Typography';
import {Card} from '../components/ui/Card';
import {CalendarPicker} from '../components/ui/CalendarPicker';
import Icon from 'react-native-vector-icons/Feather';
import {TouchableOpacity} from 'react-native';

const {width} = Dimensions.get('window');

const ALLOWED_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

export default function AuthScreen() {
  console.log('Render AuthScreen');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [signupStep, setSignupStep] = useState<1 | 2 | 3 | 4>(1);

  const {showAlert} = useAlert();
  const {colors} = useTheme();

  // Background animated gradient-ish blobs
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;

  // Card entrance + subtle float
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(40)).current;
  const cardFloat = useRef(new Animated.Value(0)).current;

  // Mode toggle underline animation
  const modeAnim = useRef(new Animated.Value(mode === 'signup' ? 0 : 1)).current;

  // Input focus / active animations
  const [activeField, setActiveField] = useState<
    | 'name'
    | 'dob'
    | 'email'
    | 'password'
    | 'confirmPassword'
    | null
  >(null);

  useEffect(() => {
    // Background blobs looping animation
    const loopBlob = (anim: Animated.Value, toValue: number, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    loopBlob(blob1, 1, 9000);
    loopBlob(blob2, 1, 12000);

    // Card entrance
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Gentle float after entrance
      Animated.loop(
        Animated.sequence([
          Animated.timing(cardFloat, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(cardFloat, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  }, [blob1, blob2, cardOpacity, cardTranslateY, cardFloat]);

  useEffect(() => {
    Animated.timing(modeAnim, {
      toValue: mode === 'signup' ? 0 : 1,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [mode, modeAnim]);

  const validateEmail = (value: string) => {
    const domain = value.split('@')[1];
    if (!domain) return false;
    return ALLOWED_DOMAINS.includes(domain.toLowerCase());
  };

  async function handleSubmit() {
    if (!email || !password) {
      showAlert('Missing info', 'Enter both email and password.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        showAlert('Missing name', 'Please enter your name so we can personalize your experience.');
        return;
      }

      if (!dateOfBirth.trim()) {
        showAlert(
          'Missing birthday',
          'Please enter your date of birth so we can celebrate you on your special day.',
        );
        return;
      }

      if (!validateEmail(email)) {
        showAlert(
          'Invalid Email',
          `Please use a valid email provider (e.g., ${ALLOWED_DOMAINS.join(', ')}).`,
        );
        return;
      }

      if (!confirmPassword) {
        showAlert('Missing confirmation', 'Please confirm your password.');
        return;
      }

      if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'Make sure both passwords are the same.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const {error} = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: 'momento://auth-callback',
            data: {
              name: name.trim(),
              date_of_birth: dateOfBirth.trim(),
            },
          },
        });
        if (error) throw error;
        showAlert(
          'Verify email',
          'Check your inbox to confirm the sign-up. Use the same credentials to log in afterward.',
        );
      } else {
        const {error} = await supabase.auth.signInWithPassword({email, password});
        if (error) throw error;
      }
    } catch (error) {
      showAlert('Auth error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const blob1Style = {
    transform: [
      {
        translateX: blob1.interpolate({
          inputRange: [0, 1],
          outputRange: [-width * 0.2, width * 0.1],
        }),
      },
      {
        translateY: blob1.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, 20],
        }),
      },
      {
        scale: blob1.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        }),
      },
    ],
    opacity: 0.45,
  };

  const blob2Style = {
    transform: [
      {
        translateX: blob2.interpolate({
          inputRange: [0, 1],
          outputRange: [width * 0.1, -width * 0.15],
        }),
      },
      {
        translateY: blob2.interpolate({
          inputRange: [0, 1],
          outputRange: [60, -10],
        }),
      },
      {
        scale: blob2.interpolate({
          inputRange: [0, 1],
          outputRange: [1.1, 0.95],
        }),
      },
    ],
    opacity: 0.35,
  };

  const floatTranslateY = cardFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const underlineTranslateX = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (width * 0.4) / 2], // half of toggle width
  });

  return (
    <KeyboardAvoidingView
      style={[styles.safeArea, {backgroundColor: colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.absoluteFill}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.blob,
            {
              backgroundColor: colors.primaryLight,
            },
            blob1Style,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.blob,
            {
              backgroundColor: colors.secondary,
            },
            blob2Style,
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.noiseOverlay,
            {backgroundColor: colors.background + '00'},
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Animated.View
          style={[
            styles.container,
            {
              opacity: cardOpacity,
              transform: [
                {translateY: cardTranslateY},
                {translateY: floatTranslateY},
              ],
            },
          ]}>
          <View style={styles.logoContainer}>
            <Logo size="large" />
          </View>

          <Card style={styles.card} variant="elevated" padding="large">
            <View style={styles.headerContainer}>
              <Typography variant="heading" align="center" style={styles.heading}>
                {mode === 'signup' ? 'Create your cozy corner' : 'Welcome back to Momento'}
              </Typography>
              <Typography variant="body" align="center" style={styles.subtitle}>
                {mode === 'signup'
                  ? 'A soft little space just for your thoughts.'
                  : 'Pick up your story right where you left it.'}
              </Typography>
            </View>

            <View style={styles.formContainer}>
              {mode === 'signup' && (
                <>
                  {signupStep === 1 && (
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
                            borderColor:
                              activeField === 'name' ? colors.primaryLight : 'transparent',
                          },
                        ]}
                        placeholder="How should we call you?"
                        placeholderTextColor={colors.textMuted}
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setActiveField('name')}
                        onBlur={() => setActiveField(null)}
                      />
                      <Typography variant="caption" style={styles.helperText}>
                        We'll use this to personalize your space.
                      </Typography>
                    </View>
                  )}

                  {signupStep === 2 && (
                    <View style={styles.inputGroup}>
                      <Typography variant="label" style={styles.label}>
                        Date of birth
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
                        ]}>
                        <Typography
                          color={dateOfBirth ? colors.textPrimary : colors.textMuted}
                          style={{fontSize: 16}}>
                          {dateOfBirth || 'Select your birthday'}
                        </Typography>
                        <Icon name="calendar" size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                      <Typography variant="caption" style={styles.helperText}>
                        So we can send you a little birthday wish.
                      </Typography>
                    </View>
                  )}

                  {signupStep === 3 && (
                    <View style={styles.inputGroup}>
                      <Typography variant="label" style={styles.label}>
                        Email
                      </Typography>
                      <TextInput
                        style={[
                          styles.input,
                          {
                            backgroundColor: colors.surfaceHighlight,
                            color: colors.textPrimary,
                            borderColor:
                              activeField === 'email' ? colors.primaryLight : 'transparent',
                          },
                        ]}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="hello@gmail.com"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setActiveField('email')}
                        onBlur={() => setActiveField(null)}
                      />
                      <Typography variant="caption" style={styles.helperText}>
                        Only trusted email providers are allowed to keep spam away.
                      </Typography>
                    </View>
                  )}

                  {signupStep === 4 && (
                    <>
                      <View style={styles.inputGroup}>
                        <Typography variant="label" style={styles.label}>
                          Password
                        </Typography>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.surfaceHighlight,
                              color: colors.textPrimary,
                              borderColor:
                                activeField === 'password'
                                  ? colors.primaryLight
                                  : 'transparent',
                            },
                          ]}
                          placeholder="••••••••"
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry
                          value={password}
                          onChangeText={setPassword}
                          onFocus={() => setActiveField('password')}
                          onBlur={() => setActiveField(null)}
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Typography variant="label" style={styles.label}>
                          Confirm password
                        </Typography>
                        <TextInput
                          style={[
                            styles.input,
                            {
                              backgroundColor: colors.surfaceHighlight,
                              color: colors.textPrimary,
                              borderColor:
                                activeField === 'confirmPassword'
                                  ? colors.primaryLight
                                  : 'transparent',
                            },
                          ]}
                          placeholder="••••••••"
                          placeholderTextColor={colors.textMuted}
                          secureTextEntry
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          onFocus={() => setActiveField('confirmPassword')}
                          onBlur={() => setActiveField(null)}
                        />
                      </View>
                    </>
                  )}
                </>
              )}

              {mode === 'signup' && (
                <View style={styles.signupNavRow}>
                  {signupStep > 1 && (
                    <TouchableOpacity
                      onPress={() =>
                        setSignupStep(prev => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev))
                      }>
                      <Typography
                        variant="body"
                        style={styles.signupNavText}
                        color={colors.textMuted}>
                        Back
                      </Typography>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      if (signupStep < 4) {
                        if (signupStep === 1 && !name.trim()) {
                          showAlert(
                            'Missing name',
                            'Please enter your name so we can personalize your experience.',
                          );
                          return;
                        }
                        if (signupStep === 2 && !dateOfBirth.trim()) {
                          showAlert(
                            'Missing birthday',
                            'Please enter your date of birth so we can celebrate you on your special day.',
                          );
                          return;
                        }
                        if (signupStep === 3 && !email.trim()) {
                          showAlert('Missing email', 'Please enter your email.');
                          return;
                        }
                        setSignupStep(prev => ((prev + 1) as 1 | 2 | 3 | 4));
                        return;
                      }
                      handleSubmit();
                    }}>
                    <Typography
                      variant="body"
                      style={styles.signupNavText}
                      color={colors.primary}>
                      {signupStep === 4 ? 'Create my space ' : 'Next '}
                      <Icon name="chevron-right" size={16} color={colors.primary} />
                    </Typography>
                  </TouchableOpacity>
                </View>
              )}

              {mode === 'signin' && (
                <>
                  <View style={styles.inputGroup}>
                    <Typography variant="label" style={styles.label}>
                      Email
                    </Typography>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceHighlight,
                          color: colors.textPrimary,
                          borderColor:
                            activeField === 'email' ? colors.primaryLight : 'transparent',
                        },
                      ]}
                      autoCapitalize="none"
                      autoCorrect={false}
                      placeholder="hello@gmail.com"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setActiveField('email')}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Typography variant="label" style={styles.label}>
                      Password
                    </Typography>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surfaceHighlight,
                          color: colors.textPrimary,
                          borderColor:
                            activeField === 'password' ? colors.primaryLight : 'transparent',
                        },
                      ]}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setActiveField('password')}
                      onBlur={() => setActiveField(null)}
                    />
                  </View>

                  <Button
                    title="Enter my space"
                    onPress={handleSubmit}
                    loading={loading}
                    size="large"
                    style={styles.submitButton}
                  />
                </>
              )}

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, {backgroundColor: colors.surfaceHighlight}]} />
                <Typography variant="caption" style={styles.dividerText}>
                  {mode === 'signup' ? 'Already journaling?' : 'New to Momento?'}
                </Typography>
                <View style={[styles.divider, {backgroundColor: colors.surfaceHighlight}]} />
              </View>

              <Button
                title={
                  mode === 'signup'
                    ? 'I already have an account – sign me in'
                    : 'Create a new cozy account'
                }
                onPress={() => setMode(prev => (prev === 'signup' ? 'signin' : 'signup'))}
                variant="ghost"
                size="small"
              />
            </View>
          </Card>

          <Typography variant="caption" align="center" style={styles.footerText}>
            By continuing, you agree to our Terms & Privacy Policy
          </Typography>
        </Animated.View>
      </ScrollView>

      <CalendarPicker
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelectDate={date => {
          // Use UTC date to avoid timezone issues
          const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          setDateOfBirth(utcDate.toISOString().split('T')[0]);
        }}
        initialDate={dateOfBirth ? new Date(dateOfBirth) : new Date()}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width,
    top: -width * 0.2,
    left: -width * 0.1,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    padding: 24,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  card: {
    width: '100%',
    borderRadius: 28,
  },
  headerContainer: {
    marginBottom: 20,
    gap: 8,
  },
  heading: {
    fontSize: 28,
  },
  subtitle: {
    opacity: 0.85,
  },
  modeToggleContainer: {
    marginBottom: 20,
  },
  modeToggleTrack: {
    borderRadius: 999,
    padding: 4,
    overflow: 'hidden',
  },
  modeToggleThumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: (width * 0.4) / 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modeToggleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modeLabel: {
    flex: 1,
    paddingVertical: 8,
  },
  modeLabelActive: {
    opacity: 1,
  },
  formContainer: {
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    marginLeft: 4,
  },
  helperText: {
    marginLeft: 4,
    opacity: 0.7,
  },
  input: {
    borderRadius: 18,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 18,
  },
  signupNavRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signupNavText: {
    fontSize: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    opacity: 0.7,
  },
  footerText: {
    marginTop: 28,
    opacity: 0.55,
  },
});