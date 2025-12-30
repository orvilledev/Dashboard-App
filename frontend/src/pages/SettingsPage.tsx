import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks';
import { api } from '@/api';
import { 
  User, 
  Mail, 
  Save, 
  Loader2, 
  Check, 
  AlertCircle,
  Camera,
  Palette
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

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

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
}

export function SettingsPage() {
  const { user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const { refreshBackendUser } = useAuth();
  
  const [userData, setUserData] = useState<BackendUser | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch user data directly from backend
  const fetchUserData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      
      const data = await api.get<BackendUser>('/users/me/', token);
      setUserData(data);
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        username: data.username || '',
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // Fallback to Clerk data if backend fails
      if (clerkUser) {
        setFormData({
          first_name: clerkUser.firstName || '',
          last_name: clerkUser.lastName || '',
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          username: clerkUser.username || '',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [getToken, clerkUser]);

  // Load user data on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
    setErrorMessage('');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');

    try {
      const token = await getToken();
      
      // Save to backend
      const updatedUser = await api.patch<BackendUser>('/users/update_profile/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
      }, token || undefined);

      // Update local state with the response
      setUserData(updatedUser);
      setFormData({
        first_name: updatedUser.first_name || '',
        last_name: updatedUser.last_name || '',
        email: updatedUser.email || '',
        username: updatedUser.username || '',
      });

      // Refresh the global user cache so other components (sidebar, etc.) see the update
      await refreshBackendUser();

      setSaveStatus('success');
      
      // Reset success status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-theme-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-theme-primary mb-2">
          Settings
        </h1>
        <p className="text-theme-secondary">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} strokeWidth={1.5} />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-medium overflow-hidden"
                style={{ backgroundColor: '#000000' }}
              >
                {clerkUser?.imageUrl ? (
                  <img
                    src={clerkUser.imageUrl}
                    alt={formData.first_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {formData.first_name?.charAt(0) || formData.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <button 
                className="absolute -bottom-1 -right-1 p-2 rounded-full shadow-soft transition-colors"
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  border: '2px solid var(--color-border)'
                }}
                title="Profile picture is managed by your authentication provider"
              >
                <Camera size={14} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {formData.first_name || formData.last_name 
                  ? `${formData.first_name} ${formData.last_name}`.trim()
                  : userData?.full_name || 'No name set'}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {formData.email}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                Profile picture is managed by your login provider
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div 
            className="flex items-start gap-3 p-4 rounded-lg"
            style={{ 
              backgroundColor: 'var(--color-info, #3b82f6)' + '15',
              border: '1px solid var(--color-info, #3b82f6)' + '30'
            }}
          >
            <AlertCircle size={18} style={{ color: 'var(--color-info, #3b82f6)', marginTop: 2 }} />
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <strong>Note:</strong> Changes you make here will be reflected across the app, including on the Team page. 
              Make sure to click "Save Changes" after editing.
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                First Name
              </label>
              <Input
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Last Name
              </label>
              <Input
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              <div className="flex items-center gap-2">
                <Mail size={16} />
                Email Address
              </div>
            </label>
            <Input
              value={formData.email}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              Email is managed by your authentication provider
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <Check size={16} />
                  Saved!
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </Button>
            
            {saveStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-success, #22c55e)' }}>
                <Check size={16} />
                Your profile has been updated
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-error)' }}>
                <AlertCircle size={16} />
                {errorMessage || 'Failed to save'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette size={20} strokeWidth={1.5} />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Theme
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Choose your preferred color theme
              </p>
            </div>
            <ThemeSwitcher />
          </div>
        </CardContent>
      </Card>

      {/* Account Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} strokeWidth={1.5} />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Account ID
              </p>
              <p className="text-sm font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
                {userData?.id || 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Member Since
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {userData?.date_joined 
                  ? new Date(userData.date_joined).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'N/A'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Account Type
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {userData?.is_admin ? 'Administrator' : 'Member'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
