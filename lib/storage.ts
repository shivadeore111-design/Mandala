import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppUser } from './api';

const TOKEN_KEY = 'mandala_token';
const USER_KEY  = 'mandala_user';

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function saveUser(user: AppUser): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<AppUser | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  return JSON.parse(raw) as AppUser;
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(USER_KEY);
}
