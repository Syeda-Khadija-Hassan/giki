/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AcademicBanner } from './components/common/AcademicBanner';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { WardenDashboard } from './pages/WardenDashboard';
import { GateSecurityPage } from './pages/GateSecurityPage';
import { WhatsAppSimulatorModal } from './components/simulation/WhatsAppSimulatorModal';
import { SystemTestSuiteModal } from './components/testing/SystemTestSuiteModal';

function MainLayout() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<'student' | 'warden' | 'gate'>('student');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Simulation Modal state
  const [simulatingPassId, setSimulatingPassId] = useState<number | null>(null);

  // Test Suite Modal state
  const [showTestSuite, setShowTestSuite] = useState(false);

  // Automatically lock tab to the authenticated user's assigned role
  React.useEffect(() => {
    if (user) {
      if (user.role === 'STUDENT') setCurrentTab('student');
      else if (user.role === 'WARDEN') setCurrentTab('warden');
      else if (user.role === 'SECURITY') setCurrentTab('gate');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading GIKI for Women Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Mandatory Academic Prototype Notice */}
      <AcademicBanner onOpenTestSuite={() => setShowTestSuite(true)} />

      {/* Main Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenWhatsAppSimulator={() => setSimulatingPassId(101)}
        onOpenTestSuite={() => setShowTestSuite(true)}
      />

      {/* Page Body with Strict Role-Based Access Control */}
      <main className="flex-1 pb-16">
        {!isAuthenticated ? (
          authView === 'login' ? (
            <LoginPage onNavigateToRegister={() => setAuthView('register')} />
          ) : (
            <RegistrationPage onNavigateToLogin={() => setAuthView('login')} />
          )
        ) : (
          <>
            {currentTab === 'student' && (
              <ProtectedRoute
                allowedRoles={['STUDENT']}
                onNavigateToAuthorized={() => {
                  if (user?.role === 'WARDEN') setCurrentTab('warden');
                  else if (user?.role === 'SECURITY') setCurrentTab('gate');
                }}
              >
                <StudentDashboard onOpenSimulator={(id) => setSimulatingPassId(id)} />
              </ProtectedRoute>
            )}

            {currentTab === 'warden' && (
              <ProtectedRoute
                allowedRoles={['WARDEN']}
                onNavigateToAuthorized={() => {
                  if (user?.role === 'STUDENT') setCurrentTab('student');
                  else if (user?.role === 'SECURITY') setCurrentTab('gate');
                }}
              >
                <WardenDashboard onOpenSimulator={(id) => setSimulatingPassId(id)} />
              </ProtectedRoute>
            )}

            {currentTab === 'gate' && (
              <ProtectedRoute
                allowedRoles={['SECURITY', 'WARDEN']}
                onNavigateToAuthorized={() => {
                  if (user?.role === 'STUDENT') setCurrentTab('student');
                  else if (user?.role === 'WARDEN') setCurrentTab('warden');
                }}
              >
                <GateSecurityPage />
              </ProtectedRoute>
            )}
          </>
        )}
      </main>

      {/* WhatsApp Interactive Simulator Modal */}
      {simulatingPassId !== null && (
        <WhatsAppSimulatorModal
          passId={simulatingPassId}
          onClose={() => setSimulatingPassId(null)}
          onSimulationCompleted={() => {
            // Keep state updated
          }}
        />
      )}

      {/* Security & Workflow Test Suite Modal */}
      {showTestSuite && <SystemTestSuiteModal onClose={() => setShowTestSuite(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
