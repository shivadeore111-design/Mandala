import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://feoqghwvmfucsgndqjbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlb3FnaHd2bWZ1Y3NnbmRxamJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzkzMzksImV4cCI6MjA4OTY1NTMzOX0.d-JfyoyNxkaKZmZafnnzqxum7HKjj3iWbiINReUO5DI';

const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
