/**
 * Local storage utilities for Uni-con app
 * Uses AsyncStorage for persistent data storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserProfile } from '../types';

// Storage keys
const STORAGE_KEYS = {
  USER: '@uni_con_user',
  USER_PROFILE: '@uni_con_user_profile',
  ONBOARDING_COMPLETED: '@uni_con_onboarding_completed',
  SETTINGS: '@uni_con_settings',
} as const;

// User storage functions
export const userStorage = {
  setUser: async (user: User): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  },

  getUser: async (): Promise<User | null> => {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error retrieving user from storage:', error);
      return null;
    }
  },

  removeUser: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  },
};

// User profile storage functions
export const profileStorage = {
  setProfile: async (profile: UserProfile): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving profile to storage:', error);
    }
  },

  getProfile: async (): Promise<UserProfile | null> => {
    try {
      const profileJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
      console.error('Error retrieving profile from storage:', error);
      return null;
    }
  },

  removeProfile: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    } catch (error) {
      console.error('Error removing profile from storage:', error);
    }
  },
};

// Onboarding storage functions
export const onboardingStorage = {
  setCompleted: async (completed: boolean = true): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed));
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  },

  isCompleted: async (): Promise<boolean> => {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return completed ? JSON.parse(completed) : false;
    } catch (error) {
      console.error('Error retrieving onboarding status:', error);
      return false;
    }
  },
};

// Settings storage functions
export const settingsStorage = {
  setSettings: async (settings: Record<string, any>): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  getSettings: async (): Promise<Record<string, any>> => {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settingsJson ? JSON.parse(settingsJson) : {};
    } catch (error) {
      console.error('Error retrieving settings:', error);
      return {};
    }
  },

  setSetting: async (key: string, value: any): Promise<void> => {
    try {
      const currentSettings = await settingsStorage.getSettings();
      const updatedSettings = { ...currentSettings, [key]: value };
      await settingsStorage.setSettings(updatedSettings);
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  },

  getSetting: async (key: string, defaultValue: any = null): Promise<any> => {
    try {
      const settings = await settingsStorage.getSettings();
      return settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (error) {
      console.error('Error retrieving setting:', error);
      return defaultValue;
    }
  },
};

// Clear all app data
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.ONBOARDING_COMPLETED,
      STORAGE_KEYS.SETTINGS,
    ]);
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
};

// Get all stored data (for debugging)
export const getAllStoredData = async (): Promise<Record<string, any>> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const values = await AsyncStorage.multiGet(keys);
    
    const data: Record<string, any> = {};
    values.forEach(([key, value]) => {
      data[key] = value ? JSON.parse(value) : null;
    });
    
    return data;
  } catch (error) {
    console.error('Error retrieving all stored data:', error);
    return {};
  }
};