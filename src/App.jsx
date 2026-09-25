// Main React Application Hosting 100% of Original Website Components
import React, { useEffect } from 'react';
import MainSidebar from './components/layout/MainSidebar.jsx';
import MobileProfileDropdown from './components/layout/MobileProfileDropdown.jsx';
import MobileBottomNav from './components/layout/MobileBottomNav.jsx';
import PageLanding from './components/pages/PageLanding.jsx';
import PageFeatures from './components/pages/PageFeatures.jsx';
import PageReviews from './components/pages/PageReviews.jsx';
import PageFaq from './components/pages/PageFaq.jsx';
import PageSupport from './components/pages/PageSupport.jsx';
import PageLogin from './components/pages/PageLogin.jsx';
import PageDashboard from './components/pages/PageDashboard.jsx';
import PageTopics from './components/pages/PageTopics.jsx';
import PageLibrary from './components/pages/PageLibrary.jsx';
import PageTopicDetail from './components/pages/PageTopicDetail.jsx';
import PageLessonDetail from './components/pages/PageLessonDetail.jsx';
import PageExercises from './components/pages/PageExercises.jsx';
import PageThptRoom from './components/pages/PageThptRoom.jsx';
import PageVocabulary from './components/pages/PageVocabulary.jsx';
import PageDictionary from './components/pages/PageDictionary.jsx';
import PageSettings from './components/pages/PageSettings.jsx';
import PageBilingualReading from './components/pages/PageBilingualReading.jsx';
import PageLearning from './components/pages/PageLearning.jsx';
import GlobalBugReportBtn from './components/common/GlobalBugReportBtn.jsx';
import Modals from './components/common/Modals.jsx';

export function App() {
  useEffect(() => {
    const initRouting = () => {
      if (typeof window !== 'undefined' && typeof window.navigateTo === 'function') {
        const curHash = (window.location.hash || '').replace(/^#/, '').replace(/^page-/, '');
        const curPath = (window.location.pathname || '').replace(/^\/+/, '').replace(/\/+$/, '');
        const isLoginRoute = (curHash === 'login' || curPath === 'login');
        const isLoggedIn = window._hasLocalAuthToken ? window._hasLocalAuthToken() : false;
        
        let targetRoute = 'dashboard';
        if (isLoginRoute) {
          targetRoute = isLoggedIn ? 'dashboard' : 'login';
        } else if (curHash && curHash !== 'landing') {
          targetRoute = curHash;
        } else {
          targetRoute = isLoggedIn ? 'dashboard' : 'landing';
        }
        window.navigateTo(targetRoute, true);
      }
    };

    if (window.navigateTo) {
      initRouting();
    } else {
      window.addEventListener('DOMContentLoaded', initRouting);
      const timer = setTimeout(initRouting, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div id="app-root" className="min-h-screen bg-background text-on-background font-sans antialiased">
      <MainSidebar />
      <MobileProfileDropdown />
      <MobileBottomNav />

      {/* Landing & Public / Auth Pages */}
      <PageLanding />
      <PageFeatures />
      <PageReviews />
      <PageFaq />
      <PageSupport />
      <PageLogin />

      {/* Main App Dashboard & Learning Pages */}
      <PageDashboard />
      <PageTopics />
      <PageLibrary />
      <PageTopicDetail />
      <PageLessonDetail />
      <PageExercises />
      <PageThptRoom />
      <PageVocabulary />
      <PageDictionary />
      <PageSettings />
      <PageBilingualReading />
      <PageLearning />

      <GlobalBugReportBtn />
      <Modals />
    </div>
  );
}

export default App;
