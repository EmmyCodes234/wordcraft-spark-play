import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface PageSession {
  [key: string]: any;
}

interface SessionContextType {
  getSession: (pageId: string) => any;
  setSession: (pageId: string, data: any) => void;
  clearSession: (pageId: string) => void;
  clearAllSessions: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<PageSession>({});

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('pageSessions');
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (error) {
        console.error('Failed to load sessions from localStorage:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem('pageSessions', JSON.stringify(sessions));
  }, [sessions]);

  const getSession = useCallback((pageId: string) => {
    return sessions[pageId] || null;
  }, [sessions]);

  const setSession = useCallback((pageId: string, data: any) => {
    setSessions(prev => ({
      ...prev,
      [pageId]: data
    }));
  }, []);

  const clearSession = useCallback((pageId: string) => {
    setSessions(prev => {
      const newSessions = { ...prev };
      delete newSessions[pageId];
      return newSessions;
    });
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions({});
  }, []);

  return (
    <SessionContext.Provider value={{
      getSession,
      setSession,
      clearSession,
      clearAllSessions,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

// Hook for specific page sessions
export const usePageSession = (pageId: string) => {
  const { getSession, setSession, clearSession } = useSession();
  
  return {
    session: getSession(pageId),
    setSession: useCallback((data: any) => setSession(pageId, data), [setSession, pageId]),
    clearSession: useCallback(() => clearSession(pageId), [clearSession, pageId]),
  };
};
