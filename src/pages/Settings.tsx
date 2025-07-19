import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user } = useAuth();
  const [primaryColor, setPrimaryColor] = useState("#22c55e");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("English");
  const [fontSize, setFontSize] = useState("medium");

  useEffect(() => {
    // Load preferences from Supabase or local storage
    const loadPreferences = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user?.id)
        .single();

      if (data && data.preferences) {
        const prefs = data.preferences;
        setPrimaryColor(prefs.primaryColor || "#22c55e");
        setDarkMode(prefs.darkMode || false);
        setNotifications(prefs.notifications ?? true);
        setLanguage(prefs.language || "English");
        setFontSize(prefs.fontSize || "medium");

        if (prefs.darkMode) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }

        document.documentElement.style.setProperty("--primary", prefs.primaryColor || "#22c55e");
      }
    };
    if (user?.id) {
      loadPreferences();
    }
  }, [user]);

  const handleSave = async () => {
    const preferences = {
      primaryColor,
      darkMode,
      notifications,
      language,
      fontSize,
    };

    // Save to Supabase
    const { error } = await supabase
      .from("profiles")
      .update({ preferences })
      .eq("id", user?.id);

    if (error) {
      console.error("Failed to save preferences:", error);
      alert("Error saving preferences");
    } else {
      alert("Preferences saved!");

      // Apply dark mode
      if (darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      // Apply primary color
      document.documentElement.style.setProperty("--primary", primaryColor);
    }
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      setPrimaryColor("#22c55e");
      setDarkMode(false);
      setNotifications(true);
      setLanguage("English");
      setFontSize("medium");
      document.documentElement.classList.remove("dark");
      document.documentElement.style.setProperty("--primary", "#22c55e");
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">App Settings</h1>

      <div className="bg-card shadow-md rounded-lg p-6 space-y-5 border border-border">
        <p className="text-muted-foreground">Logged in as: <span className="font-medium">{user?.email}</span></p>

        <div>
          <label className="block text-sm font-medium mb-1">Primary Color</label>
          <Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
        </div>

        <div className="flex items-center justify-between">
          <span>Enable Dark Mode</span>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
        </div>

        <div className="flex items-center justify-between">
          <span>Enable Notifications</span>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Preferred Language</label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Font Size</label>
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select font size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave}>Save Preferences</Button>
          <Button variant="outline" onClick={handleReset}>Reset</Button>
        </div>

        <p className="text-xs text-muted-foreground">Preferences are saved and applied globally. Your primary color will affect buttons, highlights, and accents throughout the app.</p>
      </div>
    </div>
  );
}
