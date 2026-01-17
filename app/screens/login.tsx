import React, { useState } from 'react';
import { View, Pressable, ScrollView, KeyboardAvoidingView, Platform, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Stack, Link, router } from 'expo-router';
import ThemedText from '@/components/ThemedText';
import { Button } from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AntDesign } from '@expo/vector-icons';
import { useAuth } from '../_contexts/AuthContext';
import { validateEmail } from '../_lib/validation';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validate inputs
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      Alert.alert('Invalid Email', emailValidation.error || 'Please enter a valid email');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn(email.trim().toLowerCase(), password);

      if (error) {
        // Handle specific error types
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert('Email Not Verified', 'Please check your email and verify your account before logging in.');
        } else {
          Alert.alert('Login Failed', error.message || 'An error occurred during login');
        }
      } else {
        // Success! Navigation will be handled by auth state change
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('[Login] Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };





  return (
    <>
      <Stack.Screen options={{
        headerShown: false,
        animation: 'none',
      }} />
      <View className='flex-1 bg-black'>
        <LinearGradient colors={['rgba(255,32,56,0.1)', '#000']} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            className="flex-1">
            <StatusBar style='light' />


            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              className='flex-1 justify-center w-full'

            >
              <View className=' w-full flex-1'>
                <View className=' py-14 justify-center px-10' style={{ paddingTop: insets.top + 100 }}>
                  <ThemedText className="text-4xl text-center font-outfit-bold">Go ahead and set up your account</ThemedText>
                  <ThemedText className="text-sm text-center opacity-50 mt-2">No account yet? <Link href="/screens/signup" className='text-pink-200 font-bold underline'>Signup</Link></ThemedText>
                </View>
                <View className='p-global gap-4'>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholder="Email"
                    placeholderTextColor="white"
                    className="text-white bg-white/20 rounded-full px-5 py-5"
                    editable={!loading}
                  />

                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    keyboardType="default"
                    autoCapitalize="none"
                    autoComplete="password"
                    placeholder="Password"
                    placeholderTextColor="white"
                    secureTextEntry={true}
                    className="text-white bg-white/20 rounded-full px-5 py-5"
                    editable={!loading}
                    onSubmitEditing={handleLogin}
                  />
                  <Button
                    title={loading ? "Logging in..." : "Login"}
                    size="large"
                    className="mb-4 !bg-highlight"
                    rounded="full"
                    textClassName='!text-white'
                    onPress={handleLogin}
                    disabled={loading}
                  />
                  {loading && (
                    <ActivityIndicator size="small" color="white" className="mb-4" />
                  )}
                  <Link className='underline text-center text-text text-sm mb-4' href="/screens/forgot-password">
                    Forgot Password?
                  </Link>


                  <View className='flex flex-row items-center justify-center gap-2'>
                    <Pressable
                      onPress={() => router.push('/(tabs)')}
                      className='flex-1 rounded-full flex flex-row items-center justify-center py-4'
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' }}
                    >
                      <AntDesign name="google" size={22} color="white" />
                    </Pressable>

                    <Pressable
                      onPress={() => router.push('/(tabs)')}
                      className='flex-1 rounded-full flex flex-row items-center justify-center py-4'
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' }}
                    >
                      <AntDesign name="apple" size={22} color="white" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </ScrollView>
        </LinearGradient>
      </View>

    </>
  );
}