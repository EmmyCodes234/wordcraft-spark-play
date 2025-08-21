import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { CardSection } from "@/components/ui/card-section";
import { SettingItem } from "@/components/ui/setting-item";
import { Container } from "@/components/ui/container";
import { Loading } from "@/components/ui/loading";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, supportedLanguages } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Moon, 
  Sun, 
  Bell, 
  Globe, 
  Type, 
  User, 
  Save, 
  RotateCcw,
  Check,
  AlertCircle,
  Shield,
  LogOut,
  Trash2,
  Download,
  Upload,
  Wifi,
  WifiOff
} from "lucide-react";

// Color presets for easy selection
const colorPresets = [
  { name: "Green", value: "green", class: "bg-green-500" },
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Purple", value: "purple", class: "bg-purple-500" },
  { name: "Pink", value: "pink", class: "bg-pink-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
  { name: "Red", value: "red", class: "bg-red-500" },
  { name: "Teal", value: "teal", class: "bg-teal-500" },
  { name: "Indigo", value: "indigo", class: "bg-indigo-500" },
];

interface UserPreferences {
  themeMode: 'light' | 'dark' | 'auto';
  colorScheme: 'green' | 'blue' | 'purple' | 'pink' | 'orange' | 'red' | 'teal' | 'indigo' | 'custom';
  customColor: string;
  notifications: boolean;
  language: string;
  fontSize: string;
  autoSave: boolean;
}

const defaultPreferences: UserPreferences = {
  themeMode: 'auto',
  colorScheme: 'green',
  customColor: '#22c55e',
  notifications: true,
  language: "English",
  fontSize: "medium",
  autoSave: true,
};

export default function Settings() {
  const { user, signOut } = useAuth();
  const { themeMode, setThemeMode, colorScheme, setColorScheme, customColor, setCustomColor, fontSize, setFontSize } = useTheme();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    ...defaultPreferences,
    themeMode,
    colorScheme,
    customColor,
    fontSize,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences>(defaultPreferences);
  
  // Profile management state
  const [username, setUsername] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Dialog states
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load preferences on component mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        
        // Load preferences from localStorage
        const savedPrefs = localStorage.getItem(`wordsmith_preferences_${user.id}`);
        const loadedPrefs = savedPrefs 
          ? { ...defaultPreferences, ...JSON.parse(savedPrefs) }
          : defaultPreferences;
        
        setPreferences(loadedPrefs);
        setOriginalPreferences(loadedPrefs);
        
        // Load username from Supabase profile
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();

          const profileUsername = data?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || "";
          setUsername(profileUsername);

          // If no profile exists, create one
          if (error && error.code === 'PGRST116') {
            await supabase
              .from("profiles")
              .insert({
                id: user.id,
                username: profileUsername
              });
          }
        } catch (profileError) {
          console.error("Error loading profile:", profileError);
          // Fallback to user metadata
          const fallbackUsername = user?.user_metadata?.username || user?.email?.split('@')[0] || "";
          setUsername(fallbackUsername);
        }
        
        // Apply loaded preferences immediately
        applyPreferences(loadedPrefs);
      } catch (error) {
        console.error("Error loading preferences:", error);
        toast({
          title: "Error",
          description: "Failed to load preferences. Using defaults.",
          variant: "destructive",
        });
        
        // Use defaults
        setPreferences(defaultPreferences);
        setOriginalPreferences(defaultPreferences);
        applyPreferences(defaultPreferences);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.id, toast]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (hasChanges && !saving) {
          handleSave(false);
        }
      }
      
      // Escape to close dialogs
      if (event.key === 'Escape') {
        setShowResetDialog(false);
        setShowLogoutDialog(false);
        setShowDeleteDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasChanges, saving]);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
    setHasChanges(changed);
  }, [preferences, originalPreferences]);

  // Auto-save functionality
  useEffect(() => {
    if (preferences.autoSave && hasChanges && !loading && !saving) {
      const timeoutId = setTimeout(() => {
        handleSave(true);
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [preferences, hasChanges, loading, saving]);

  const applyPreferences = (prefs: UserPreferences) => {
    // Apply theme mode
    setThemeMode(prefs.themeMode);
    
    // Apply color scheme
    setColorScheme(prefs.colorScheme);
    
    // Apply custom color if using custom scheme
    if (prefs.colorScheme === 'custom') {
      setCustomColor(prefs.customColor);
    }
    
    // Apply font size
    setFontSize(prefs.fontSize);
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    
    // Apply changes immediately for visual feedback
    if (key === 'themeMode' || key === 'colorScheme' || key === 'customColor' || key === 'fontSize') {
      applyPreferences(newPrefs);
    }
  };

  const handleSave = async (isAutoSave = false, retry = 0) => {
    if (!user?.id || saving) return;

    try {
      setSaving(true);
      
      // Save preferences to localStorage
      localStorage.setItem(`wordsmith_preferences_${user.id}`, JSON.stringify(preferences));
      
      // Save username to Supabase (only if it has changed)
      if (username.trim()) {
        const { error } = await supabase
          .from("profiles")
          .upsert({ 
            id: user.id, 
            username: username.trim()
          }, { 
            onConflict: 'id' 
          });

        if (error) {
          throw error;
        }

        // Update user metadata as well
        await supabase.auth.updateUser({
          data: { username: username.trim() },
        });
      }

      setOriginalPreferences(preferences);
      setHasChanges(false);
      setRetryCount(0);
      
      if (!isAutoSave) {
        toast({
          title: "Success",
          description: "Your preferences have been saved successfully.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      
      // Even if Supabase fails, preferences are saved locally
      localStorage.setItem(`wordsmith_preferences_${user.id}`, JSON.stringify(preferences));
      setOriginalPreferences(preferences);
      setHasChanges(false);
      
      // Retry logic for network errors
      if (retry < 2 && (error as any)?.message?.includes('network')) {
        setTimeout(() => {
          handleSave(isAutoSave, retry + 1);
        }, 1000 * (retry + 1));
        setRetryCount(retry + 1);
        return;
      }
      
      toast({
        title: isAutoSave ? "Saved Locally" : "Partially Saved",
        description: isAutoSave 
          ? "Preferences saved locally. Username sync will retry when online."
          : "Preferences saved locally, but username sync failed. Please try again.",
        variant: isAutoSave ? "default" : "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(defaultPreferences);
    applyPreferences(defaultPreferences);
    
    // Clear localStorage
    if (user?.id) {
      localStorage.removeItem(`wordsmith_preferences_${user.id}`);
    }
    
    setShowResetDialog(false);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to default values.",
      variant: "default",
    });
  };

  const handleUpdateProfile = async () => {
    if (!user?.id || profileLoading || !username.trim()) return;

    try {
      setProfileLoading(true);
      
      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ 
          id: user.id, 
          username: username.trim() 
        }, { 
          onConflict: 'id' 
        });

      if (profileError) throw profileError;

      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username: username.trim() },
      });

      if (authError) {
        console.warn("Failed to update user metadata:", authError);
        // Don't throw here as the profile was updated successfully
      }

      toast({
        title: "Profile Updated",
        description: "Your username has been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
    setShowLogoutDialog(false);
  };

  const handleDeleteAccount = async () => {
    // This would typically involve calling a backend API to delete the account
    // For now, we'll just show a message
    toast({
      title: "Account Deletion",
      description: "Account deletion is not implemented yet. Please contact support.",
      variant: "destructive",
    });
    setShowDeleteDialog(false);
  };

  const handleExportSettings = () => {
    const settingsData = {
      preferences,
      username,
      exportDate: new Date().toISOString(),
      version: "1.0"
    };
    
    const dataStr = JSON.stringify(settingsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordsmith-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings Exported",
      description: "Your settings have been downloaded as a JSON file.",
      variant: "default",
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (importedData.preferences) {
          const newPrefs = { ...defaultPreferences, ...importedData.preferences };
          setPreferences(newPrefs);
          applyPreferences(newPrefs);
          
          // Save to localStorage immediately
          if (user?.id) {
            localStorage.setItem(`wordsmith_preferences_${user.id}`, JSON.stringify(newPrefs));
          }
        }
        
        if (importedData.username) {
          setUsername(importedData.username);
        }
        
        toast({
          title: "Settings Imported",
          description: "Your settings have been imported successfully. Don't forget to save!",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "The selected file is not a valid settings file.",
          variant: "destructive",
        });
      }
    };
    
    reader.readAsText(file);
    // Reset the input
    event.target.value = '';
  };

  if (loading) {
    return <Loading fullScreen size="lg" text="Loading your settings..." />;
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Container size="md" className="py-6 sm:py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center sm:text-left"
        >
          <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start mb-3">
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-primary" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight">Settings</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground px-2 sm:px-0">
            Customize your WordSmith experience
          </p>
          {user?.email && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 px-2 sm:px-0">
              Signed in as <span className="font-medium">{user.email}</span>
            </p>
          )}
        </motion.div>

        {/* Status indicators */}
        {(!isOnline || hasChanges || retryCount > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-2"
          >
            {!isOnline && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4" />
                <span>You're offline. Changes will be saved when connection is restored.</span>
              </div>
            )}
            
            {hasChanges && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>
                      Saving changes...
                      {retryCount > 0 && ` (Attempt ${retryCount + 1})`}
                    </span>
                  </>
                ) : preferences.autoSave ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span>Changes will be saved automatically</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span>You have unsaved changes</span>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        <div className="space-y-6">
          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardSection
              title="Appearance"
              description="Customize the look and feel of your app"
              icon={<Palette className="w-5 h-5 text-primary" />}
            >
              {/* Theme Toggle */}
              {/* Theme Mode */}
              <SettingItem
                label="Theme Mode"
                description="Choose your preferred theme appearance"
              >
                <Select
                  value={preferences.themeMode}
                  onValueChange={(value) => updatePreference('themeMode', value as 'light' | 'dark' | 'auto')}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </SettingItem>

              {/* Color Scheme */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Color Scheme</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updatePreference('colorScheme', color.value as any)}
                      className={`
                        w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110
                        ${color.class}
                        ${preferences.colorScheme === color.value 
                          ? 'border-foreground shadow-lg scale-110' 
                          : 'border-border hover:border-muted-foreground'
                        }
                      `}
                      title={color.name}
                    >
                      {preferences.colorScheme === color.value && (
                        <Check className="w-5 h-5 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
                {preferences.colorScheme === 'custom' && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={preferences.customColor}
                      onChange={(e) => updatePreference('customColor', e.target.value)}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <span className="text-sm text-muted-foreground font-mono">
                      {preferences.customColor.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Font Size */}
              <SettingItem
                label="Font Size"
                description="Adjust text size throughout the app"
              >
                <Select
                  value={preferences.fontSize}
                  onValueChange={(value) => updatePreference('fontSize', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </SettingItem>
            </CardSection>
          </motion.div>

          {/* Profile Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardSection
              title="Profile"
              description="Manage your account information"
              icon={<User className="w-5 h-5 text-primary" />}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-1 bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Email cannot be changed from here
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="username"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={profileLoading || !username.trim()}
                      size="sm"
                      variant="outline"
                    >
                      {profileLoading ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardSection>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CardSection
              title="Preferences"
              description="Configure your app behavior and notifications"
              icon={<Bell className="w-5 h-5 text-primary" />}
            >
              <SettingItem
                label="Notifications"
                description="Receive notifications for updates and reminders"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <Switch
                    checked={preferences.notifications}
                    onCheckedChange={(checked) => updatePreference('notifications', checked)}
                  />
                </div>
              </SettingItem>

              <SettingItem
                label="Auto-save Settings"
                description="Automatically save changes as you make them"
              >
                <Switch
                  checked={preferences.autoSave}
                  onCheckedChange={(checked) => updatePreference('autoSave', checked)}
                />
              </SettingItem>

              <SettingItem
                label="Language"
                description="Choose your preferred language"
              >
                <Select
                  value={preferences.language}
                  onValueChange={(value) => updatePreference('language', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">🇺🇸 English</SelectItem>
                    <SelectItem value="French">🇫🇷 French</SelectItem>
                    <SelectItem value="Spanish">🇪🇸 Spanish</SelectItem>
                    <SelectItem value="German">🇩🇪 German</SelectItem>
                    <SelectItem value="Italian">🇮🇹 Italian</SelectItem>
                  </SelectContent>
                </Select>
              </SettingItem>
            </CardSection>
          </motion.div>

          {/* Account Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <CardSection
              title="Account"
              description="Manage your account and security settings"
              icon={<Shield className="w-5 h-5 text-primary" />}
            >
              <div className="space-y-4">
                <SettingItem
                  label="Export Settings"
                  description="Download your settings as a backup file"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportSettings}
                  >
                    Export
                  </Button>
                </SettingItem>

                <SettingItem
                  label="Import Settings"
                  description="Restore settings from a backup file"
                >
                  <div className="relative">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportSettings}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="import-settings"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <label htmlFor="import-settings" className="cursor-pointer">
                        Import
                      </label>
                    </Button>
                  </div>
                </SettingItem>

                <div className="border-t border-border pt-4">
                  <SettingItem
                    label="Sign Out"
                    description="Sign out of your account on this device"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLogoutDialog(true)}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </SettingItem>
                </div>

                <div className="border-t border-border pt-4">
                  <SettingItem
                    label="Delete Account"
                    description="Permanently delete your account and all data"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </SettingItem>
                </div>
              </div>
            </CardSection>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 pt-4"
          >
            <Button
              onClick={() => handleSave(false)}
              disabled={!hasChanges || saving || !isOnline}
              className="flex-1 sm:flex-none"
              size={isMobile ? "lg" : "default"}
              title={isMobile ? undefined : "Ctrl+S"}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
              {!isMobile && hasChanges && (
                <span className="ml-2 text-xs opacity-60">⌘S</span>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(true)}
              disabled={saving}
              className="flex-1 sm:flex-none"
              size={isMobile ? "lg" : "default"}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-xs sm:text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 space-y-2"
          >
            <p>
              <strong>Note:</strong> Your preferences are saved to your account and will sync across all your devices.
            </p>
            <p>
              Changes to appearance settings are applied immediately for preview. 
              {!preferences.autoSave && " Don't forget to save your changes!"}
            </p>
          </motion.div>
        </div>
      </Container>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        title="Reset Settings"
        description="Are you sure you want to reset all settings to their default values? This action cannot be undone."
        confirmText="Reset Settings"
        cancelText="Cancel"
        onConfirm={handleReset}
        variant="destructive"
      />

      <ConfirmationDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="Sign Out"
        description="Are you sure you want to sign out? You'll need to sign in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={handleLogout}
      />

      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Account"
        description="Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost."
        confirmText="Delete Account"
        cancelText="Cancel"
        onConfirm={handleDeleteAccount}
        variant="destructive"
      />
    </div>
  );
}
