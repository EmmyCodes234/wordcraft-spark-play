import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeContextType = {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColorState] = useState("#4f46e5"); // default purple
  const [darkMode, setDarkModeState] = useState(false);

  useEffect(() => {
    const savedColor = localStorage.getItem("primaryColor");
    const savedDark = localStorage.getItem("darkMode");
    if (savedColor) setPrimaryColorState(savedColor);
    if (savedDark) setDarkModeState(savedDark === "true");
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--primary-color", primaryColor);
    localStorage.setItem("primaryColor", primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
  };

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
  };

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor, darkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
