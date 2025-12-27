import { useEffect, useState, useCallback } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { api } from '@/api';

// Backend user type
interface BackendUser {
  id: number;
  clerk_id: string | null;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar_url: string | null;
  is_admin: boolean;
  date_joined: string;
}

// Track sync across component instances
let globalSyncPromise: Promise<void> | null = null;
let cachedBackendUser: BackendUser | null = null;

// Global listeners for backend user updates
const backendUserListeners = new Set<(user: BackendUser) => void>();

// Function to clear cache and force refresh (can be called from browser console for debugging)
(window as any).clearUserCache = () => {
  cachedBackendUser = null;
  console.log('✅ User cache cleared');
};

// Function to force refresh user data (can be called from browser console)
(window as any).forceRefreshUser = async () => {
  cachedBackendUser = null;
  console.log('🔄 Forcing user refresh...');
  // This will trigger a refresh on next render
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

export function useAuth() {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user } = useUser();
  const [backendUser, setBackendUser] = useState<BackendUser | null>(cachedBackendUser);

  // Check admin status from backend first, fallback to Clerk metadata
  // CRITICAL: Always use backend value if backendUser exists, even if is_admin is false
  const isAdmin = backendUser 
    ? Boolean(backendUser.is_admin) 
    : (user?.publicMetadata?.role === 'admin');
  
  // Debug logging - log every time backendUser changes
  useEffect(() => {
    console.log('🔍 Admin Status Debug:', {
      hasBackendUser: !!backendUser,
      backendUser_id: backendUser?.id,
      backendUser_is_admin: backendUser?.is_admin,
      backendUser_is_admin_type: typeof backendUser?.is_admin,
      computed_isAdmin: isAdmin,
      clerk_role: user?.publicMetadata?.role,
      cachedBackendUser: cachedBackendUser ? { id: cachedBackendUser.id, is_admin: cachedBackendUser.is_admin } : null
    });
  }, [backendUser, isAdmin]);

  // Register listener for backend user updates
  useEffect(() => {
    const listener = (updatedUser: BackendUser) => {
      setBackendUser(updatedUser);
    };
    backendUserListeners.add(listener);
    return () => {
      backendUserListeners.delete(listener);
    };
  }, []);

  // Function to refresh backend user data (can be called after profile updates)
  const refreshBackendUser = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return null;
    
    try {
      const token = await getToken();
      if (token) {
        // Add timestamp to prevent caching
        const timestamp = Date.now();
        const userData = await api.get<BackendUser>(`/users/me/?_t=${timestamp}`, token);
        
        // CRITICAL: Ensure is_admin is a proper boolean
        const normalizedUserData = {
          ...userData,
          is_admin: Boolean(userData.is_admin)
        };
        
        cachedBackendUser = normalizedUserData;
        setBackendUser(normalizedUserData);
        // Notify all listeners
        backendUserListeners.forEach(listener => listener(normalizedUserData));
        console.log('✅ User refreshed - is_admin:', normalizedUserData.is_admin);
        return userData;
      }
    } catch (error) {
      console.error('Failed to refresh backend user:', error);
    }
    return null;
  }, [isLoaded, isSignedIn, getToken]);

  // Sync user with backend when signed in
  useEffect(() => {
    async function syncUserWithBackend(forceRefresh = false) {
      if (!isLoaded || !isSignedIn) return;
      
      // If forcing refresh, clear cache first
      if (forceRefresh) {
        cachedBackendUser = null;
      }
      
      // If we already have cached data and not forcing refresh, use it immediately
      if (cachedBackendUser && !backendUser && !forceRefresh) {
        setBackendUser(cachedBackendUser);
      }
      
      // Prevent multiple simultaneous syncs
      if (globalSyncPromise) {
        await globalSyncPromise;
        return;
      }

      globalSyncPromise = (async () => {
        try {
          const token = await getToken();
          if (token) {
            // Call /users/me/ to trigger user creation/sync in backend
            // Add timestamp query param to prevent browser caching
            const timestamp = Date.now();
            const userData = await api.get<BackendUser>(`/users/me/?_t=${timestamp}`, token);
            console.log('✅ Raw API response:', JSON.stringify(userData, null, 2));
            console.log('✅ is_admin value:', userData.is_admin, 'type:', typeof userData.is_admin, 'boolean:', Boolean(userData.is_admin));
            
            // CRITICAL: Ensure is_admin is a proper boolean
            const normalizedUserData = {
              ...userData,
              is_admin: Boolean(userData.is_admin)
            };
            
            cachedBackendUser = normalizedUserData;
            setBackendUser(normalizedUserData);
            // Notify all listeners
            backendUserListeners.forEach(listener => listener(normalizedUserData));
            console.log('✅ User synced - Final is_admin:', normalizedUserData.is_admin);
          }
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
        } finally {
          // Reset after a delay to allow periodic re-sync
          setTimeout(() => {
            globalSyncPromise = null;
          }, 5000); // Re-allow sync after 5 seconds (reduced for faster updates)
        }
      })();

      await globalSyncPromise;
    }

    // Force immediate refresh on mount to get latest admin status
    // Clear cache first to ensure fresh data
    cachedBackendUser = null;
    setBackendUser(null);
    syncUserWithBackend(true);

    // Set up periodic refresh every 10 seconds to sync admin status changes
    const refreshInterval = setInterval(() => {
      if (isLoaded && isSignedIn && !globalSyncPromise) {
        syncUserWithBackend(false);
      }
    }, 10000); // Refresh every 10 seconds (reduced from 30)

    // Also refresh when window becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoaded && isSignedIn && !globalSyncPromise) {
        syncUserWithBackend(true); // Force refresh when tab becomes visible
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoaded, isSignedIn, getToken]);

  return {
    isLoaded,
    isSignedIn,
    isAdmin,
    user,
    backendUser,
    getToken,
    refreshBackendUser,
  };
}

