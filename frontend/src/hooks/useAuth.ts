import { useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-react';
import { api } from '@/api';

// Track sync across component instances
let globalSyncPromise: Promise<void> | null = null;

export function useAuth() {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user } = useUser();
  const [backendUser, setBackendUser] = useState<unknown>(null);

  const isAdmin = user?.publicMetadata?.role === 'admin';

  // Sync user with backend when signed in
  useEffect(() => {
    async function syncUserWithBackend() {
      if (!isLoaded || !isSignedIn) return;
      
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
            const userData = await api.get('/users/me/', token);
            setBackendUser(userData);
            console.log('User synced with backend:', userData);
          }
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
        } finally {
          // Reset after a delay to allow periodic re-sync
          setTimeout(() => {
            globalSyncPromise = null;
          }, 60000); // Re-allow sync after 1 minute
        }
      })();

      await globalSyncPromise;
    }

    syncUserWithBackend();
  }, [isLoaded, isSignedIn, getToken]);

  return {
    isLoaded,
    isSignedIn,
    isAdmin,
    user,
    backendUser,
    getToken,
  };
}

