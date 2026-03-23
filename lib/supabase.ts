import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://feoqghwvmfucsgndqjbt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlb3FnaHd2bWZ1Y3NnbmRxamJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNzkzMzksImV4cCI6MjA4OTY1NTMzOX0.d-JfyoyNxkaKZmZafnnzqxum7HKjj3iWbiINReUO5DI';

const getStorage = () => {
  if (Platform.OS === 'web') return localStorage;
  return require('@react-native-async-storage/async-storage').default;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});