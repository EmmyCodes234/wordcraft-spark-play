import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

// Configuration for activity tracking
const ACTIVITY_TRACKING_CONFIG = {
  enabled: true, // Activity tracking re-enabled
  intervalMinutes: 5, // How often to update (in minutes) - increased to reduce load
  throttleMinutes: 10, // Throttle user interactions (in minutes) - increased
  minUpdateInterval: 60, // Minimum seconds between updates - increased
};

// Hook to automatically update last_active timestamp
export const useActivityTracker = () => {
  const { user } = useAuth();
  const lastUpdateRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user || !ACTIVITY_TRACKING_CONFIG.enabled) return;

    // Update last_active when component mounts (user is active)
    const updateActivity = async () => {
      // Prevent too frequent updates
      const now = Date.now();
      if (now - lastUpdateRef.current < ACTIVITY_TRACKING_CONFIG.minUpdateInterval * 1000 || isUpdatingRef.current) {
        return;
      }

      isUpdatingRef.current = true;
      lastUpdateRef.current = now;

      try {
        // Try the safe function first, fallback to regular function
        const { error } = await supabase.rpc('update_last_active_safe');
        if (error) {
          console.error('Error updating last_active (safe function):', error);
          // Handle different error types
          if (error.code === '42883') {
            console.warn('update_last_active_safe function not found. Please run FIX_STACK_DEPTH_ERROR.sql');
            // Try the regular function as fallback
            const { error: fallbackError } = await supabase.rpc('update_last_active');
            if (fallbackError) {
              console.error('Fallback function also failed:', fallbackError);
            }
          } else if (error.code === '57014') {
            console.warn('Database timeout - reducing update frequency');
          } else if (error.code === '54001') {
            console.warn('Stack depth limit exceeded - disabling activity tracking');
            ACTIVITY_TRACKING_CONFIG.enabled = false;
            console.warn('Activity tracking disabled due to stack depth error. Please check your database triggers.');
          }
        }
      } catch (error) {
        console.error('Error updating last_active:', error);
      } finally {
        isUpdatingRef.current = false;
      }
    };

    // Update immediately
    updateActivity();

    // Set up interval to update while user is active
    const interval = setInterval(updateActivity, ACTIVITY_TRACKING_CONFIG.intervalMinutes * 60 * 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [user]);

  // Also update on user interactions (but with throttling)
  useEffect(() => {
    if (!user || !ACTIVITY_TRACKING_CONFIG.enabled) return;

    const handleUserActivity = async () => {
      // Throttle user activity updates
      const now = Date.now();
      if (now - lastUpdateRef.current < ACTIVITY_TRACKING_CONFIG.throttleMinutes * 60 * 1000 || isUpdatingRef.current) {
        return;
      }

      isUpdatingRef.current = true;
      lastUpdateRef.current = now;

      try {
        // Try the safe function first, fallback to regular function
        const { error } = await supabase.rpc('update_last_active_safe');
        if (error) {
          console.error('Error updating last_active (safe function):', error);
          // Handle different error types
          if (error.code === '42883') {
            console.warn('update_last_active_safe function not found. Please run FIX_STACK_DEPTH_ERROR.sql');
            // Try the regular function as fallback
            const { error: fallbackError } = await supabase.rpc('update_last_active');
            if (fallbackError) {
              console.error('Fallback function also failed:', fallbackError);
            }
          } else if (error.code === '57014') {
            console.warn('Database timeout - reducing update frequency');
          } else if (error.code === '54001') {
            console.warn('Stack depth limit exceeded - disabling activity tracking');
            ACTIVITY_TRACKING_CONFIG.enabled = false;
            console.warn('Activity tracking disabled due to stack depth error. Please check your database triggers.');
          }
        }
      } catch (error) {
        console.error('Error updating last_active:', error);
      } finally {
        isUpdatingRef.current = false;
      }
    };

    // Update on various user interactions (throttled)
    const events = ['click', 'keypress', 'scroll', 'mousemove'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user]);
};

// Alternative: Simple function to call manually
export const updateUserActivity = async () => {
  if (!ACTIVITY_TRACKING_CONFIG.enabled) {
    console.warn('Activity tracking is disabled');
    return;
  }

  try {
    // Try the safe function first, fallback to regular function
    const { error } = await supabase.rpc('update_last_active_safe');
    if (error) {
      console.error('Error updating last_active (safe function):', error);
      // Handle different error types
      if (error.code === '42883') {
        console.warn('update_last_active_safe function not found. Please run FIX_STACK_DEPTH_ERROR.sql');
        // Try the regular function as fallback
        const { error: fallbackError } = await supabase.rpc('update_last_active');
        if (fallbackError) {
          console.error('Fallback function also failed:', fallbackError);
        }
      } else if (error.code === '57014') {
        console.warn('Database timeout - reducing update frequency');
      } else if (error.code === '54001') {
        console.warn('Stack depth limit exceeded - disabling activity tracking');
        ACTIVITY_TRACKING_CONFIG.enabled = false;
        console.warn('Activity tracking disabled due to stack depth error. Please check your database triggers.');
      }
    }
  } catch (error) {
    console.error('Error updating last_active:', error);
  }
};

// Function to re-enable activity tracking
export const enableActivityTracking = () => {
  ACTIVITY_TRACKING_CONFIG.enabled = true;
  console.log('Activity tracking re-enabled');
};

// Function to disable activity tracking
export const disableActivityTracking = () => {
  ACTIVITY_TRACKING_CONFIG.enabled = false;
  console.log('Activity tracking disabled');
};