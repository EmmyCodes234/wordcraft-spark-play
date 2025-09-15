import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

// --- ADDED: Define a type for your user profile ---
export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
}

// --- MODIFIED: Updated the context type ---
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null; // <-- Add profile
  loading: boolean; // For initial auth check
  profileLoading: boolean; // For profile fetch
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null); // --- ADDED: Profile state ---
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true); // --- ADDED: Profile loading state ---

  useEffect(() => {
    const { data: authData } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authData.subscription.unsubscribe();
    };
  }, []);
  
  // --- ADDED: New useEffect to fetch profile when user changes ---
  useEffect(() => {
    if (user) {
      setProfileLoading(true);
      
      const fetchProfile = async () => {
        try {
          // First, try to get the profile
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            
            // If profile doesn't exist, try to create it
            if (error.code === 'PGRST116') { // No rows returned
              console.log('Profile not found, attempting to create...');
              
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  username: user.email?.split('@')[0] || 'user',
                  avatar_url: null
                })
                .select()
                .single();

              if (createError) {
                console.error('Error creating profile:', createError);
                setProfile(null);
              } else {
                console.log('Profile created successfully:', newProfile);
                setProfile(newProfile as Profile);
              }
            } else {
              setProfile(null);
            }
          } else {
            setProfile(data as Profile);
          }
        } catch (error) {
          console.error('Unexpected error in fetchProfile:', error);
          setProfile(null);
        } finally {
          setProfileLoading(false);
        }
      };

      fetchProfile();
    } else {
      // No user, so no profile
      setProfile(null);
      setProfileLoading(false);
    }
  }, [user]);

  const signUp = async (email: string, password: string) => {
    // Your existing signUp function is fine
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Your existing signIn function is fine
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // --- MODIFIED: Clear profile on sign out ---
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const value = {
    user,
    session,
    profile, // --- ADDED ---
    loading,
    profileLoading, // --- ADDED ---
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};