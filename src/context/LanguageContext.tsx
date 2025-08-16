import React, { createContext, useContext, useEffect, useState } from "react";

// Language definitions
export type Language = 'en' | 'fr' | 'es' | 'de' | 'it';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const supportedLanguages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
];

// Translation keys type
export interface Translations {
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    loading: string;
    error: string;
    success: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    retry: string;
    welcome: string;
  };
  
  // Navigation
  nav: {
    dashboard: string;
    wordJudge: string;
    anagramSolver: string;
    patternMatcher: string;
    study: string;
    profile: string;
    settings: string;
    signOut: string;
  };
  
  // Settings
  settings: {
    title: string;
    subtitle: string;
    appearance: string;
    appearanceDesc: string;
    darkMode: string;
    darkModeDesc: string;
    primaryColor: string;
    fontSize: string;
    fontSizeDesc: string;
    profile: string;
    profileDesc: string;
    email: string;
    emailDesc: string;
    username: string;
    preferences: string;
    preferencesDesc: string;
    notifications: string;
    notificationsDesc: string;
    autoSave: string;
    autoSaveDesc: string;
    language: string;
    languageDesc: string;
    account: string;
    accountDesc: string;
    exportSettings: string;
    exportSettingsDesc: string;
    importSettings: string;
    importSettingsDesc: string;
    signOut: string;
    signOutDesc: string;
    deleteAccount: string;
    deleteAccountDesc: string;
    saveChanges: string;
    resetToDefault: string;
    settingsExported: string;
    settingsImported: string;
    settingsReset: string;
    offline: string;
    saving: string;
    unsavedChanges: string;
    autoSaveEnabled: string;
  };
  
  // Dashboard
  dashboard: {
    welcomeBack: string;
    subtitle: string;
    wordsMastered: string;
    dailyStreak: string;
    quizAccuracy: string;
    wordOfTheDay: string;
    quickActions: string;
    keepGoing: string;
    stayConsistent: string;
    aimHigher: string;
    points: string;
  };
  
  // Landing
  landing: {
    title: string;
    subtitle: string;
    getStarted: string;
    signIn: string;
    buildLexicon: string;
    buildLexiconDesc: string;
    powerfulLookup: string;
    powerfulLookupDesc: string;
    gamifiedQuizzes: string;
    gamifiedQuizzesDesc: string;
    readyToElevate: string;
    readyToElevateDesc: string;
    createAccount: string;
    goToDashboard: string;
  };
  
  // Quick Actions
  quickActions: {
    wordJudge: string;
    wordJudgeDesc: string;
    anagramSolver: string;
    anagramSolverDesc: string;
    studyMode: string;
    studyModeDesc: string;
    start: string;
  };
  
  // Notifications
  notifications: {
    preferencesLoaded: string;
    preferencesSaved: string;
    profileUpdated: string;
    settingsReset: string;
    settingsExported: string;
    settingsImported: string;
    signedOut: string;
    connectionLost: string;
    connectionRestored: string;
    errorLoading: string;
    errorSaving: string;
    importFailed: string;
  };
}

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isRTL: boolean;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations | null>(null);

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const translationModule = await import(`../locales/${language}.json`);
        setTranslations(translationModule.default);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        // Fallback to English
        if (language !== 'en') {
          const fallbackModule = await import('../locales/en.json');
          setTranslations(fallbackModule.default);
        }
      }
    };

    loadTranslations();
  }, [language]);

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('wordsmith_language') as Language;
    if (savedLanguage && supportedLanguages.find(l => l.code === savedLanguage)) {
      setLanguageState(savedLanguage);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      const supportedLang = supportedLanguages.find(l => l.code === browserLang);
      if (supportedLang) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('wordsmith_language', lang);
    
    // Update document language
    document.documentElement.lang = lang;
  };

  const isRTL = false; // None of our supported languages are RTL, but this is ready for Arabic, Hebrew, etc.

  // Fallback translations if not loaded yet
  const fallbackTranslations: Translations = {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      retry: 'Retry',
      welcome: 'Welcome',
    },
    nav: {
      dashboard: 'Dashboard',
      wordJudge: 'Word Judge',
      anagramSolver: 'Anagram Solver',
      patternMatcher: 'Pattern Matcher',
      study: 'Study',
      profile: 'Profile',
      settings: 'Settings',
      signOut: 'Sign Out',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Customize your WordSmith experience',
      appearance: 'Appearance',
      appearanceDesc: 'Customize the look and feel of your app',
      darkMode: 'Dark Mode',
      darkModeDesc: 'Switch between light and dark themes',
      primaryColor: 'Primary Color',
      fontSize: 'Font Size',
      fontSizeDesc: 'Adjust text size throughout the app',
      profile: 'Profile',
      profileDesc: 'Manage your account information',
      email: 'Email Address',
      emailDesc: 'Email cannot be changed from here',
      username: 'Username',
      preferences: 'Preferences',
      preferencesDesc: 'Configure your app behavior and notifications',
      notifications: 'Notifications',
      notificationsDesc: 'Receive notifications for updates and reminders',
      autoSave: 'Auto-save Settings',
      autoSaveDesc: 'Automatically save changes as you make them',
      language: 'Language',
      languageDesc: 'Choose your preferred language',
      account: 'Account',
      accountDesc: 'Manage your account and security settings',
      exportSettings: 'Export Settings',
      exportSettingsDesc: 'Download your settings as a backup file',
      importSettings: 'Import Settings',
      importSettingsDesc: 'Restore settings from a backup file',
      signOut: 'Sign Out',
      signOutDesc: 'Sign out of your account on this device',
      deleteAccount: 'Delete Account',
      deleteAccountDesc: 'Permanently delete your account and all data',
      saveChanges: 'Save Changes',
      resetToDefault: 'Reset to Default',
      settingsExported: 'Settings Exported',
      settingsImported: 'Settings Imported',
      settingsReset: 'Settings Reset',
      offline: 'You\'re offline. Changes will be saved when connection is restored.',
      saving: 'Saving changes...',
      unsavedChanges: 'You have unsaved changes',
      autoSaveEnabled: 'Changes will be saved automatically',
    },
    dashboard: {
      welcomeBack: 'Welcome back',
      subtitle: 'Ready to expand your word power today?',
      wordsMastered: 'Words Mastered',
      dailyStreak: 'Daily Streak',
      quizAccuracy: 'Quiz Accuracy',
      wordOfTheDay: 'Word of the Day',
      quickActions: 'Quick Actions',
      keepGoing: 'Keep going! 🌟',
      stayConsistent: 'Stay consistent! 🔥',
      aimHigher: 'Aim higher! 🎯',
      points: 'Points',
    },
    landing: {
      title: 'Master the Lexicon. Dominate the Board.',
      subtitle: 'Your ultimate companion for competitive word games. Train, explore, and master the dictionary like never before.',
      getStarted: 'Get Started Free',
      signIn: 'Sign In',
      buildLexicon: 'Build Your Lexicon',
      buildLexiconDesc: 'Save challenging words to your personal Cardbox and use our spaced-repetition system to achieve total mastery.',
      powerfulLookup: 'Powerful Lookup',
      powerfulLookupDesc: 'Instantly verify words, solve complex anagrams, and find high-scoring plays with our intelligent search tools.',
      gamifiedQuizzes: 'Gamified Quizzes',
      gamifiedQuizzesDesc: 'Turn learning into a game. Challenge yourself with dynamic quizzes crafted from your saved words and track your progress.',
      readyToElevate: 'Ready to Elevate Your Game?',
      readyToElevateDesc: 'Start your journey to word mastery today. It\'s free to get started.',
      createAccount: 'Create Your Account',
      goToDashboard: 'Go to Dashboard',
    },
    quickActions: {
      wordJudge: 'Word Judge',
      wordJudgeDesc: 'Verify if a word is valid in competitive play',
      anagramSolver: 'Anagram Solver',
      anagramSolverDesc: 'Find all possible words from your letters',
      studyMode: 'Study Mode',
      studyModeDesc: 'Practice with flashcards and quizzes',
      start: 'Start',
    },
    notifications: {
      preferencesLoaded: 'Preferences loaded successfully',
      preferencesSaved: 'Your preferences have been saved successfully',
      profileUpdated: 'Your profile has been updated successfully',
      settingsReset: 'All settings have been reset to default values',
      settingsExported: 'Your settings have been downloaded as a JSON file',
      settingsImported: 'Your settings have been imported successfully',
      signedOut: 'You have been signed out successfully',
      connectionLost: 'Connection lost. Working offline.',
      connectionRestored: 'Connection restored.',
      errorLoading: 'Failed to load preferences. Using defaults.',
      errorSaving: 'Failed to save preferences. Please try again.',
      importFailed: 'The selected file is not a valid settings file',
    },
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t: translations || fallbackTranslations,
      isRTL,
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};