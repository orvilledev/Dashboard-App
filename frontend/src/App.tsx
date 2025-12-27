import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout';
import { LandingPage, Dashboard, ToolsPage, DocumentsPage, TasksPage, TeamPage } from '@/pages';

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
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center shadow-soft">
              <span className="text-white font-serif font-bold text-xl">A</span>
            </div>
          </div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900 mb-4">AMZPulse</h1>
          <div className="bg-white rounded-xl shadow-medium border border-charcoal-100 p-6">
            <p className="text-charcoal-700 mb-4">
              Authentication is not configured yet.
            </p>
            <p className="text-charcoal-500 text-sm mb-4">
              Add <code className="bg-cream-100 px-2 py-1 rounded text-charcoal-700">VITE_CLERK_PUBLISHABLE_KEY</code> to your <code className="bg-cream-100 px-2 py-1 rounded text-charcoal-700">.env</code> file to enable sign in.
            </p>
            <a
              href="/"
              className="inline-block px-4 py-2 bg-charcoal-800 text-white rounded-lg hover:bg-charcoal-700 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center shadow-soft">
              <span className="text-white font-serif font-bold text-xl">A</span>
            </div>
          </div>
          <h1 className="font-serif font-bold text-2xl text-charcoal-900">AMZPulse</h1>
          <p className="text-charcoal-500 mt-1">
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
                card: 'shadow-medium rounded-xl border border-charcoal-100',
                headerTitle: 'font-serif',
                formButtonPrimary: 'bg-charcoal-800 hover:bg-charcoal-700',
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
                card: 'shadow-medium rounded-xl border border-charcoal-100',
                headerTitle: 'font-serif',
                formButtonPrimary: 'bg-charcoal-800 hover:bg-charcoal-700',
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
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/team" element={<TeamPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  // If no Clerk key, render routes without ClerkProvider
  // The AuthPage and ProtectedRoute components will handle the missing key gracefully
  if (!clerkPubKey) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
