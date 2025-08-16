import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface OfflineContextType {
  isOnline: boolean;
  isOfflineReady: boolean;
  offlineCapabilities: {
    dictionary: boolean;
    anagramSolver: boolean;
    wordJudge: boolean;
    patternMatcher: boolean;
    userSettings: boolean;
  };
  syncPendingData: () => Promise<void>;
  getPendingOperations: () => PendingOperation[];
}

interface PendingOperation {
  id: string;
  type: 'settings' | 'profile' | 'deck_save' | 'quiz_result';
  data: any;
  timestamp: number;
  retryCount: number;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const { toast } = useToast();

  const offlineCapabilities = {
    dictionary: true,      // Dictionary is cached
    anagramSolver: true,   // Works with cached dictionary
    wordJudge: true,       // Works with cached dictionary
    patternMatcher: true,  // Works with cached dictionary
    userSettings: true,    // Stored in localStorage
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "You're back online! Syncing pending changes...",
        variant: "default",
      });
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Working Offline",
        description: "You're offline. Changes will be synced when connection is restored.",
        variant: "default",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Load pending operations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('wordsmith_pending_operations');
    if (stored) {
      try {
        setPendingOperations(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load pending operations:', error);
      }
    }
  }, []);

  // Save pending operations to localStorage
  useEffect(() => {
    localStorage.setItem('wordsmith_pending_operations', JSON.stringify(pendingOperations));
  }, [pendingOperations]);

  // Check if app is ready for offline use
  useEffect(() => {
    const checkOfflineReadiness = async () => {
      try {
        // Check if dictionary is cached
        const dictionaryCache = localStorage.getItem('wordsmith_dictionary_cache');
        const settingsCache = localStorage.getItem('wordsmith_preferences_');
        
        if (dictionaryCache) {
          setIsOfflineReady(true);
        } else {
          // Try to cache dictionary for offline use
          try {
            const response = await fetch('/dictionaries/CSW24.txt');
            const text = await response.text();
            localStorage.setItem('wordsmith_dictionary_cache', text);
            localStorage.setItem('wordsmith_dictionary_cache_timestamp', Date.now().toString());
            setIsOfflineReady(true);
          } catch (error) {
            console.warn('Failed to cache dictionary for offline use:', error);
          }
        }
      } catch (error) {
        console.error('Error checking offline readiness:', error);
      }
    };

    checkOfflineReadiness();
  }, []);

  const addPendingOperation = (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) => {
    const newOperation: PendingOperation = {
      ...operation,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      retryCount: 0,
    };

    setPendingOperations(prev => [...prev, newOperation]);
  };

  const removePendingOperation = (id: string) => {
    setPendingOperations(prev => prev.filter(op => op.id !== id));
  };

  const syncPendingData = async () => {
    if (!isOnline || pendingOperations.length === 0) return;

    const { supabase } = await import('@/lib/supabaseClient');
    
    for (const operation of pendingOperations) {
      try {
        switch (operation.type) {
          case 'settings':
            // Sync settings to Supabase if needed
            break;
          case 'profile':
            await supabase
              .from('profiles')
              .upsert(operation.data, { onConflict: 'id' });
            break;
          case 'deck_save':
            await supabase
              .from('flashcard_decks')
              .insert(operation.data);
            break;
          case 'quiz_result':
            await supabase
              .from('quiz_results')
              .insert(operation.data);
            break;
        }
        
        removePendingOperation(operation.id);
      } catch (error) {
        console.error(`Failed to sync operation ${operation.id}:`, error);
        
        // Increment retry count
        setPendingOperations(prev => 
          prev.map(op => 
            op.id === operation.id 
              ? { ...op, retryCount: op.retryCount + 1 }
              : op
          )
        );
        
        // Remove operations that have failed too many times
        if (operation.retryCount >= 3) {
          removePendingOperation(operation.id);
          toast({
            title: "Sync Failed",
            description: `Failed to sync ${operation.type} after multiple attempts.`,
            variant: "destructive",
          });
        }
      }
    }
  };

  const getPendingOperations = () => pendingOperations;

  return (
    <OfflineContext.Provider value={{
      isOnline,
      isOfflineReady,
      offlineCapabilities,
      syncPendingData,
      getPendingOperations,
    }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

// Utility function to add pending operations from anywhere in the app
export const addOfflineOperation = (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) => {
  const stored = localStorage.getItem('wordsmith_pending_operations');
  const existing = stored ? JSON.parse(stored) : [];
  
  const newOperation: PendingOperation = {
    ...operation,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    retryCount: 0,
  };
  
  const updated = [...existing, newOperation];
  localStorage.setItem('wordsmith_pending_operations', JSON.stringify(updated));
};