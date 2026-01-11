import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
    return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
};

// Lazy-load Supabase client to avoid errors when env vars are missing
let _supabase: SupabaseClient<Database> | null = null;

export const getSupabase = (): SupabaseClient<Database> | null => {
    if (!isSupabaseConfigured()) {
        console.warn('[Supabase] Not configured - missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
        return null;
    }
    
    if (!_supabase) {
        // Dynamically import AsyncStorage to avoid native module errors in Expo Go
        let storage: any = undefined;
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            storage = AsyncStorage;
        } catch (e) {
            console.warn('[Supabase] AsyncStorage not available, sessions will not persist');
        }

        _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
            auth: {
                storage,
                autoRefreshToken: true,
                persistSession: !!storage,
                detectSessionInUrl: false,
            },
        });
    }
    
    return _supabase;
};

// For backwards compatibility - returns null if not configured
export const supabase = isSupabaseConfigured() 
    ? getSupabase() 
    : null;

