// src/services/settings.service.ts
import { UserSettings, PptOptions } from '@/types/bible'; // Added PptOptions here

const USER_SETTINGS_LOCAL_STORAGE_KEY = 'bible2NextUserSettings';

export const SettingsService = {
  getUserSettings(): UserSettings | null {
    if (typeof window === 'undefined') {
      return null; // localStorage is not available on the server
    }
    try {
      const settingsJson = localStorage.getItem(USER_SETTINGS_LOCAL_STORAGE_KEY);
      if (settingsJson) {
        return JSON.parse(settingsJson) as UserSettings;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving user settings from localStorage:', error);
      return null;
    }
  },

  saveUserSettings(settings: UserSettings): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      // Basic validation or sanitization could be added here if needed
      const settingsJson = JSON.stringify(settings);
      localStorage.setItem(USER_SETTINGS_LOCAL_STORAGE_KEY, settingsJson);
    } catch (error) {
      console.error('Error saving user settings to localStorage:', error);
    }
  },

  clearUserSettings(): void {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(USER_SETTINGS_LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing user settings from localStorage:', error);
    }
  },

  // Helper to get just default PPT options with application defaults as fallback
  getDefaultPptOptionsWithFallback(appDefaults: PptOptions): PptOptions {
    const userSettings = this.getUserSettings();
    return {
      ...appDefaults, // Start with application-wide defaults
      ...(userSettings?.defaultPptOptions || {}), // Override with user's saved defaults if they exist
    };
  }
};
