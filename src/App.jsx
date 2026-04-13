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
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import LoginSignup from '@/components/registration/LoginSignup';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, isAuthenticated, authError, navigateToLogin } = useAuth();
  const { userAccount, user: authUser } = useCurrentUser();

  // Show loading spinner while checking auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // Not authenticated — show login
  if (!isAuthenticated) {
    return <LoginSignup onComplete={() => window.location.reload()} />;
  }

  // Render the main app
  return (
    <>
    <CompleteProfileDialog userAccount={userAccount} authUser={authUser} />
    <Routes>
      <Route path="/" element={<Navigate to="/Home" replace />} />
      <Route path="/Library" element={<Navigate to="/Home" replace />} />
      <Route path="/AccountSettings" element={
        <LayoutWrapper currentPageName="AccountSettings">
          <AccountSettings />
        </LayoutWrapper>
      } />
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
      <Route path="/Admin" element={
        <LayoutWrapper currentPageName="Admin">
          <Admin />
        </LayoutWrapper>
      } />
      <Route path="/ClassroomView" element={
        <LayoutWrapper currentPageName="ClassroomView">
          <ClassroomView />
        </LayoutWrapper>
      } />
      <Route path="/Portal" element={
        <LayoutWrapper currentPageName="Portal">
          <Portal />
        </LayoutWrapper>
      } />
      <Route path="/Analytics" element={
        <LayoutWrapper currentPageName="Analytics">
          <Analytics />
        </LayoutWrapper>
      } />
      <Route path="/CourseBuilder" element={<CourseBuilder />} />
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
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App