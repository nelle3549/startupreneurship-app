import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import HomeNew from './pages/Home';
import AccountSettings from './pages/AccountSettings';
import ClassroomView from './pages/ClassroomView';
import CourseBuilder from './pages/CourseBuilder';

import FundingGrants from './pages/FundingGrants';
import InnovationCompetitionsPage from './pages/InnovationCompetitionsPage';
import WhatsBrewingPage from './pages/WhatsBrewingPage';
import Admin from './pages/Admin';
import Portal from './pages/Portal';
import Analytics from './pages/Analytics';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import CompleteProfileDialog from '@/components/CompleteProfileDialog';
import { useCurrentUser } from '@/components/useCurrentUser';
import LoginSignup from '@/components/registration/LoginSignup';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

/**
 * Wrapper for routes that require authentication.
 * Shows LoginSignup if the user is not logged in.
 */
const RequireAuth = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginSignup onComplete={() => window.location.reload()} />;
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const { userAccount, user: authUser } = useCurrentUser();

  return (
    <>
      {isAuthenticated && <CompleteProfileDialog userAccount={userAccount} authUser={authUser} />}
      <Routes>
        {/* Public routes — no login required */}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Library" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={
          <LayoutWrapper currentPageName="Home">
            <HomeNew />
          </LayoutWrapper>
        } />
        <Route path="/FundingGrants" element={
          <LayoutWrapper currentPageName="FundingGrants">
            <FundingGrants />
          </LayoutWrapper>
        } />
        <Route path="/InnovationCompetitions" element={
          <LayoutWrapper currentPageName="InnovationCompetitions">
            <InnovationCompetitionsPage />
          </LayoutWrapper>
        } />
        <Route path="/WhatsBrewing" element={
          <LayoutWrapper currentPageName="WhatsBrewing">
            <WhatsBrewingPage />
          </LayoutWrapper>
        } />

        {/* Protected routes — login required */}
        <Route path="/AccountSettings" element={
          <RequireAuth>
            <LayoutWrapper currentPageName="AccountSettings">
              <AccountSettings />
            </LayoutWrapper>
          </RequireAuth>
        } />
        <Route path="/Admin" element={
          <RequireAuth>
            <LayoutWrapper currentPageName="Admin">
              <Admin />
            </LayoutWrapper>
          </RequireAuth>
        } />
        <Route path="/ClassroomView" element={
          <RequireAuth>
            <LayoutWrapper currentPageName="ClassroomView">
              <ClassroomView />
            </LayoutWrapper>
          </RequireAuth>
        } />
        <Route path="/Portal" element={
          <RequireAuth>
            <LayoutWrapper currentPageName="Portal">
              <Portal />
            </LayoutWrapper>
          </RequireAuth>
        } />
        <Route path="/Analytics" element={
          <RequireAuth>
            <LayoutWrapper currentPageName="Analytics">
              <Analytics />
            </LayoutWrapper>
          </RequireAuth>
        } />
        <Route path="/CourseBuilder" element={
          <RequireAuth>
            <CourseBuilder />
          </RequireAuth>
        } />

        {/* Auto-registered pages from pages.config */}
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
