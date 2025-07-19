import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getCardbox, saveCardbox } from "@/lib/supabaseCardboxService";
import { useAuth } from "./AuthContext";

interface CardboxContextType {
  words: string[];
  addWords: (newWords: string[]) => void;
  clear: () => void;
  refresh: () => void;
}

const CardboxContext = createContext<CardboxContextType | undefined>(undefined);

export const CardboxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [words, setWords] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchDeck();
    }
  }, [user]);

  const fetchDeck = async () => {
    try {
      const data = await getCardbox();
      const userBox = data.find((entry) => entry.user_id === user?.id);

      if (userBox && Array.isArray(userBox.words)) {
        setWords(userBox.words);
      } else {
        console.log("No saved cardbox yet");
        setWords([]);
      }
    } catch (error) {
      console.error("Error loading deck:", error);
    }
  };

  const addWords = async (newWords: string[]) => {
    if (!user) return;

    try {
      const updatedWords = Array.from(new Set([...words, ...newWords]));
      await saveCardbox(user.id, updatedWords);
      setWords(updatedWords);
    } catch (error) {
      console.error("Error saving cardbox:", error);
    }
  };

  const clear = () => {
    setWords([]);
  };

  const refresh = () => {
    fetchDeck();
  };

  return (
    <CardboxContext.Provider value={{ words, addWords, clear, refresh }}>
      {children}
    </CardboxContext.Provider>
  );
};

export const useCardbox = () => {
  const context = useContext(CardboxContext);
  if (!context) {
    throw new Error("useCardbox must be used within a CardboxProvider");
  }
  return context;
};
