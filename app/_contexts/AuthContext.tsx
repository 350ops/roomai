/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the app using Supabase Auth.
 * Handles login, signup, logout, password reset, and session management.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../_lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authLogger } from '../_lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<{ error: AuthError | null }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
    refreshSession: () => Promise<void>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const supabase = getSupabase();

    // Initialize auth state on mount
    useEffect(() => {
        if (!isSupabaseConfigured()) {
            authLogger.warn('Supabase not configured, skipping auth initialization');
            setLoading(false);
            return;
        }

        initializeAuth();

        // Listen for auth changes
        const { data: authListener } = supabase!.auth.onAuthStateChange(
            async (event, currentSession) => {
                authLogger.debug('State change', { event });

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                // Store session token securely
                if (currentSession) {
                    await storeSessionToken(currentSession.access_token);
                } else {
                    await clearSessionToken();
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    /**
     * Initialize authentication state from stored session
     */
    const initializeAuth = async () => {
        if (!supabase) return;

        try {
            setLoading(true);

            // Get current session from Supabase
            const { data, error } = await supabase.auth.getSession();

            if (error) {
                authLogger.error('Error getting session', error);
                setUser(null);
                setSession(null);
                return;
            }

            if (data.session) {
                setSession(data.session);
                setUser(data.session.user);
                authLogger.info('Session restored for user', { email: data.session.user.email });
            } else {
                authLogger.debug('No active session found');
            }
        } catch (error) {
            authLogger.error('Initialization error', error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Sign up a new user with email and password
     */
    const signUp = async (
        email: string,
        password: string
    ): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return {
                error: {
                    message: 'Authentication not configured',
                    name: 'AuthConfigError',
                    status: 500,
                } as AuthError,
            };
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // Email confirmation required before login
                    emailRedirectTo: undefined, // Mobile app doesn't need redirect
                },
            });

            if (error) {
                authLogger.error('Sign up error', error);
                return { error };
            }

            authLogger.info('Sign up successful', { email: data.user?.email });

            // Note: User will need to verify email before they can sign in
            // Session won't be created until email is verified

            return { error: null };
        } catch (error: any) {
            authLogger.error('Unexpected sign up error', error);
            return {
                error: {
                    message: error.message || 'An unexpected error occurred',
                    name: 'UnexpectedError',
                    status: 500,
                } as AuthError,
            };
        }
    };

    /**
     * Sign in an existing user with email and password
     */
    const signIn = async (
        email: string,
        password: string
    ): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return {
                error: {
                    message: 'Authentication not configured',
                    name: 'AuthConfigError',
                    status: 500,
                } as AuthError,
            };
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                authLogger.error('Sign in error', error);
                return { error };
            }

            authLogger.info('Sign in successful', { email: data.user.email });

            // Session state will be updated via onAuthStateChange listener
            return { error: null };
        } catch (error: any) {
            authLogger.error('Unexpected sign in error', error);
            return {
                error: {
                    message: error.message || 'An unexpected error occurred',
                    name: 'UnexpectedError',
                    status: 500,
                } as AuthError,
            };
        }
    };

    /**
     * Sign out the current user
     */
    const signOut = async (): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return {
                error: {
                    message: 'Authentication not configured',
                    name: 'AuthConfigError',
                    status: 500,
                } as AuthError,
            };
        }

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                authLogger.error('Sign out error', error);
                return { error };
            }

            authLogger.info('Sign out successful');

            // Clear local state
            setUser(null);
            setSession(null);
            await clearSessionToken();

            return { error: null };
        } catch (error: any) {
            authLogger.error('Unexpected sign out error', error);
            return {
                error: {
                    message: error.message || 'An unexpected error occurred',
                    name: 'UnexpectedError',
                    status: 500,
                } as AuthError,
            };
        }
    };

    /**
     * Send password reset email
     */
    const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return {
                error: {
                    message: 'Authentication not configured',
                    name: 'AuthConfigError',
                    status: 500,
                } as AuthError,
            };
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: undefined, // Mobile app doesn't need redirect
            });

            if (error) {
                authLogger.error('Password reset error', error);
                return { error };
            }

            authLogger.info('Password reset email sent', { email });
            return { error: null };
        } catch (error: any) {
            authLogger.error('Unexpected password reset error', error);
            return {
                error: {
                    message: error.message || 'An unexpected error occurred',
                    name: 'UnexpectedError',
                    status: 500,
                } as AuthError,
            };
        }
    };

    /**
     * Update user's password (must be logged in)
     */
    const updatePassword = async (
        newPassword: string
    ): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return {
                error: {
                    message: 'Authentication not configured',
                    name: 'AuthConfigError',
                    status: 500,
                } as AuthError,
            };
        }

        if (!user) {
            return {
                error: {
                    message: 'No user logged in',
                    name: 'NoUserError',
                    status: 401,
                } as AuthError,
            };
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                authLogger.error('Password update error', error);
                return { error };
            }

            authLogger.info('Password updated successfully');
            return { error: null };
        } catch (error: any) {
            authLogger.error('Unexpected password update error', error);
            return {
                error: {
                    message: error.message || 'An unexpected error occurred',
                    name: 'UnexpectedError',
                    status: 500,
                } as AuthError,
            };
        }
    };

    /**
     * Manually refresh the session
     * Useful for keeping the session alive in long-running apps
     */
    const refreshSession = async () => {
        if (!supabase || !session) return;

        try {
            const { data, error } = await supabase.auth.refreshSession();

            if (error) {
                authLogger.error('Session refresh error', error);
                // If refresh fails, sign out the user
                await signOut();
                return;
            }

            if (data.session) {
                setSession(data.session);
                setUser(data.session.user);
                await storeSessionToken(data.session.access_token);
                authLogger.debug('Session refreshed successfully');
            }
        } catch (error) {
            authLogger.error('Unexpected session refresh error', error);
        }
    };

    // ========================================================================
    // Secure Storage Helpers
    // ========================================================================

    /**
     * Store session token in secure storage
     * TODO: Consider using expo-secure-store for enhanced security in production
     */
    const storeSessionToken = async (token: string) => {
        try {
            await AsyncStorage.setItem('session_token', token);
        } catch (error) {
            authLogger.error('Error storing session token', error);
        }
    };

    /**
     * Clear session token from secure storage
     */
    const clearSessionToken = async () => {
        try {
            await AsyncStorage.removeItem('session_token');
        } catch (error) {
            authLogger.error('Error clearing session token', error);
        }
    };

    // ========================================================================
    // Context Value
    // ========================================================================

    const value: AuthContextType = {
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
