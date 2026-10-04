// src/App.jsx
// Main Application with Centralized Auth, Dynamic Routing & Code Splitting
import React, { Suspense } from 'react';
import { lazyWithRetry as lazy } from './utils/lazyWithRetry.js';
import { AuthProvider, useAuth } from './providers/AuthProvider.jsx';
import { RouteProvider, useRoute } from './router/RouteContext.jsx';
import { ModalProvider } from './context/ModalContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import MainSidebar from './components/layout/MainSidebar.jsx';
import MobileProfileDropdown from './components/layout/MobileProfileDropdown.jsx';
import MobileBottomNav from './components/layout/MobileBottomNav.jsx';
import RouteLoadingFallback from './components/common/RouteLoadingFallback.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';

// 100% Pure React Modals
const BugReportModal = lazy(() => import('./components/modals/BugReportModal.jsx'));
const SrsExplainerModal = lazy(() => import('./components/modals/SrsExplainerModal.jsx'));
const CreateTopicModal = lazy(() => import('./components/modals/CreateTopicModal.jsx'));
const AddWordModal = lazy(() => import('./components/modals/AddWordModal.jsx'));
const BulkAddWordModal = lazy(() => import('./components/modals/BulkAddWordModal.jsx'));
const PricingModal = lazy(() => import('./components/modals/PricingModal.jsx'));
const ForgotPasswordModal = lazy(() => import('./components/modals/ForgotPasswordModal.jsx'));
const AuthErrorModal = lazy(() => import('./components/modals/AuthErrorModal.jsx'));
const PageLanding = lazy(() => import('./components/pages/PageLanding.jsx'));
const PageFeatures = lazy(() => import('./components/pages/PageFeatures.jsx'));
const PageReviews = lazy(() => import('./components/pages/PageReviews.jsx'));
const PageFaq = lazy(() => import('./components/pages/PageFaq.jsx'));
const PageSupport = lazy(() => import('./components/pages/PageSupport.jsx'));
const PageLogin = lazy(() => import('./components/pages/PageLogin.jsx'));
const PageDashboard = lazy(() => import('./components/pages/PageDashboard.jsx'));
const PageTopics = lazy(() => import('./components/pages/PageTopics.jsx'));
const PageLibrary = lazy(() => import('./components/pages/PageLibrary.jsx'));
const PageTopicDetail = lazy(() => import('./components/pages/PageTopicDetail.jsx'));
const PageLessonDetail = lazy(() => import('./components/pages/PageLessonDetail.jsx'));
const PageExercises = lazy(() => import('./components/pages/PageExercises.jsx'));
const PageThptRoom = lazy(() => import('./components/pages/PageThptRoom.jsx'));
const PageVocabulary = lazy(() => import('./components/pages/PageVocabulary.jsx'));
const PageDictionary = lazy(() => import('./components/pages/PageDictionary.jsx'));
const PageSettings = lazy(() => import('./components/pages/PageSettings.jsx'));
const PageProfile = lazy(() => import('./components/pages/PageProfile.jsx'));
const PageBilingualReading = lazy(() => import('./components/pages/PageBilingualReading.jsx'));
const PageLearning = lazy(() => import('./components/pages/PageLearning.jsx'));
const PageAdmin = lazy(() => import('./components/admin/PageAdmin.jsx'));

function AppRoutes() {
  const { currentRoute, isMainTab, isTopicDetail, navigateTo } = useRoute();
  const { user, loading } = useAuth();

  // Auto-redirect to dashboard if user is authenticated and lands on login or from OAuth callback
  React.useEffect(() => {
    if (!loading && user) {
      if (currentRoute === 'login') {
        navigateTo('dashboard');
      } else if (currentRoute === 'landing') {
        const rawHash = typeof window !== 'undefined' ? window.location.hash || '' : '';
        const rawSearch = typeof window !== 'undefined' ? window.location.search || '' : '';
        if (rawHash.includes('access_token=') || rawSearch.includes('code=')) {
          navigateTo('dashboard');
        }
      }
    }
  }, [user, loading, currentRoute, navigateTo]);

  // Prefetch topics in background idle time so opening "Chủ đề" is always instantaneous
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const idlePrefetch = () => {
      import('./services/db.js').then(({ getTopics }) => {
        getTopics().catch(() => {});
      }).catch(() => {});
    };
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(idlePrefetch, { timeout: 2500 });
    } else {
      setTimeout(idlePrefetch, 800);
    }
  }, []);

  const renderActivePage = () => {
    switch (currentRoute) {
      case 'landing':
        return <PageLanding />;
      case 'features':
        return <PageFeatures />;
      case 'reviews':
        return <PageReviews />;
      case 'faq':
        return <PageFaq />;
      case 'support':
        return <PageSupport />;
      case 'login':
        return <PageLogin />;
      case 'dashboard':
        return <ProtectedRoute><PageDashboard /></ProtectedRoute>;
      case 'topics':
        return <PageTopics />;
      case 'library':
        return <PageLibrary />;
      case 'topic-detail':
        return <PageTopicDetail />;
      case 'lesson-detail':
        return <PageLessonDetail />;
      case 'exercises':
        return <PageExercises />;
      case 'thpt-room':
        return <PageThptRoom />;
      case 'vocabulary':
        return <ProtectedRoute><PageVocabulary /></ProtectedRoute>;
      case 'dictionary':
        return <ProtectedRoute><PageDictionary /></ProtectedRoute>;
      case 'settings':
      case 'profile':
        return <ProtectedRoute><PageProfile /></ProtectedRoute>;
      case 'bilingual-reading':
        return <PageBilingualReading />;
      case 'learning':
        return <PageLearning />;
      case 'admin':
        return <PageAdmin />;
      default:
        return <PageLanding />;
    }
  };

  const shouldShowSidebar =
    (isMainTab || isTopicDetail) &&
    currentRoute !== 'landing' &&
    currentRoute !== 'learning' &&
    currentRoute !== 'bilingual-reading' &&
    currentRoute !== 'thpt-room' &&
    currentRoute !== 'admin' &&
    currentRoute !== 'login';

  const shouldShowBottomNav =
    (isMainTab || isTopicDetail) &&
    currentRoute !== 'landing' &&
    currentRoute !== 'learning' &&
    currentRoute !== 'bilingual-reading' &&
    currentRoute !== 'thpt-room' &&
    currentRoute !== 'admin';

  return (
    <div id="app-root" className="min-h-screen bg-background text-on-background font-sans antialiased">
      {/* Conditionally render Layout components only when needed */}
      {shouldShowSidebar && <MainSidebar />}
      {(isMainTab || isTopicDetail) && <MobileProfileDropdown />}
      {shouldShowBottomNav && <MobileBottomNav />}

      {/* Render active page inside ErrorBoundary and Suspense to prevent blank screen */}
      <ErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          {renderActivePage()}
        </Suspense>
      </ErrorBoundary>

      <Suspense fallback={null}>
        <BugReportModal />
        <SrsExplainerModal />
        <CreateTopicModal />
        <AddWordModal />
        <BulkAddWordModal />
        <PricingModal />
        <ForgotPasswordModal />
        <AuthErrorModal />
      </Suspense>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ModalProvider>
          <ToastProvider>
            <RouteProvider>
              <AppRoutes />
            </RouteProvider>
          </ToastProvider>
        </ModalProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
