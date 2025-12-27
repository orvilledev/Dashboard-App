import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout';
import { LandingPage, Dashboard, ToolsPage, MyToolsPage, TasksPage, TeamPage, TeamDetailPage, JoinTeamPage, SettingsPage, MemberProfilePage } from '@/pages';
import { HandPulseIcon } from '@/components/icons/HandPulseIcon';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // If no Clerk key, redirect to sign-in which will show config message
  if (!clerkPubKey) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  );
}

function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  // If no Clerk key, show configuration message
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen bg-theme-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-theme-primary rounded-lg flex items-center justify-center shadow-soft">
              <HandPulseIcon size={24} color="white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="font-serif font-bold text-2xl text-theme-primary mb-4">AMZPulse</h1>
          <div className="bg-theme-surface rounded-xl shadow-medium border border-theme-light p-6">
            <p className="text-theme-secondary mb-4">
              Authentication is not configured yet.
            </p>
            <p className="text-theme-tertiary text-sm mb-4">
              Add <code className="bg-theme-background px-2 py-1 rounded text-theme-secondary">VITE_CLERK_PUBLISHABLE_KEY</code> to your <code className="bg-theme-background px-2 py-1 rounded text-theme-secondary">.env</code> file to enable sign in.
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary-hover transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-theme-primary rounded-lg flex items-center justify-center shadow-soft">
              <HandPulseIcon size={24} color="white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="font-serif font-bold text-2xl text-theme-primary">AMZPulse</h1>
          <p className="text-theme-secondary mt-1">
            {mode === 'sign-in' ? 'Welcome back' : 'Create your workspace'}
          </p>
        </div>
        {mode === 'sign-in' ? (
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-medium rounded-xl border border-theme-light bg-theme-surface',
                headerTitle: 'font-serif text-theme-primary',
                headerSubtitle: 'text-theme-secondary',
                formLabelHorizontalRow: 'text-theme-secondary',
                formFieldLabel: 'text-theme-secondary',
                formFieldInput: 'bg-theme-background border-theme-light text-theme-primary',
                formButtonPrimary: 'bg-theme-primary hover:bg-theme-primary-hover',
                footerActionText: 'text-theme-secondary',
                footerActionLink: 'text-theme-accent hover:text-theme-primary-hover',
                identityPreviewText: 'text-theme-primary',
                identityPreviewEditButtonIcon: 'text-theme-accent',
              },
            }}
          />
        ) : (
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-medium rounded-xl border border-theme-light bg-theme-surface',
                headerTitle: 'font-serif text-theme-primary',
                headerSubtitle: 'text-theme-secondary',
                formLabelHorizontalRow: 'text-theme-secondary',
                formFieldLabel: 'text-theme-secondary',
                formFieldInput: 'bg-theme-background border-theme-light text-theme-primary',
                formButtonPrimary: 'bg-theme-primary hover:bg-theme-primary-hover',
                footerActionText: 'text-theme-secondary',
                footerActionLink: 'text-theme-accent hover:text-theme-primary-hover',
                identityPreviewText: 'text-theme-primary',
                identityPreviewEditButtonIcon: 'text-theme-accent',
              },
            }}
          />
        )}
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
      <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />

      {/* Protected routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/my-tools" element={<MyToolsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/teams" element={<TeamPage />} />
        <Route path="/teams/:teamId" element={<TeamDetailPage />} />
        <Route path="/join-team" element={<JoinTeamPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile/:userId" element={<MemberProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  // If no Clerk key, render routes without ClerkProvider but WITH ThemeProvider
  // The AuthPage and ProtectedRoute components will handle the missing key gracefully
  if (!clerkPubKey) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
