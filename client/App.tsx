import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import LandingPage from './components/LandingPage';

type AppView = 'landing' | 'login' | 'register';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<AppView>('landing');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono text-sm">Initializing AIVA...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onGetStarted={(mode) => setView(mode)}
      />
    );
  }

  return (
    <LoginPage
      initialMode={view === 'register' ? 'register' : 'login'}
      onBack={() => setView('landing')}
    />
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;

